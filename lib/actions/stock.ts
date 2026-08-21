"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { MovementType } from "@/types/database.types";

async function recordMovement(
  type: MovementType,
  formData: FormData,
  redirectTo: string
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const payload: Record<string, unknown> = {
    type,
    product_id: String(formData.get("product_id") ?? ""),
    quantity: Number(formData.get("quantity") ?? 0),
    reference_no: String(formData.get("reference_no") ?? "").trim() || null,
    note: String(formData.get("note") ?? "").trim() || null,
    created_by: user?.id ?? null,
  };

  if (type === "transfer") {
    payload.from_location_id = String(formData.get("from_location_id") ?? "");
    payload.to_location_id = String(formData.get("to_location_id") ?? "");
  } else {
    payload.location_id = String(formData.get("location_id") ?? "");
  }

  const { error } = await supabase.from("stock_movements").insert(payload);

  if (error) {
    redirect(`${redirectTo}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(redirectTo);
  revalidatePath("/stock");
  revalidatePath("/dashboard");
  redirect(`${redirectTo}?message=${encodeURIComponent("บันทึกรายการสำเร็จ")}`);
}

export async function recordStockIn(formData: FormData) {
  await recordMovement("in", formData, "/stock-in");
}

export async function recordStockOut(formData: FormData) {
  await recordMovement("out", formData, "/stock-out");
}

export async function recordTransfer(formData: FormData) {
  await recordMovement("transfer", formData, "/stock");
}

export async function recordAdjustment(formData: FormData) {
  await recordMovement("adjustment", formData, "/stock");
}
