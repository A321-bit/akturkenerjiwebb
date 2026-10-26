import { NextResponse } from "next/server";
import { z } from "zod";
import { adminClient } from "@/lib/data";
import { LEAD_STATUSES, sendLeadStage, type MetaLead } from "@/lib/meta-leads";
import { requireAdmin } from "@/lib/admin-guard";

// Tek Meta form başvurusu: durum ve not. Durum değişince Meta'ya CRM aşaması
// olarak gönderilir; sonuç capi_log'a yazılır.
const schema = z.object({
  status: z.enum(LEAD_STATUSES.map((s) => s.key) as [string, ...string[]]).optional(),
  note: z.string().max(2000).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  const db = adminClient();
  const { data: cur } = await db.from("meta_leads").select("*").eq("id", id).single();
  if (!cur) return NextResponse.json({ error: "Başvuru bulunamadı." }, { status: 404 });
  const lead = cur as MetaLead;
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { updated_at: now };
  if (parsed.data.note !== undefined) patch.note = parsed.data.note;

  const status = parsed.data.status;
  if (status && status !== lead.status) {
    patch.status = status;
    patch.status_changed_at = now;
    const event = LEAD_STATUSES.find((s) => s.key === status)?.event;
    if (event) {
      const entry = await sendLeadStage(lead, event)
        .then(() => ({ event, at: now, ok: true }))
        .catch((e) => ({ event, at: now, ok: false, error: e instanceof Error ? e.message : String(e) }));
      patch.capi_log = [...(lead.capi_log ?? []), entry];
    }
  }
  const { data, error } = await db.from("meta_leads").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
