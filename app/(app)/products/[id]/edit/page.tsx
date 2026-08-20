import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "../../product-form";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!product) notFound();

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">แก้ไขสินค้า</h1>
      <ProductForm product={product} error={searchParams.error} />
    </div>
  );
}
