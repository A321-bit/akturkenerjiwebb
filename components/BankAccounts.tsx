import CopyButton from "./CopyButton";

// Resmi banka hesaplarımız: kurumsal iletişim sayfası ve mağaza sipariş hattı
// sayfası aynı listeyi kullanır (hesap değişirse tek yerden güncellenir).
export const COMPANY_TITLE = "Akturk Yenilenebilir Enerji Teknolojileri San. Tic. Ltd.";

export const BANK_ACCOUNTS = [
  {
    bankName: "VakıfBank",
    branch: "1096 - Esertepe / Ankara",
    accounts: [
      { label: "TL", iban: "TR06 0001 5001 5800 7314 9556 86" },
      { label: "USD", iban: "TR18 0001 5001 5804 8020 8240 80" },
      { label: "EURO", iban: "TR55 0001 5001 5804 8020 8240 93" },
    ],
  },
  {
    bankName: "Türkiye Ziraat Bankası",
    branch: "1274 - Esertepe / Ankara",
    accounts: [
      { label: "TL", iban: "TR03 0001 0021 0191 5377 6550 02" },
      { label: "USD", iban: "TR73 0001 0021 0191 5377 6550 03" },
      { label: "EURO", iban: "TR46 0001 0021 0191 5377 6550 04" },
    ],
  },
];

export default function BankAccounts({ copyable = false }: { copyable?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {BANK_ACCOUNTS.map((b) => (
        <div key={b.bankName} className="rounded-2xl border border-line bg-paper-raised p-5">
          <p className="text-[14.5px] font-semibold text-ink">{b.bankName}</p>
          <p className="text-[12.5px] text-slate-soft">{b.branch}</p>
          <div className="mt-3 flex flex-col gap-2">
            {b.accounts.map(({ label, iban }) => (
              <div key={label} className="flex items-center justify-between gap-2 rounded-lg bg-ink/[0.03] px-3 py-2">
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-soft">{label}</span>
                  <span className="font-mono-data text-[13px] tracking-wide text-ink">{iban}</span>
                </span>
                {copyable && <CopyButton text={iban.replace(/\s/g, "")} label={`${b.bankName} ${label} IBAN'ını kopyala`} />}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
