import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateUserRole } from "@/lib/actions/users";
import type { UserRole } from "@/types/database.types";

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "ผู้ดูแลระบบ",
  manager: "หัวหน้าคลัง",
  staff: "พนักงาน",
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single();

  if (myProfile?.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at");

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold">ผู้ใช้งาน</h1>
        <p className="text-sm text-ink/60">
          จัดการสิทธิ์การใช้งาน — เพิ่มบัญชีใหม่ได้ที่หน้าสมัครสมาชิก (/login?mode=signup)
        </p>
      </header>

      {searchParams.error && (
        <p className="mb-4 rounded-sm bg-danger/10 px-3 py-2 text-sm text-danger">
          {searchParams.error}
        </p>
      )}

      <div className="card overflow-x-auto">
        <table className="table-shell">
          <thead>
            <tr>
              <th>ชื่อ</th>
              <th>อีเมล</th>
              <th>สิทธิ์การใช้งาน</th>
              <th>สมัครเมื่อ</th>
            </tr>
          </thead>
          <tbody>
            {(profiles ?? []).map((p) => (
              <tr key={p.id}>
                <td className="font-medium">{p.full_name || "-"}</td>
                <td className="text-sm">{p.email}</td>
                <td>
                  <form action={updateUserRole} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={p.id} />
                    <select
                      className="input w-40 py-1 text-xs"
                      name="role"
                      defaultValue={p.role}
                      disabled={p.id === user?.id}
                    >
                      {Object.entries(ROLE_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    {p.id !== user?.id && (
                      <button className="btn-ghost px-2 py-1 text-xs">บันทึก</button>
                    )}
                  </form>
                </td>
                <td className="text-xs text-ink/50">
                  {new Date(p.created_at).toLocaleDateString("th-TH")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
