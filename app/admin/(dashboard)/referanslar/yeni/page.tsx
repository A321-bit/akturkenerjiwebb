"use client";

import ReferenceForm from "@/components/admin/ReferenceForm";

export default function NewReferencePage() {
  return (
    <div>
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Referanslar</p>
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Yeni Referans</h1>
      <ReferenceForm
        initial={{
          slug: "",
          title: "",
          category: "",
          location: "",
          address: null,
          capacity: "",
          year: String(new Date().getFullYear()),
          summary: "",
          description: null,
          image: null,
          gallery: [],
          video_url: null,
          sort_order: 0,
        }}
      />
    </div>
  );
}
