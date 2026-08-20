import { ProductForm } from "../product-form";

export default function NewProductPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">เพิ่มสินค้าใหม่</h1>
      <ProductForm error={searchParams.error} />
    </div>
  );
}
