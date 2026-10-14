import Link from "next/link";
import type { ArticleBlock } from "@/lib/service-content";

// Rehber metinlerinde [metin](/adres) linkleri ve **kalın** yazıyı işler.
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) {
          return (
            <Link key={i} href={link[2]} className="font-medium text-brand underline underline-offset-2 hover:text-ink">
              {link[1]}
            </Link>
          );
        }
        const bold = part.match(/^\*\*([^*]+)\*\*$/);
        if (bold) return <strong key={i} className="font-semibold text-ink">{bold[1]}</strong>;
        return part;
      })}
    </>
  );
}

export default function ArticleBlockView({ block }: { block: ArticleBlock }) {
  if ("p" in block) {
    return (
      <p className="text-[14.5px] leading-relaxed text-slate">
        <RichText text={block.p} />
      </p>
    );
  }
  if ("h4" in block) {
    return <h4 className="mt-2 font-display text-[15.5px] font-semibold text-ink">{block.h4}</h4>;
  }
  if ("ul" in block || "ol" in block) {
    const ordered = "ol" in block;
    const items = ordered ? block.ol : block.ul;
    const Tag = ordered ? "ol" : "ul";
    return (
      <Tag className={`flex flex-col gap-1.5 pl-5 text-[14.5px] leading-relaxed text-slate ${ordered ? "list-decimal" : "list-disc"}`}>
        {items.map((it, i) => (
          <li key={i}>
            <RichText text={it} />
          </li>
        ))}
      </Tag>
    );
  }
  const { columns, rows, note } = block.table;
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[480px] text-left text-[13.5px]">
        <thead className="bg-ink text-paper">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-4 py-2.5 font-semibold">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-t border-line even:bg-paper-raised">
              {r.map((cell, ci) => (
                <td key={ci} className={`px-4 py-2.5 ${ci === 0 ? "font-medium text-ink" : "text-slate"}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {note && <p className="border-t border-line px-4 py-2 text-[12.5px] text-slate">{note}</p>}
    </div>
  );
}
