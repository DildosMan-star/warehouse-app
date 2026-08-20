import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import type { Profile } from "@/types/database.types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  const role = profile?.role ?? "staff";

  return (
    <div className="flex">
      <Sidebar role={role} fullName={profile?.full_name ?? null} email={user.email ?? null} />
      <main className="min-h-screen flex-1 overflow-x-hidden bg-paper p-8">{children}</main>
    </div>
  );
}
