import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/data";

// Herkese açık sayfalar önbellekten sunuluyor; içerik değişince tüm sitenin
// önbelleği temizlenir ki değişiklik hemen yansısın.
export function revalidateSite() {
  revalidatePath("/", "layout");
}

const TABLES_WITH_UPDATED_AT = new Set(["services", "project_references", "blog_posts"]);

export function makeListCreateHandlers(table: string, orderBy = "sort_order") {
  async function GET() {
    const { data, error } = await adminClient().from(table).select("*").order(orderBy);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  async function POST(req: Request) {
    const body = await req.json();
    delete body.id;
    const { data, error } = await adminClient().from(table).insert(body).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidateSite();
    return NextResponse.json(data);
  }

  return { GET, POST };
}

export function makeItemHandlers(table: string) {
  async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    const body = await req.json();
    delete body.id;
    if (TABLES_WITH_UPDATED_AT.has(table)) body.updated_at = new Date().toISOString();
    const { data, error } = await adminClient()
      .from(table)
      .update(body)
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidateSite();
    return NextResponse.json(data);
  }

  async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    const { error } = await adminClient().from(table).delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidateSite();
    return NextResponse.json({ ok: true });
  }

  return { PUT, DELETE };
}
