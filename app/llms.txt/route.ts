import { buildLlmsTxt } from "@/lib/llms";

// Yapay zekâ asistanları için site özeti (lib/llms.ts). Saatte bir yenilenir;
// admin panelden yapılan değişikliklerde de sayfalarla birlikte yenilenir.
export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  return new Response(await buildLlmsTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
