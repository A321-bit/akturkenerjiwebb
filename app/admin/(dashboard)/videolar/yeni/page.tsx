"use client";

import VideoForm from "@/components/admin/VideoForm";

export default function NewVideoPage() {
  return (
    <div>
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Videolar</p>
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Yeni Video</h1>
      <VideoForm initial={{ title: "", youtube_url: "", sort_order: 0 }} />
    </div>
  );
}
