import { notFound } from "next/navigation";
import { adminClient } from "@/lib/data";
import CategoryForm, { type CategoryFormValues } from "@/components/admin/store/CategoryForm";

export default async function EditStoreCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "yeni";
  const { data } = isNew ? { data: null } : await adminClient().from("store_categories").select("*").eq("id", id).single();
  if (!isNew && !data) notFound();

  const initial: CategoryFormValues = data
    ? {
        id: data.id,
        slug: data.slug,
        name: data.name,
        short: data.short ?? "",
        intro: data.intro ?? "",
        content: data.content ?? "",
        image: data.image,
        icon: data.icon,
        seo_title: data.seo_title ?? "",
        seo_description: data.seo_description ?? "",
        sort_order: data.sort_order,
        active: data.active,
        margin_pct: data.margin_pct != null ? String(data.margin_pct).replace(".", ",") : "",
        list_margin_pct: data.list_margin_pct != null ? String(data.list_margin_pct).replace(".", ",") : "",
      }
    : {
        slug: "",
        name: "",
        short: "",
        intro: "",
        content: "",
        image: null,
        icon: "sun",
        seo_title: "",
        seo_description: "",
        sort_order: 100,
        active: true,
        margin_pct: "",
        list_margin_pct: "",
      };

  return (
    <div>
      <h2 className="mb-4 font-display text-xl font-semibold">{isNew ? "Yeni kategori" : data.name}</h2>
      <CategoryForm initial={initial} />
    </div>
  );
}
