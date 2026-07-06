import { notFound } from "next/navigation";
import { adminClient } from "@/lib/data";
import ServiceForm from "@/components/admin/ServiceForm";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data } = await adminClient().from("services").select("*").eq("id", id).single();
  if (!data) notFound();

  return (
    <div>
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Hizmetler</p>
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{data.title}</h1>
      <ServiceForm
        initial={{
          id: data.id,
          slug: data.slug,
          eyebrow: data.eyebrow,
          title: data.title,
          summary: data.summary,
          description: data.description,
          bullets: data.bullets ?? [],
          audience: data.audience,
          image: data.image,
          sort_order: data.sort_order,
        }}
      />
    </div>
  );
}
