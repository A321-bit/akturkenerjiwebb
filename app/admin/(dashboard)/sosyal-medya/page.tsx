import { adminClient } from "@/lib/data";
import SocialPlanner from "@/components/admin/SocialPlanner";
import type { SocialPost } from "@/lib/social";

// Sosyal medya planı: Facebook + Instagram otomatik paylaşım (lib/social.ts).
export const dynamic = "force-dynamic";

export default async function SocialPage() {
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data } = await adminClient().from("social_posts").select("*").gte("scheduled_at", since).order("scheduled_at").limit(1000);
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Sosyal Medya · Otomatik Paylaşım</h1>
        <p className="mt-1 text-[13.5px] text-slate">
          Planı bir kez oluşturup onaylayın; gerisi kendiliğinden yürür. Facebook gönderileri Meta&apos;ya 29 gün önceden
          zamanlanmış olarak yüklenir (Meta en fazla 30 gün ilerisini kabul ediyor). Instagram gönderileri zamanı gelince
          (10:00 ya da 19:00) paylaşılır. Metinlerdeki <code>{"{{fiyat}}"}</code> paylaşım anındaki güncel fiyatla değişir.
        </p>
      </div>
      <SocialPlanner posts={(data ?? []) as SocialPost[]} />
    </div>
  );
}
