import { NextResponse } from "next/server";
import { fetchPharmacyFeatureGaps } from "@/lib/zendesk/client";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
  if (!code) {
    return NextResponse.json({ error: "Missing code parameter" }, { status: 400 });
  }

  const subdomain = requireEnv("ZENDESK_SUBDOMAIN");
  const clientId = requireEnv("ZENDESK_OAUTH_CLIENT_ID");
  const clientSecret = requireEnv("ZENDESK_OAUTH_CLIENT_SECRET");
  const redirectUri = new URL("/api/zendesk/callback", request.url).toString();

  const tokenResponse = await fetch(`https://${subdomain}.zendesk.com/oauth/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      scope: "read",
    }),
  });

  if (!tokenResponse.ok) {
    const body = await tokenResponse.text();
    return NextResponse.json({ error: "Zendesk token exchange failed", status: tokenResponse.status, body }, { status: 502 });
  }

  const { access_token: accessToken } = (await tokenResponse.json()) as { access_token: string };

  const gaps = await fetchPharmacyFeatureGaps(accessToken);
  const byCategory = new Map<string, typeof gaps>();
  for (const gap of gaps) {
    byCategory.set(gap.category, [...(byCategory.get(gap.category) ?? []), gap]);
  }
  const sections = [...byCategory.entries()]
    .map(
      ([category, items]) => `
    <h2>${category} (${items.length})</h2>
    <ul>
      ${items
        .map(
          (i) =>
            `<li><a href="${i.url}">#${i.ticketId}</a> — ${i.subject} <em>(${i.organizationName}, ${i.status})</em></li>`,
        )
        .join("\n")}
    </ul>`,
    )
    .join("\n");

  return new NextResponse(
    `<!doctype html>
<html>
  <body style="font-family: system-ui; max-width: 720px; margin: 4rem auto; line-height: 1.5;">
    <h1>Zendesk OAuth connected — pharmacy feature-gap query via OAuth token</h1>
    <p>Fetched ${gaps.length} tickets using the Bearer token from this OAuth exchange (no static API token used).</p>
    ${sections}
  </body>
</html>`,
    { headers: { "Content-Type": "text/html" } },
  );
}
