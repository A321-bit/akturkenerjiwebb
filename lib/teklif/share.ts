import type { Proposal } from "./proposal";

// Müşteriye giden veri: maliyet ve kâr hiçbir zaman tarayıcıya inmez. Kalem fiyatları
// "teklifte göster" seçili değilse o da gönderilmez; takip alanları da çıkarılır.

export const SHARE_TOKEN = /^[a-f0-9]{32}$/;

export function forCustomer(p: Proposal): Proposal {
  const noCost = <T extends object>(o: T): T => {
    const copy = { ...o } as T & { costUsd?: unknown; marginPct?: unknown; price?: unknown };
    delete copy.costUsd;
    delete copy.marginPct;
    delete copy.price;
    return copy;
  };
  return {
    ...p,
    panel: noCost(p.panel),
    inverter: p.inverter ? noCost(p.inverter) : null,
    extraInverters: p.extraInverters?.map(noCost),
    battery: p.battery ? { ...noCost(p.battery), extras: p.battery.extras?.map((x) => ({ ...x, costUsd: 0 })) } : p.battery,
    lines: p.lines.map((l) => ({ id: l.id, ad: l.ad, adet: l.adet, birim: l.birim, kind: l.kind, birimFiyat: p.showLinePrices ? l.birimFiyat : 0 })),
    images: undefined,
    calcId: undefined,
    views: undefined,
    lastViewAt: undefined,
    notifiedAt: undefined,
  };
}
