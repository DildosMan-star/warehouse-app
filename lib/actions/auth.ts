"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    redirect(`/login?mode=signup&error=${encodeURIComponent(error.message)}`);
  }

  // ผู้สมัครคนแรกในระบบจะได้สิทธิ์ admin อัตโนมัติจาก trigger ฝั่งฐานข้อมูล
  redirect("/login?message=" + encodeURIComponent("สมัครสำเร็จ กรุณาเข้าสู่ระบบ"));
}

export async function signOut() {
  cconst supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
