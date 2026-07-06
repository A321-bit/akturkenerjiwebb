import { NextResponse } from "next/server";
import { adminClient } from "@/lib/data";

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
    return NextResponse.json(data);
  }

  return { GET, POST };
}

export function makeItemHandlers(table: string) {
  async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    const body = await req.json();
    delete body.id;
    const { data, error } = await adminClient()
      .from(table)
      .update(body)
      .eq("id", id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    const { error } = await adminClient().from(table).delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return { PUT, DELETE };
}
