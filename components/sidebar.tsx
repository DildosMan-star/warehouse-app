import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import type { UserRole } from "@/types/database.types";

const NAV_ITEMS: { href: string; label: string; roles: UserRole[] }[] = [
  { href: "/dashboard", label: "แดชบอร์ด", roles: ["admin", "manager", "staff"] },
  { href: "/stock", label: "สต็อกคงเหลือ", roles: ["admin", "manager", "staff"] },
  { href: "/stock-in", label: "รับสินค้าเข้า", roles: ["admin", "manager", "staff"] },
  { href: "/stock-out", label: "เบิกสินค้าออก", roles: ["admin", "manager", "staff"] },
  { href: "/products", label: "สินค้า (SKU)", roles: ["admin", "manager", "staff"] },
  { href: "/warehouses", label: "คลัง / ตำแหน่ง", roles: ["admin", "manager"] },
  { href: "/users", label: "ผู้ใช้งาน", roles: ["admin"] },
];

export function Sidebar({
  role,
  fullName,
  email,
}: {
  role: UserRole;
  fullName: string | null;
  email: string | null;
}) {
  const roleLabel = { admin: "ผู้ดูแลระบบ", manager: "หัวหน้าคลัง", staff: "พนักงาน" }[role];

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-line bg-ink text-white">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="h-8 w-2 bg-hazard" />
        <div>
          <div className="font-display text-lg font-semibold leading-none">คลังสินค้า</div>
          <div className="text-[10px] uppercase tracking-widest text-white/40">
            Warehouse System
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.filter((item) => item.roles.includes(role)).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-sm px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="mb-2 truncate text-sm font-medium">{fullName || email}</div>
        <div className="mb-3 text-xs text-white/40">{roleLabel}</div>
        <form action={signOut}>
          <button className="w-full rounded-sm border border-white/20 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10">
            ออกจากระบบ
          </button>
        </form>
      </div>
    </aside>
  );
}
