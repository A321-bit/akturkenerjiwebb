// Teklifi tek PDF yapar: ekrandaki sayfalar görsel olarak, ürün datasheet'leri kendi PDF sayfalarıyla eklenir.
// Her şey tarayıcıda çalışır; sunucu ya da dış servis gerekmez. Teşekkür sayfası en sonda kalır.

export type Attachment = { ad: string; url: string };

const A4: [number, number] = [595.28, 841.89];

export async function buildProposalPdf(root: HTMLElement, attachments: Attachment[], onProgress?: (pct: number) => void) {
  const [{ PDFDocument }, { toJpeg, getFontEmbedCSS }] = await Promise.all([import("pdf-lib"), import("html-to-image")]);
  const out = await PDFDocument.create();
  const sheets = [...root.querySelectorAll<HTMLElement>(".proposal-sheet")];
  const body = sheets.filter((s) => !s.dataset.final);
  const final = sheets.filter((s) => s.dataset.final);
  const total = sheets.length + attachments.length;
  let done = 0;
  const step = () => onProgress?.(Math.round((++done / total) * 100));
  const fontEmbedCSS = await getFontEmbedCSS(body[0]).catch(() => undefined);

  const addSheet = async (el: HTMLElement) => {
    const jpg = await toJpeg(el, { quality: 0.9, pixelRatio: 2, backgroundColor: "#060a14", fontEmbedCSS, style: { boxShadow: "none", margin: "0" } });
    const img = await out.embedJpg(jpg);
    // İçerik A4'ten uzunsa sayfa da uzar, yazı kesilmez.
    const h = Math.max(A4[1], (img.height / img.width) * A4[0]);
    const page = out.addPage([A4[0], h]);
    page.drawImage(img, { x: 0, y: h - (img.height / img.width) * A4[0], width: A4[0], height: (img.height / img.width) * A4[0] });
    step();
  };

  for (const el of body) await addSheet(el);

  const failed: string[] = [];
  for (const a of attachments) {
    try {
      const res = await fetch(a.url);
      if (!res.ok) throw new Error(String(res.status));
      const src = await PDFDocument.load(await res.arrayBuffer(), { ignoreEncryption: true });
      for (const page of await out.copyPages(src, src.getPageIndices())) out.addPage(page);
    } catch {
      failed.push(a.ad);
    }
    step();
  }

  for (const el of final) await addSheet(el);
  return { bytes: await out.save(), failed, pages: out.getPageCount() };
}
