function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function zendeskBaseUrl(): string {
  return `https://${requireEnv("ZENDESK_SUBDOMAIN")}.zendesk.com`;
}

function authHeader(bearerToken?: string): string {
  if (bearerToken) return `Bearer ${bearerToken}`;
  const email = requireEnv("ZENDESK_EMAIL");
  const token = requireEnv("ZENDESK_API_TOKEN");
  const credentials = Buffer.from(`${email}/token:${token}`).toString("base64");
  return `Basic ${credentials}`;
}

async function zendeskFetch(pathname: string, init?: RequestInit & { bearerToken?: string }): Promise<Response> {
  return fetch(`${zendeskBaseUrl()}${pathname}`, {
    ...init,
    headers: { ...init?.headers, Authorization: authHeader(init?.bearerToken) },
  });
}

export async function fetchTickets(params?: { perPage?: number }): Promise<unknown> {
  const query = params?.perPage ? `?per_page=${params.perPage}` : "";
  const response = await zendeskFetch(`/api/v2/tickets.json${query}`);
  if (!response.ok) {
    throw new Error(`Zendesk API error: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

type ZendeskTicket = {
  id: number;
  subject: string;
  status: string;
  organization_id: number | null;
  tags: string[];
};

type ZendeskOrganization = {
  id: number;
  name: string;
};

export type FeatureGapCategory = "Rejected" | "Parked for later" | "Open — module gap" | "Closed — module gap";

export type FeatureGapTicket = {
  ticketId: number;
  subject: string;
  status: string;
  organizationId: number | null;
  organizationName: string;
  category: FeatureGapCategory;
  url: string;
};

function categorizeFeatureGap(status: string, tags: string[]): FeatureGapCategory {
  if (tags.includes("enhancement_rejected")) return "Rejected";
  if (tags.includes("parked_for_future_consideration")) return "Parked for later";
  if (tags.includes("program_not_served_by_approve")) {
    return status === "closed" || status === "solved" ? "Closed — module gap" : "Open — module gap";
  }
  return "Parked for later";
}

/**
 * Curated via manual investigation (see conversation history), not a generic
 * search: Zendesk's own "Domain" taxonomy has no Pharmacy option, and a plain
 * full-text "pharmacy" search is dominated by false positives (internal
 * sales-demo tickets under the "Exxat" org, and MCPHS tickets that are
 * actually tagged as its Nursing department). These IDs are the ones that
 * survived that filtering as genuine pharmacy-program feature-gap tickets.
 */
const PHARMACY_FEATURE_GAP_TICKET_IDS = [295130, 223572, 395324, 319389];

export async function fetchPharmacyFeatureGaps(bearerToken?: string): Promise<FeatureGapTicket[]> {
  const subdomain = requireEnv("ZENDESK_SUBDOMAIN");
  const ticketsResponse = await zendeskFetch(
    `/api/v2/tickets/show_many.json?ids=${PHARMACY_FEATURE_GAP_TICKET_IDS.join(",")}`,
    { bearerToken },
  );
  if (!ticketsResponse.ok) {
    throw new Error(`Zendesk API error: ${ticketsResponse.status} ${await ticketsResponse.text()}`);
  }
  const { tickets } = (await ticketsResponse.json()) as { tickets: ZendeskTicket[] };

  const orgIds = [...new Set(tickets.map((t) => t.organization_id).filter((id): id is number => id != null))];
  const orgsResponse = await zendeskFetch(`/api/v2/organizations/show_many.json?ids=${orgIds.join(",")}`, {
    bearerToken,
  });
  if (!orgsResponse.ok) {
    throw new Error(`Zendesk API error: ${orgsResponse.status} ${await orgsResponse.text()}`);
  }
  const { organizations } = (await orgsResponse.json()) as { organizations: ZendeskOrganization[] };
  const orgNameById = new Map(organizations.map((o) => [o.id, o.name]));

  return tickets.map((t) => ({
    ticketId: t.id,
    subject: t.subject,
    status: t.status,
    organizationId: t.organization_id,
    organizationName: (t.organization_id && orgNameById.get(t.organization_id)) || "Unknown organization",
    category: categorizeFeatureGap(t.status, t.tags),
    url: `https://${subdomain}.zendesk.com/agent/tickets/${t.id}`,
  }));
}
