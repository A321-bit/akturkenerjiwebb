import { notFound } from "next/navigation";
import { adminClient } from "@/lib/data";
import ReferenceForm from "@/components/admin/ReferenceForm";

export default async function EditReferencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data } = await adminClient().from("project_references").select("*").eq("id", id).single();
  if (!data) notFound();

  return (
    <div>
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Referanslar</p>
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{data.title}</h1>
      <ReferenceForm
        initial={{
          id: data.id,
          slug: data.slug,
          title: data.title,
          category: data.category,
          location: data.location,
          address: data.address,
          capacity: data.capacity,
          year: data.year,
          summary: data.summary,
          description: data.description,
          image: data.image,
          gallery: data.gallery ?? [],
          sort_order: data.sort_order,
        }}
      />
    </div>
  );
}
