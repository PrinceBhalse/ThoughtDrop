import crypto from "crypto";

/**
 * Firebase Cloud Messaging (HTTP v1) sender.
 *
 * Deliberately dependency-free: the OAuth2 client-credentials flow is a signed
 * RS256 JWT, which Node's crypto module can produce directly.
 *
 * Enable native push by setting FIREBASE_SERVICE_ACCOUNT in the server env to
 * the JSON key downloaded from Firebase (project_id, client_email, private_key).
 */

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function isPushConfigured(): boolean {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT);
}

function readServiceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;

  try {
    // Accept raw JSON or a base64 encoded JSON blob (handy for Vercel env vars).
    const json = raw.trim().startsWith("{")
      ? raw
      : Buffer.from(raw, "base64").toString("utf-8");
    const parsed = JSON.parse(json) as ServiceAccount;
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function getAccessToken(account: ServiceAccount): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000);

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: account.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: issuedAt,
      exp: issuedAt + 3600,
    })
  );

  const signature = crypto
    .sign("RSA-SHA256", Buffer.from(`${header}.${claims}`), account.private_key)
    .toString("base64url");

  const assertion = `${header}.${claims}.${signature}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }).toString(),
  });

  if (!response.ok) {
    throw new Error(`FCM auth failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

export interface PushPayload {
  title: string;
  body: string;
  /** Optional path opened when the notification is tapped, e.g. /idea/<id>. */
  path?: string;
  notificationId?: string;
}

/**
 * Sends a push message to a list of device tokens.
 * Returns the tokens that FCM reported as unregistered so the caller can drop them.
 */
export async function sendPush(
  tokens: string[],
  payload: PushPayload
): Promise<{ sent: number; invalidTokens: string[] }> {
  const account = readServiceAccount();
  if (!account || tokens.length === 0) {
    return { sent: 0, invalidTokens: [] };
  }

  const accessToken = await getAccessToken(account);
  const endpoint = `https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`;

  let sent = 0;
  const invalidTokens: string[] = [];

  for (const token of tokens) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: {
            path: payload.path ?? "/",
            notificationId: payload.notificationId ?? "",
            createdAt: String(Date.now()),
          },
          android: {
            priority: "high",
            notification: {
              channel_id: "thoughtdrop-default",
              click_action: "OPEN_NOTIFICATION",
            },
          },
        },
      }),
    });

    if (response.ok) {
      sent += 1;
      continue;
    }

    const body = await response.text();
    if (response.status === 404 || body.includes("UNREGISTERED")) {
      invalidTokens.push(token);
    }
  }

  return { sent, invalidTokens };
}
