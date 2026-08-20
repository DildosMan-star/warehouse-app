import { signIn, signUp } from "@/lib/actions/auth";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { mode?: string; error?: string; message?: string };
}) {
  const isSignup = searchParams.mode === "signup";

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-10 w-2 bg-hazard" />
          <div>
            <h1 className="text-3xl font-bold text-white">คลังสินค้า</h1>
            <p className="text-xs uppercase tracking-widest text-white/50">
              Warehouse System
            </p>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 text-xl font-semibold">
            {isSignup ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
          </h2>

          {searchParams.error && (
            <p className="mb-4 rounded-sm bg-danger/10 px-3 py-2 text-sm text-danger">
              {searchParams.error}
            </p>
          )}
          {searchParams.message && (
            <p className="mb-4 rounded-sm bg-good/10 px-3 py-2 text-sm text-good">
              {searchParams.message}
            </p>
          )}

          <form action={isSignup ? signUp : signIn} className="space-y-4">
            {isSignup && (
              <div>
                <label className="label" htmlFor="full_name">
                  ชื่อ-นามสกุล
                </label>
                <input
                  className="input"
                  id="full_name"
                  name="full_name"
                  required
                  placeholder="สมชาย ใจดี"
                />
              </div>
            )}
            <div>
              <label className="label" htmlFor="email">
                อีเมล
              </label>
              <input
                className="input"
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                รหัสผ่าน
              </label>
              <input
                className="input"
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="อย่างน้อย 6 ตัวอักษร"
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              {isSignup ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-ink/60">
            {isSignup ? (
              <>
                มีบัญชีอยู่แล้ว?{" "}
                <a className="font-semibold text-steel" href="/login">
                  เข้าสู่ระบบ
                </a>
              </>
            ) : (
              <>
                ยังไม่มีบัญชี?{" "}
                <a className="font-semibold text-steel" href="/login?mode=signup">
                  สมัครสมาชิก
                </a>
              </>
            )}
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-white/40">
          ผู้สมัครคนแรกของระบบจะได้รับสิทธิ์ผู้ดูแลระบบ (admin) โดยอัตโนมัติ
        </p>
      </div>
    </div>
  );
}
