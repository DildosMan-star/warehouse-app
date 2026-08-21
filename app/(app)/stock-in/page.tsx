import { createClient } from "@/lib/supabase/server";
import { recordStockIn } from "@/lib/actions/stock";

export default async function StockInPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  const supabase = await createClient();

  const [{ data: products }, { data: warehouses }, { data: recent }] = await Promise.all([
    supabase.from("products").select("id, sku, name").order("name"),
    supabase
      .from("warehouses")
      .select("id, code, name, locations ( id, code, name )")
      .order("code"),
    supabase
      .from("stock_movements")
      .select(
        "id, quantity, reference_no, note, created_at, products ( name, sku ), locations:location_id ( code ), profiles ( full_name, email )"
      )
      .eq("type", "in")
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold">รับสินค้าเข้า</h1>
        <p className="text-sm text-ink/60">บันทึกการรับสินค้าเข้าคลัง เช่น จากซัพพลายเออร์</p>
      </header>

      {searchParams.error && (
        <p className="mb-4 rounded-sm bg-danger/10 px-3 py-2 text-sm text-danger">
          {searchParams.error}
        </p>
      )}
      {searchParams.message && (
        <p className="mb-4 rounded-sm bg-good/10 px-3 py-2 text-sm text-good">
          {searchParams.message}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="card p-5">
          <form action={recordStockIn} className="space-y-3">
            <div>
              <label className="label">สินค้า</label>
              <select className="input" name="product_id" required defaultValue="">
                <option value="" disabled>
                  เลือกสินค้า
                </option>
                {(products ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} — {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">ตำแหน่งจัดเก็บ</label>
              <select className="input" name="location_id" required defaultValue="">
                <option value="" disabled>
                  เลือกตำแหน่ง
                </option>
                {(warehouses ?? []).map((wh) => (
                  <optgroup key={wh.id} label={`${wh.name} (${wh.code})`}>
                    {(wh.locations ?? []).map((loc: any) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.code} {loc.name ? `— ${loc.name}` : ""}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="label">จำนวนที่รับเข้า</label>
              <input className="input font-mono" name="quantity" type="number" min={1} required />
            </div>
            <div>
              <label className="label">เลขที่เอกสารอ้างอิง</label>
              <input className="input font-mono" name="reference_no" placeholder="PO-2026-0001" />
            </div>
            <div>
              <label className="label">หมายเหตุ</label>
              <input className="input" name="note" placeholder="เช่น ชื่อซัพพลายเออร์" />
            </div>
            <button type="submit" className="btn-primary w-full">
              บันทึกรับสินค้าเข้า
            </button>
          </form>
        </section>

        <section className="card p-5 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">รายการรับเข้าล่าสุด</h2>
          <table className="table-shell">
            <thead>
              <tr>
                <th>สินค้า</th>
                <th>ตำแหน่ง</th>
                <th>จำนวน</th>
                <th>เอกสารอ้างอิง</th>
                <th>โดย</th>
                <th>เวลา</th>
              </tr>
            </thead>
            <tbody>
              {(recent ?? []).map((m: any) => (
                <tr key={m.id}>
                  <td>
                    <div className="font-medium">{m.products?.name}</div>
                    <div className="font-mono text-xs text-ink/50">{m.products?.sku}</div>
                  </td>
                  <td className="font-mono text-xs">{m.locations?.code}</td>
                  <td className="font-mono">{m.quantity}</td>
                  <td className="font-mono text-xs">{m.reference_no || "-"}</td>
                  <td className="text-xs">{m.profiles?.full_name || m.profiles?.email || "-"}</td>
                  <td className="text-xs text-ink/50">
                    {new Date(m.created_at).toLocaleString("th-TH")}
                  </td>
                </tr>
              ))}
              {(recent ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-ink/40">
                    ยังไม่มีรายการรับสินค้าเข้า
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
