import { adminClient } from "@/lib/data";

type LeadRow = {
  id: number;
  created_at: string;
  fullname: string;
  phone: string;
  email: string | null;
  province: string | null;
  need_type: string;
  bill_range: string | null;
  source: string;
  status: string;
  notes: string | null;
};

function csvCell(value: string | null | undefined) {
  const str = value ?? "";
  return `"${str.replace(/"/g, '""')}"`;
}

export async function GET() {
  const { data, error } = await adminClient()
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return new Response(error.message, { status: 500 });

  const rows = data as LeadRow[];
  const header = [
    "Tarih",
    "Ad Soyad",
    "Telefon",
    "E-posta",
    "İl",
    "İhtiyaç Türü",
    "Fatura Aralığı",
    "Kaynak",
    "Durum",
    "Notlar",
  ];
  const lines = [header.map(csvCell).join(",")];
  for (const row of rows) {
    lines.push(
      [
        new Date(row.created_at).toLocaleString("tr-TR"),
        row.fullname,
        row.phone,
        row.email,
        row.province,
        row.need_type,
        row.bill_range,
        row.source,
        row.status,
        row.notes,
      ]
        .map(csvCell)
        .join(",")
    );
  }

  const csv = "﻿" + lines.join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="talepler-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
