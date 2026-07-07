import { notFound } from "next/navigation";
import { adminClient } from "@/lib/data";
import VideoForm from "@/components/admin/VideoForm";

export default async function EditVideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data } = await adminClient().from("site_videos").select("*").eq("id", id).single();
  if (!data) notFound();

  return (
    <div>
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Videolar</p>
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{data.title}</h1>
      <VideoForm
        initial={{
          id: data.id,
          title: data.title,
          youtube_url: data.youtube_url,
          sort_order: data.sort_order,
        }}
      />
    </div>
  );
}
