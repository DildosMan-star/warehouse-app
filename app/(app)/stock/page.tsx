import { createClient } from "@/lib/supabase/server";
import { recordTransfer, recordAdjustment } from "@/lib/actions/stock";

export default async function StockPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  const supabase = createClient();

  const [{ data: stockRows }, { data: products }, { data: warehouses }] = await Promise.all([
    supabase
      .from("stock")
      .select(
        "id, quantity, products ( id, sku, name, unit ), locations ( id, code, name, warehouses ( id, code, name ) )"
      )
      .gt("quantity", 0)
      .order("quantity", { ascending: false }),
    supabase.from("products").select("id, sku, name").order("name"),
    supabase
      .from("warehouses")
      .select("id, code, name, locations ( id, code, name )")
      .order("code"),
  ]);

  // จัดกลุ่มตามคลัง -> ตำแหน่ง
  const grouped = new Map<string, { warehouse: any; locations: Map<string, { location: any; rows: any[] }> }>();
  for (const row of (stockRows ?? []) as any[]) {
    const wh = row.locations?.warehouses;
    const loc = row.locations;
    if (!wh || !loc) continue;

    if (!grouped.has(wh.id)) {
      grouped.set(wh.id, { warehouse: wh, locations: new Map() });
    }
    const whGroup = grouped.get(wh.id)!;
    if (!whGroup.locations.has(loc.id)) {
      whGroup.locations.set(loc.id, { location: loc, rows: [] });
    }
    whGroup.locations.get(loc.id)!.rows.push(row);
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold">สต็อกคงเหลือ</h1>
        <p className="text-sm text-ink/60">
          รายละเอียดสินค้าคงเหลือ แยกตามคลังและตำแหน่งจัดเก็บ
        </p>
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
        <div className="space-y-6 lg:col-span-2">
          {[...grouped.values()].map(({ warehouse, locations }) => (
            <section key={warehouse.id} className="card p-5">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                {warehouse.name}
                <span className="font-mono text-xs font-normal text-ink/40">{warehouse.code}</span>
              </h2>
              <div className="space-y-4">
                {[...locations.values()].map(({ location, rows }) => (
                  <div key={location.id}>
                    <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-steel">
                      <span className="font-mono">{location.code}</span>
                      {location.name && <span className="text-ink/50">— {location.name}</span>}
                    </div>
                    <table className="table-shell mb-2">
                      <thead>
                        <tr>
                          <th>สินค้า</th>
                          <th>SKU</th>
                          <th>จำนวนคงเหลือ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r: any) => (
                          <tr key={r.id}>
                            <td>{r.products?.name}</td>
                            <td className="font-mono text-xs">{r.products?.sku}</td>
                            <td className="font-mono">
                              {r.quantity} {r.products?.unit}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {grouped.size === 0 && (
            <div className="card p-8 text-center text-ink/40">
              ยังไม่มีสินค้าคงคลัง ลองบันทึก "รับสินค้าเข้า" ก่อน
            </div>
          )}
        </div>

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-4 text-lg font-semibold">โอนย้ายสต็อก</h2>
            <form action={recordTransfer} className="space-y-3">
              <SelectProduct products={products ?? []} />
              <SelectLocation
                name="from_location_id"
                label="ตำแหน่งต้นทาง"
                warehouses={warehouses ?? []}
              />
              <SelectLocation
                name="to_location_id"
                label="ตำแหน่งปลายทาง"
                warehouses={warehouses ?? []}
              />
              <QuantityAndNote />
              <button type="submit" className="btn-primary w-full">
                บันทึกการโอนย้าย
              </button>
            </form>
          </section>

          <section className="card p-5">
            <h2 className="mb-4 text-lg font-semibold">ปรับยอดสต็อก</h2>
            <p className="mb-3 text-xs text-ink/50">
              ใช้เมื่อต้องปรับยอดให้ตรงกับการนับจริง (ระบุยอดใหม่ทั้งหมด ไม่ใช่ส่วนต่าง)
            </p>
            <form action={recordAdjustment} className="space-y-3">
              <SelectProduct products={products ?? []} />
              <SelectLocation
                name="location_id"
                label="ตำแหน่ง"
                warehouses={warehouses ?? []}
              />
              <div>
                <label className="label">ยอดใหม่ (นับจริง)</label>
                <input className="input font-mono" name="quantity" type="number" min={0} required />
              </div>
              <div>
                <label className="label">หมายเหตุ</label>
                <input className="input" name="note" placeholder="เช่น นับสต็อกประจำเดือน" />
              </div>
              <button type="submit" className="btn-amber w-full">
                บันทึกการปรับยอด
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

function SelectProduct({ products }: { products: any[] }) {
  return (
    <div>
      <label className="label">สินค้า</label>
      <select className="input" name="product_id" required defaultValue="">
        <option value="" disabled>
          เลือกสินค้า
        </option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.sku} — {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function SelectLocation({
  name,
  label,
  warehouses,
}: {
  name: string;
  label: string;
  warehouses: any[];
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <select className="input" name={name} required defaultValue="">
        <option value="" disabled>
          เลือกตำแหน่ง
        </option>
        {warehouses.map((wh) => (
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
  );
}

function QuantityAndNote() {
  return (
    <>
      <div>
        <label className="label">จำนวน</label>
        <input className="input font-mono" name="quantity" type="number" min={1} required />
      </div>
      <div>
        <label className="label">หมายเหตุ</label>
        <input className="input" name="note" />
      </div>
    </>
  );
}
