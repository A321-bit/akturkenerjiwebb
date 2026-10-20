import { createSign } from "node:crypto";

// Google servis hesabı (GSC_SERVICE_ACCOUNT ortam değişkeni: Google'ın verdiği JSON
// anahtarın tamamı) ile OAuth erişim anahtarı. Search Console ve Analytics aynı
// servis hesabını kullanır; her biri kendi kapsamıyla (scope) anahtar alır.

type ServiceAccount = { client_email: string; private_key: string };

function serviceAccount(): ServiceAccount {
  const raw = process.env.GSC_SERVICE_ACCOUNT;
  if (!raw) throw new Error("GSC_SERVICE_ACCOUNT ortam değişkeni tanımlı değil.");
  const sa = JSON.parse(raw) as ServiceAccount;
  if (!sa.client_email || !sa.private_key) throw new Error("GSC_SERVICE_ACCOUNT geçerli bir servis hesabı anahtarı değil.");
  return sa;
}

const b64url = (s: string | Buffer) => Buffer.from(s).toString("base64url");

export async function googleAccessToken(scope: string): Promise<string> {
  const sa = serviceAccount();
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({ iss: sa.client_email, scope, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const signature = createSign("RSA-SHA256").update(`${head}.${claim}`).sign(sa.private_key).toString("base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${head}.${claim}.${signature}` }),
    cache: "no-store",
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Google oturumu açılamadı: ${body.error_description ?? body.error ?? res.status}`);
  return body.access_token as string;
}
