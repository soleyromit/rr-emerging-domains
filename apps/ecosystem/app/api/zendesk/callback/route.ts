import { NextResponse } from "next/server";

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

  return new NextResponse(
    `<!doctype html>
<html>
  <body style="font-family: system-ui; max-width: 640px; margin: 4rem auto; line-height: 1.5;">
    <h1>Zendesk OAuth connected</h1>
    <p>Copy this token into the <code>ZENDESK_OAUTH_TOKEN</code> environment variable, then discard this page. It will not be shown again.</p>
    <textarea readonly style="width: 100%; height: 4rem; font-family: monospace;">${accessToken}</textarea>
  </body>
</html>`,
    { headers: { "Content-Type": "text/html" } },
  );
}
