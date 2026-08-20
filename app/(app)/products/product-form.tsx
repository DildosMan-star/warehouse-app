import { saveProduct } from "@/lib/actions/products";
import type { Product } from "@/types/database.types";

export function ProductForm({
  product,
  error,
}: {
  product?: Product | null;
  error?: string;
}) {
  return (
    <form action={saveProduct} className="card max-w-xl space-y-4 p-6">
      {product && <input type="hidden" name="id" value={product.id} />}

      {error && (
        <p className="rounded-sm bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      )}

      <div>
        <label className="label" htmlFor="sku">
          รหัสสินค้า (SKU)
        </label>
        <input
          className="input font-mono"
          id="sku"
          name="sku"
          required
          defaultValue={product?.sku}
          placeholder="SKU-0001"
        />
      </div>

      <div>
        <label className="label" htmlFor="name">
          ชื่อสินค้า
        </label>
        <input
          className="input"
          id="name"
          name="name"
          required
          defaultValue={product?.name}
          placeholder="กล่องกระดาษ A4"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="unit">
            หน่วยนับ
          </label>
          <input
            className="input"
            id="unit"
            name="unit"
            defaultValue={product?.unit ?? "ชิ้น"}
          />
        </div>
        <div>
          <label className="label" htmlFor="reorder_point">
            จุดสั่งซื้อขั้นต่ำ
          </label>
          <input
            className="input font-mono"
            id="reorder_point"
            name="reorder_point"
            type="number"
            min={0}
            defaultValue={product?.reorder_point ?? 0}
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="category">
          หมวดหมู่
        </label>
        <input
          className="input"
          id="category"
          name="category"
          defaultValue={product?.category ?? ""}
        />
      </div>

      <div>
        <label className="label" htmlFor="description">
          รายละเอียดเพิ่มเติม
        </label>
        <textarea
          className="input"
          id="description"
          name="description"
          rows={3}
          defaultValue={product?.description ?? ""}
        />
      </div>

      <div className="flex gap-2">
        <button type="submit" className="btn-primary">
          บันทึก
        </button>
        <a href="/products" className="btn-ghost">
          ยกเลิก
        </a>
      </div>
    </form>
  );
}
