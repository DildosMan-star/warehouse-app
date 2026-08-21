import { createClient } from "@/lib/supabase/server";

const MOVEMENT_LABEL: Record<string, string> = {
  in: "รับเข้า",
  out: "เบิกออก",
  transfer: "โอนย้าย",
  adjustment: "ปรับยอด",
};

export default async function DashboardPage() {
  const supabase = createClient();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    { count: productCount },
    { data: stockRows },
    { count: movementsToday },
    { data: recentMovements },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase
      .from("stock")
      .select("quantity, product_id, products ( name, sku, reorder_point )"),
    supabase
      .from("stock_movements")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfToday.toISOString()),
    supabase
      .from("stock_movements")
      .select(
        "id, type, quantity, reference_no, created_at, products ( name, sku ), locations:location_id ( code, name ), from_location:from_location_id ( code ), to_location:to_location_id ( code ), profiles ( full_name, email )"
      )
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const totalUnits = (stockRows ?? []).reduce(
    (sum, row: any) => sum + Number(row.quantity ?? 0),
    0
  );

  const byProduct = new Map<
    string,
    { name: string; sku: string; qty: number; reorder: number }
  >();

  for (const row of (stockRows ?? []) as any[]) {
    const key = row.product_id;
    const existing = byProduct.get(key) ?? {
      name: row.products?.name ?? "-",
      sku: row.products?.sku ?? "-",
      qty: 0,
      reorder: Number(row.products?.reorder_point ?? 0),
    };

    existing.qty += Number(row.quantity ?? 0);
    byProduct.set(key, existing);
  }

  const lowStock = [...byProduct.values()].filter(
    (product) => product.qty <= product.reorder
  );

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">แดชบอร์ด</h1>
        <p className="text-sm text-ink/60">ภาพรวมคลังสินค้าทั้งหมด</p>
      </header>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="จำนวน SKU ทั้งหมด" value={productCount ?? 0} />
        <KpiCard
          label="จำนวนหน่วยคงคลังรวม"
          value={totalUnits.toLocaleString()}
        />
        <KpiCard
          label="สินค้าใกล้หมด / หมด"
          value={lowStock.length}
          tone={lowStock.length > 0 ? "danger" : "good"}
        />
        <KpiCard
          label="รายการเคลื่อนไหววันนี้"
          value={movementsToday ?? 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className="card p-5 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">
            สินค้าใกล้ถึงจุดสั่งซื้อ
          </h2>

          {lowStock.length === 0 ? (
            <p className="text-sm text-ink/50">
              ยังไม่มีสินค้าที่ต่ำกว่าจุดสั่งซื้อ
            </p>
          ) : (
            <ul className="space-y-2">
              {lowStock.map((product) => (
                <li
                  key={product.sku}
                  className="flex items-center justify-between rounded-sm border border-line px-3 py-2 text-sm"
                >
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="font-mono text-xs text-ink/50">
                      {product.sku}
                    </div>
                  </div>
                  <span className="badge-danger">
                    {product.qty} / {product.reorder}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5 lg:col-span-3">
          <h2 className="mb-4 text-lg font-semibold">
            รายการเคลื่อนไหวล่าสุด
          </h2>

          <table className="table-shell">
            <thead>
              <tr>
                <th>ประเภท</th>
                <th>สินค้า</th>
                <th>ตำแหน่ง</th>
                <th>จำนวน</th>
                <th>โดย</th>
                <th>เวลา</th>
              </tr>
            </thead>
            <tbody>
              {(recentMovements ?? []).map((movement: any) => (
                <tr key={movement.id}>
                  <td>
                    <span
                      className={
                        movement.type === "in"
                          ? "badge-good"
                          : movement.type === "out"
                            ? "badge-danger"
                            : "badge-warn"
                      }
                    >
                      {MOVEMENT_LABEL[movement.type] ?? movement.type}
                    </span>
                  </td>
                  <td>
                    <div className="font-medium">
                      {movement.products?.name ?? "-"}
                    </div>
                    <div className="font-mono text-xs text-ink/50">
                      {movement.products?.sku ?? "-"}
                    </div>
                  </td>
                  <td className="font-mono text-xs">
                    {movement.type === "transfer"
                      ? `${movement.from_location?.code ?? "-"} → ${movement.to_location?.code ?? "-"}`
                      : movement.locations?.code ?? "-"}
                  </td>
                  <td className="font-mono">{movement.quantity}</td>
                  <td className="text-xs">
                    {movement.profiles?.full_name ||
                      movement.profiles?.email ||
                      "-"}
                  </td>
                  <td className="text-xs text-ink/50">
                    {new Date(movement.created_at).toLocaleString("th-TH")}
                  </td>
                </tr>
              ))}

              {(recentMovements ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-ink/40">
                    ยังไม่มีรายการเคลื่อนไหว
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

function KpiCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "danger" | "good";
}) {
  const toneClass =
    tone === "danger"
      ? "text-danger"
      : tone === "good"
        ? "text-good"
        : "text-ink";

  return (
    <div className="card p-5">
      <div className="text-xs font-semibold uppercase tracking-wider text-ink/50">
        {label}
      </div>
      <div className={`mt-2 font-display text-4xl font-bold ${toneClass}`}>
        {value}
      </div>
    </div>
  );
}
