import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/data";

// Herkese açık sayfalar önbellekten sunuluyor; içerik değişince ilgili sayfaların
// önbelleği temizlenir ki değişiklik hemen yansısın. Tüm siteyi temizlemek her
// sayfanın yeniden üretilmesine (Vercel ISR yazma kotası) yol açtığından yalnızca
// genel ayarlar (telefon, adres vb.) değişince kullanılır; diğer içerikte bölüm bazlı.
export function revalidateSite() {
  revalidatePath("/", "layout");
}

/** Bir bölümün tüm sayfaları (ör. "/blog" → /blog ve /blog/*) + ana sayfa. */
export function revalidateSection(base: string) {
  revalidatePath(base, "layout");
  revalidatePath("/");
}

/** Mağaza: tek ürün değişince ürün, kategori, mağaza ana sayfası ve ana sayfa; yoksa tüm mağaza. */
export function revalidateStore(product?: { category?: string | null; slug?: string | null }) {
  if (product?.category && product.slug) {
    revalidatePath(`/magaza/${product.category}/${product.slug}`);
    revalidatePath(`/magaza/${product.category}`);
    revalidatePath("/magaza");
    revalidatePath("/");
  } else {
    revalidateSection("/magaza");
  }
  // Merchant Center feed'i de yeni/değişen ürünleri hemen görsün.
  revalidatePath("/google-merchant-feed.xml");
}

const SECTION_OF: Record<string, string> = {
  blog_posts: "/blog",
  project_references: "/referanslarimiz",
  services: "/hizmetlerimiz",
  store_products: "/magaza",
  store_categories: "/magaza",
};
const revalidateTable = (table: string) => (SECTION_OF[table] ? revalidateSection(SECTION_OF[table]) : revalidateSite());

const TABLES_WITH_UPDATED_AT = new Set(["services", "project_references", "blog_posts", "store_products", "store_categories"]);

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
    revalidateTable(table);
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
    revalidateTable(table);
    return NextResponse.json(data);
  }

  async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    const { error } = await adminClient().from(table).delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidateTable(table);
    return NextResponse.json({ ok: true });
  }

  return { PUT, DELETE };
}
