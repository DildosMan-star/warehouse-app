"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveWarehouse(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");

  const payload = {
    code: String(formData.get("code") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim() || null,
  };

  const query = id
    ? supabase.from("warehouses").update(payload).eq("id", id)
    : supabase.from("warehouses").insert(payload);

  const { error } = await query;

  if (error) {
    redirect(`/warehouses?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/warehouses");
  redirect("/warehouses");
}

export async function deleteWarehouse(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");

  const { error } = await supabase.from("warehouses").delete().eq("id", id);

  if (error) {
    redirect(`/warehouses?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/warehouses");
  redirect("/warehouses");
}

export async function saveLocation(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const warehouseId = String(formData.get("warehouse_id") ?? "");

  const payload = {
    warehouse_id: warehouseId,
    code: String(formData.get("code") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim() || null,
  };

  const query = id
    ? supabase.from("locations").update(payload).eq("id", id)
    : supabase.from("locations").insert(payload);

  const { error } = await query;

  if (error) {
    redirect(`/warehouses/${warehouseId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/warehouses/${warehouseId}`);
  redirect(`/warehouses/${warehouseId}`);
}

export async function deleteLocation(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const warehouseId = String(formData.get("warehouse_id") ?? "");

  const { error } = await supabase.from("locations").delete().eq("id", id);

  if (error) {
    redirect(`/warehouses/${warehouseId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/warehouses/${warehouseId}`);
  redirect(`/warehouses/${warehouseId}`);
}
