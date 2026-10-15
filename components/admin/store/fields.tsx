// Mağaza admin formlarında ortak küçük parçalar.

export function slugify(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function Field({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-slate">{label}</span>
      {children}
      {hint && <span className="text-[12px] text-slate-soft">{hint}</span>}
    </label>
  );
}

export function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-line bg-paper-raised p-5 sm:p-6">
      <div>
        <p className="font-display text-[17px] font-semibold">{title}</p>
        {desc && <p className="mt-0.5 text-[13px] text-slate">{desc}</p>}
      </div>
      {children}
    </section>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[14px] font-medium text-ink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[#0b1420]" />
      {label}
    </label>
  );
}

export function SaveBar({ saving, error, label = "Kaydet", onCancel }: { saving: boolean; error: string; label?: string; onCancel?: () => void }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center gap-3 border-t border-line bg-paper/95 px-1 py-4 backdrop-blur">
      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-ink px-6 py-3 text-[14.5px] font-semibold text-paper hover:bg-sun hover:text-ink disabled:opacity-60"
      >
        {saving ? "Kaydediliyor..." : label}
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel} className="rounded-full border border-line px-5 py-3 text-[14px] font-semibold hover:border-ink">
          Vazgeç
        </button>
      )}
      {error && <p className="text-[13px] text-red-600">{error}</p>}
    </div>
  );
}
