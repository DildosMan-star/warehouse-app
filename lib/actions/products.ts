"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveProduct(formData: FormData) {
 const supabase = await createClient();

  const id = String(formData.get("id") ?? "");
  const payload = {
    sku: String(formData.get("sku") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    unit: String(formData.get("unit") ?? "ชิ้น").trim(),
    category: String(formData.get("category") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    reorder_point: Number(formData.get("reorder_point") ?? 0),
  };

  const query = id
    ? supabase.from("products").update(payload).eq("id", id)
    : supabase.from("products").insert(payload);

  const { error } = await query;

  if (error) {
    redirect(
      `/products/${id ? id + "/edit" : "new"}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/products");
  redirect("/products");
}

export async function deleteProduct(formData: FormData) {
  const supabase = createClient();
  const id = String(formData.get("id") ?? "");

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    redirect(`/products?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/products");
  redirect("/products");
}
