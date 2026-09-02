import { NextResponse } from "next/server";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export async function GET(request: Request) {
  const subdomain = requireEnv("ZENDESK_SUBDOMAIN");
  const clientId = requireEnv("ZENDESK_OAUTH_CLIENT_ID");
  const redirectUri = new URL("/api/zendesk/callback", request.url).toString();

  const authorizeUrl = new URL(`https://${subdomain}.zendesk.com/oauth/authorizations/new`);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", "read");

  return NextResponse.redirect(authorizeUrl);
}
