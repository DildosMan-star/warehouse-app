"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("กรุณากรอกอีเมลและรหัสผ่าน")}`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const message =
      error.message.toLowerCase().includes("email not confirmed")
        ? "อีเมลยังไม่ได้ยืนยัน กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ"
        : error.message;

    redirect(`/login?error=${encodeURIComponent(message)}`);
  }

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!email || !password || !fullName) {
    redirect(
      `/login?mode=signup&error=${encodeURIComponent("กรุณากรอกข้อมูลให้ครบ")}`
    );
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    redirect(
      `/login?mode=signup&error=${encodeURIComponent(error.message)}`
    );
  }

  redirect(
    "/login?message=" +
      encodeURIComponent("สมัครสำเร็จ กรุณายืนยันอีเมล แล้วเข้าสู่ระบบ")
  );
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
