// Elektrik faturası hesabı: EPDK nihai tarife tablosu (AG, tek zamanlı) + vergiler.
// Kaynak: EPDK "4 Nisan 2026 Tarihinden İtibaren Geçerli" tarife tablosu (kr/kWh, vergiler hariç).
// EPDK tarifeyi değiştirdiğinde yalnızca TARIFE_TABLOSU güncellenir.
//
// Fatura = (enerji bedeli × (1 + enerji fonu + belediye tüketim vergisi) + dağıtım bedeli) × (1 + KDV)
// Kademeli gruplarda (mesken, ticarethane) günlük ortalama limiti aşan tüketime yüksek kademe uygulanır.

export type AboneGrubu = "mesken" | "ticarethane" | "sanayi" | "tarimsal";

type Kademe = { enerji: number; dagitim: number };
type GrupTarifesi = {
  dusuk: Kademe;
  /** Varsa: günlük ortalama `gunlukLimitKwh` üstündeki tüketime uygulanır. */
  yuksek?: Kademe;
  gunlukLimitKwh?: number;
  /** Enerji fonu + belediye tüketim vergisi (enerji bedeli üzerinden). */
  enerjiVergisi: number;
  kdv: number;
};

export const TARIFE_TARIHI = "4 Nisan 2026";

export const TARIFE_TABLOSU: Record<AboneGrubu, GrupTarifesi> = {
  mesken: { dusuk: { enerji: 49.4065, dagitim: 242.49 }, yuksek: { enerji: 189.5808, dagitim: 242.49 }, gunlukLimitKwh: 8, enerjiVergisi: 0.06, kdv: 0.1 },
  ticarethane: { dusuk: { enerji: 287.3087, dagitim: 247.9368 }, yuksek: { enerji: 345.4688, dagitim: 247.9368 }, gunlukLimitKwh: 30, enerjiVergisi: 0.06, kdv: 0.2 },
  sanayi: { dusuk: { enerji: 298.5253, dagitim: 182.9503 }, enerjiVergisi: 0.02, kdv: 0.2 },
  tarimsal: { dusuk: { enerji: 233.3838, dagitim: 203.7247 }, enerjiVergisi: 0.06, kdv: 0.1 },
};

export const ABONE_ADLARI: Record<AboneGrubu, string> = {
  mesken: "Ev (mesken)",
  ticarethane: "İşyeri (ticarethane)",
  sanayi: "Fabrika (sanayi)",
  tarimsal: "Tarımsal sulama",
};

const GUN = 30;

/** 1 kWh'in vergiler dahil fiyatı (TL). */
function kwhFiyati(k: Kademe, t: GrupTarifesi) {
  return ((k.enerji * (1 + t.enerjiVergisi) + k.dagitim) * (1 + t.kdv)) / 100;
}

/** Bir aylık tüketimin (kWh) vergiler dahil fatura tutarı (TL). */
export function faturaTutari(grup: AboneGrubu, aylikKwh: number): number {
  const t = TARIFE_TABLOSU[grup];
  const kwh = Math.max(0, aylikKwh);
  if (!t.yuksek || !t.gunlukLimitKwh) return kwh * kwhFiyati(t.dusuk, t);
  const limit = t.gunlukLimitKwh * GUN;
  return Math.min(kwh, limit) * kwhFiyati(t.dusuk, t) + Math.max(0, kwh - limit) * kwhFiyati(t.yuksek, t);
}

/** Fatura tutarından (TL) aylık tüketimi (kWh) bulur — kademeli tarifenin tersi. */
export function faturadanTuketim(grup: AboneGrubu, faturaTl: number): number {
  const t = TARIFE_TABLOSU[grup];
  const tl = Math.max(0, faturaTl);
  const pDusuk = kwhFiyati(t.dusuk, t);
  if (!t.yuksek || !t.gunlukLimitKwh) return tl / pDusuk;
  const limit = t.gunlukLimitKwh * GUN;
  const limitTutari = limit * pDusuk;
  return tl <= limitTutari ? tl / pDusuk : limit + (tl - limitTutari) / kwhFiyati(t.yuksek, t);
}

/** Bilgi amaçlı birim fiyatlar (TL/kWh, vergiler dahil). */
export function birimFiyatlar(grup: AboneGrubu): { dusuk: number; yuksek?: number; limitAylikKwh?: number } {
  const t = TARIFE_TABLOSU[grup];
  return {
    dusuk: kwhFiyati(t.dusuk, t),
    yuksek: t.yuksek ? kwhFiyati(t.yuksek, t) : undefined,
    limitAylikKwh: t.gunlukLimitKwh ? t.gunlukLimitKwh * GUN : undefined,
  };
}
