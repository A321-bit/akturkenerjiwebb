"use client";

import ServiceForm from "@/components/admin/ServiceForm";

export default function NewServicePage() {
  return (
    <div>
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Hizmetler</p>
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Yeni Hizmet</h1>
      <ServiceForm
        initial={{
          slug: "",
          eyebrow: "",
          title: "",
          summary: "",
          description: "",
          bullets: [],
          audience: "",
          image: null,
          sort_order: 0,
        }}
      />
    </div>
  );
}
