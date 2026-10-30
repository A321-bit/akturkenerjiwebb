import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";
import { currentUser, requireAdmin } from "@/lib/admin-guard";
import { permsOf } from "@/lib/staff";
import { saleOnly } from "@/lib/teklif/costs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const { data, error } = await adminClient().from("proposals").select("id, data, assigned_to, customers(assigned_to)").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  const user = await currentUser();
  const perms = permsOf(user);
  const owner = data.assigned_to ?? (data.customers as unknown as { assigned_to: number | null } | null)?.assigned_to ?? null;
  if (user?.kind === "staff" && !perms.allCustomers && owner != null && owner !== user.id) return NextResponse.json({ error: "Bu teklif size atanmamış." }, { status: 403 });
  return NextResponse.json({ ...(perms.cost ? data.data : saleOnly(data.data)), id: data.id });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  if ((await currentUser())?.kind !== "owner") return NextResponse.json({ error: "Teklifi yalnız sahip hesabı silebilir." }, { status: 403 });
  const { id } = await ctx.params;
  const { error } = await adminClient().from("proposals").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
