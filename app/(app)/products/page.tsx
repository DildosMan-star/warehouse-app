import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteProduct } from "@/lib/actions/products";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">สินค้า (SKU)</h1>
          <p className="text-sm text-ink/60">รายการสินค้าทั้งหมดในระบบ</p>
        </div>
        <Link href="/products/new" className="btn-primary">
          + เพิ่มสินค้าใหม่
        </Link>
      </header>

      {searchParams.error && (
        <p className="mb-4 rounded-sm bg-danger/10 px-3 py-2 text-sm text-danger">
          {searchParams.error}
        </p>
      )}

      <div className="card overflow-x-auto">
        <table className="table-shell">
          <thead>
            <tr>
              <th>SKU</th>
              <th>ชื่อสินค้า</th>
              <th>หมวดหมู่</th>
              <th>หน่วย</th>
              <th>จุดสั่งซื้อ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => (
              <tr key={p.id}>
                <td className="font-mono text-xs">{p.sku}</td>
                <td className="font-medium">{p.name}</td>
                <td>{p.category || "-"}</td>
                <td>{p.unit}</td>
                <td className="font-mono">{p.reorder_point}</td>
                <td className="whitespace-nowrap text-right">
                  <Link href={`/products/${p.id}/edit`} className="btn-ghost mr-2 px-3 py-1 text-xs">
                    แก้ไข
                  </Link>
                  <form action={deleteProduct} className="inline">
                    <input type="hidden" name="id" value={p.id} />
                    <button className="btn-danger px-3 py-1 text-xs">ลบ</button>
                  </form>
                </td>
              </tr>
            ))}
            {(products ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-ink/40">
                  ยังไม่มีสินค้าในระบบ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
