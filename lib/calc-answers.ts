// Hesaplayıcıda müşterinin girdiği bilgiler ve çıkan sonuç, satış ekibinin okuyacağı "soru: cevap" satırlarına çevrilir.
// CRM köprüsü (/api/crm?r=talepler) bunu gönderir; personel müşteriyi aramadan önce ne girdiğini görür.
import { ABONE_ADLARI, type AboneGrubu } from "./elektrik-tarife";
import { URUNLER, YONTEMLER, ENERJILER, type Urun, type Yontem, type Enerji } from "./sulama-calc";
import { BINA_ADLARI, YALITIM_ADLARI, TESISAT_ADLARI, YAKITLAR, type BinaTipi, type Yalitim, type Tesisat, type Yakit } from "./isipompasi-calc";

export type CalcAnswer = { name: string; value: string };
type J = Record<string, unknown>;

const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const fmt = (v: unknown, unit = "", d = 0) => {
  const x = n(v);
  return x === null ? null : `${x.toLocaleString("tr-TR", { maximumFractionDigits: d })}${unit ? ` ${unit}` : ""}`;
};
const ROOF: Record<string, string> = { egimli: "Kiremit / eğimli", duz: "Düz beton / teras", trapez: "Trapez sac / sandviç" };
const PROFILE: Record<string, string> = { dengeli: "Dengeli", yaz_klima: "Yazın klima ağırlıklı", kis_isitma: "Kışın elektrikle ısınma", gunduz_isyeri: "Gündüz (işyeri)" };
const direction = (az: unknown) => {
  const a = n(az);
  if (a === null) return null;
  if (Math.abs(a) <= 22) return "Güney";
  if (a < -67) return "Doğu";
  if (a > 67) return "Batı";
  return a < 0 ? "Güneydoğu" : "Güneybatı";
};

export function calcAnswers(type: string | null, inputs: unknown, results: unknown): CalcAnswer[] {
  const i = (inputs && typeof inputs === "object" ? inputs : {}) as J;
  const r = (results && typeof results === "object" ? results : {}) as J;
  const pkg = (r.package && typeof r.package === "object" ? (r.package as J).name : null) as string | null;
  const rows: [string, string | null | undefined][] = [];

  if (type === "on_grid" || type === "off_grid") {
    rows.push(
      ["Abone tipi", ABONE_ADLARI[i.tariff as AboneGrubu]],
      ["Aylık fatura", fmt(i.monthlyBillTl, "TL")],
      ["Aylık tüketim", fmt(i.monthlyKwh, "kWh")],
      ["Elektrikli araç şarjı", n(i.evMonthlyKwh) ? fmt(i.evMonthlyKwh, "kWh/ay") : null],
      ["Sözleşme gücü", fmt(i.contractKw, "kW", 1)],
      ["Çatı tipi", ROOF[String(i.roofType)]],
      ["Çatı alanı", fmt(i.roofAreaM2, "m²")],
      ["Çatı yönü", direction(i.azimuth)],
      ["Kullanım", PROFILE[String(i.profile)]],
      ["Önerilen sistem", [fmt(r.systemKw, "kW", 1), n(r.panelCount) ? `${r.panelCount} panel` : null].filter(Boolean).join(" · ") || null],
      ["Karşılama oranı", fmt(r.coveragePct, "%")],
      ["Yıllık tasarruf", fmt(r.annualSavingTl, "TL")],
      ["Geri dönüş", fmt(r.paybackYears, "yıl", 1)],
    );
  } else if (type === "sulama") {
    rows.push(
      ["Arazi", fmt(i.donum, "dönüm")],
      ["Ürün", URUNLER[i.urun as Urun]?.ad],
      ["Sulama yöntemi", YONTEMLER[i.yontem as Yontem]?.ad],
      ["Su derinliği", fmt(i.derinlikM, "m")],
      ["Mevcut pompa", fmt(i.mevcutPompaKw, "kW", 1)],
      ["Şu anki enerji", ENERJILER[i.enerji as Enerji]],
      ["Önerilen pompa", [fmt(r.pumpKw, "kW", 1), r.pumpHp ? `${r.pumpHp} HP` : null].filter(Boolean).join(" · ") || null],
      ["Güneş paneli", fmt(r.pvKwp, "kWp", 1)],
      ["Yıllık tasarruf", fmt(r.annualSavingTl, "TL")],
      ["Geri dönüş", fmt(r.paybackYears, "yıl", 1)],
    );
  } else if (type === "isi_pompasi") {
    const y = YAKITLAR[i.yakit as Yakit];
    rows.push(
      ["Isıtılan alan", fmt(i.areaM2, "m²")],
      ["Bina", BINA_ADLARI[i.bina as BinaTipi]],
      ["Yalıtım", YALITIM_ADLARI[i.yalitim as Yalitim]],
      ["Tesisat", TESISAT_ADLARI[i.tesisat as Tesisat]],
      ["Sıcak su (kişi)", n(i.kisi) ? String(i.kisi) : null],
      ["Şu anki yakıt", y?.ad],
      ["Yakıt fiyatı", y && n(i.yakitFiyat) ? `${fmt(i.yakitFiyat, "TL", 2)} / ${y.birim}` : null],
      ["Geçen kış harcama", fmt(i.yillikHarcama, "TL")],
      ["Önerilen cihaz", fmt(r.deviceKw, "kW", 1)],
      ["Yıllık tasarruf", fmt(r.annualSavingTl, "TL")],
      ["Geri dönüş", fmt(r.paybackYears, "yıl", 1)],
    );
  }
  rows.push(["Önerilen paket", pkg]);
  return rows.filter((x): x is [string, string] => !!x[1]).map(([name, value]) => ({ name, value }));
}
