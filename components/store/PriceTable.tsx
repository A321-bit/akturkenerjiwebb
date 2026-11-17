import Link from "next/link";
import { FileText } from "lucide-react";
import type { StoreProduct } from "@/lib/store";
import { priceLabel } from "@/lib/store";
import { productHref } from "@/lib/store-details";
import { cdnImage } from "@/lib/imageLoader";

// Marka ve güce göre fiyat listesi: model, güç, fiyat ve (varsa) datasheet bağlantısı.
export default function PriceTable({ products, caption }: { products: StoreProduct[]; caption?: string }) {
  if (!products.length) return null;
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-paper-raised">
      <table className="w-full min-w-[520px] text-left text-[14px]">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="border-b border-line text-[12.5px] uppercase tracking-wide text-slate-soft">
          <tr>
            <th className="px-4 py-3 font-semibold">Model</th>
            <th className="px-4 py-3 font-semibold">Güç / Kapasite</th>
            <th className="px-4 py-3 text-right font-semibold">Fiyat</th>
            <th className="px-4 py-3 text-center font-semibold">Datasheet</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-line last:border-0">
              <td className="px-4 py-3">
                <Link href={productHref(p)} className="font-medium text-ink hover:text-brand">
                  {p.name}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate">{p.power}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-ink">{priceLabel(p)}</td>
              <td className="px-4 py-3 text-center">
                {p.datasheet ? (
                  <a href={cdnImage(p.datasheet)} target="_blank" rel="noopener noreferrer" aria-label={`${p.name} datasheet (PDF)`} className="inline-flex text-brand hover:text-ink">
                    <FileText size={18} />
                  </a>
                ) : (
                  <span className="text-slate-soft">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
