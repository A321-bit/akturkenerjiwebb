import StoreAdminNav from "@/components/admin/store/StoreAdminNav";

export default function StoreAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono-data text-[12px] uppercase tracking-[0.16em] text-brand">Mağaza</p>
      <h1 className="mb-4 mt-1 font-display text-2xl font-semibold tracking-tight">Mağaza Yönetimi</h1>
      <StoreAdminNav />
      {children}
    </div>
  );
}
