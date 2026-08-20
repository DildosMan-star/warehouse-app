import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { saveLocation, deleteLocation } from "@/lib/actions/warehouses";

export default async function WarehouseDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();

  const [{ data: warehouse }, { data: locations }] = await Promise.all([
    supabase.from("warehouses").select("*").eq("id", params.id).single(),
    supabase
      .from("locations")
      .select("*")
      .eq("warehouse_id", params.id)
      .order("code"),
  ]);

  if (!warehouse) notFound();

  return (
    <div>
      <Link href="/warehouses" className="mb-4 inline-block text-sm text-steel hover:underline">
        ← กลับไปหน้ารายการคลัง
      </Link>
      <header className="mb-6">
        <h1 className="text-3xl font-bold">{warehouse.name}</h1>
        <p className="font-mono text-sm text-ink/50">{warehouse.code}</p>
      </header>

      {searchParams.error && (
        <p className="mb-4 rounded-sm bg-danger/10 px-3 py-2 text-sm text-danger">
          {searchParams.error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">ตำแหน่งจัดเก็บภายในคลัง</h2>
          <table className="table-shell">
            <thead>
              <tr>
                <th>รหัสตำแหน่ง</th>
                <th>ชื่อ / คำอธิบาย</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(locations ?? []).map((loc) => (
                <tr key={loc.id}>
                  <td className="font-mono text-xs">{loc.code}</td>
                  <td>{loc.name || "-"}</td>
                  <td className="text-right">
                    <form action={deleteLocation} className="inline">
                      <input type="hidden" name="id" value={loc.id} />
                      <input type="hidden" name="warehouse_id" value={warehouse.id} />
                      <button className="btn-danger px-3 py-1 text-xs">ลบ</button>
                    </form>
                  </td>
                </tr>
              ))}
              {(locations ?? []).length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center text-ink/40">
                    ยังไม่มีตำแหน่งจัดเก็บในคลังนี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="card h-fit p-5">
          <h2 className="mb-4 text-lg font-semibold">เพิ่มตำแหน่งใหม่</h2>
          <form action={saveLocation} className="space-y-4">
            <input type="hidden" name="warehouse_id" value={warehouse.id} />
            <div>
              <label className="label" htmlFor="code">
                รหัสตำแหน่ง
              </label>
              <input
                className="input font-mono"
                id="code"
                name="code"
                required
                placeholder="A-03"
              />
            </div>
            <div>
              <label className="label" htmlFor="name">
                ชื่อ / คำอธิบาย
              </label>
              <input className="input" id="name" name="name" placeholder="โซน A ชั้น 3" />
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
