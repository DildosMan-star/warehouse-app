"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateUserRole(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "staff");

  const { error } = await supabase.from("profiles").update({ role }).eq("id", id);

  if (error) {
    redirect(`/users?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/users");
  redirect("/users");
}
