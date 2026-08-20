import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { saveWarehouse, deleteWarehouse } from "@/lib/actions/warehouses";

export default async function WarehousesPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = await createClient();
  const { data: warehouses } = await supabase
    .from("warehouses")
    .select("*, locations ( id )")
    .order("created_at", { ascending: false });

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold">คลังสินค้า / สาขา</h1>
        <p className="text-sm text-ink/60">จัดการคลังและตำแหน่งจัดเก็บภายในคลัง</p>
      </header>

      {searchParams.error && (
        <p className="mb-4 rounded-sm bg-danger/10 px-3 py-2 text-sm text-danger">
          {searchParams.error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">รายการคลัง</h2>
          <table className="table-shell">
            <thead>
              <tr>
                <th>รหัส</th>
                <th>ชื่อคลัง</th>
                <th>ที่อยู่</th>
                <th>ตำแหน่งจัดเก็บ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(warehouses ?? []).map((w: any) => (
                <tr key={w.id}>
                  <td className="font-mono text-xs">{w.code}</td>
                  <td className="font-medium">
                    <Link href={`/warehouses/${w.id}`} className="hover:text-steel">
                      {w.name}
                    </Link>
                  </td>
                  <td className="text-sm text-ink/60">{w.address || "-"}</td>
                  <td className="font-mono">{w.locations?.length ?? 0}</td>
                  <td className="whitespace-nowrap text-right">
                    <Link href={`/warehouses/${w.id}`} className="btn-ghost mr-2 px-3 py-1 text-xs">
                      จัดการตำแหน่ง
                    </Link>
                    <form action={deleteWarehouse} className="inline">
                      <input type="hidden" name="id" value={w.id} />
                      <button className="btn-danger px-3 py-1 text-xs">ลบ</button>
                    </form>
                  </td>
                </tr>
              ))}
              {(warehouses ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-ink/40">
                    ยังไม่มีคลังในระบบ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="card h-fit p-5">
          <h2 className="mb-4 text-lg font-semibold">เพิ่มคลังใหม่</h2>
          <form action={saveWarehouse} className="space-y-4">
            <div>
              <label className="label" htmlFor="code">
                รหัสคลัง
              </label>
              <input className="input font-mono" id="code" name="code" required placeholder="WH-03" />
            </div>
            <div>
              <label className="label" htmlFor="name">
                ชื่อคลัง
              </label>
              <input className="input" id="name" name="name" required placeholder="คลังสินค้าสาขา 3" />
            </div>
            <div>
              <label className="label" htmlFor="address">
                ที่อยู่
              </label>
              <textarea className="input" id="address" name="address" rows={2} />
            </div>
            <button type="submit" className="btn-primary w-full">
              บันทึก
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
