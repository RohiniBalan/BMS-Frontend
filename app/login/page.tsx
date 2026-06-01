"use client";
import { useState } from "react";
import Link from "next/link";
import AuthLeftPanel from "@/components/auth/AuthLeftPanel";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { login, googleLogin, microsoftLogin } from "@/services/authService";
import { jwtDecode } from "jwt-decode";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      localStorage.setItem("accessToken", token);

      const decoded: any = jwtDecode(token);

      const user = {
        fullName: decoded?.fullName || decoded?.name,
        email: decoded?.email,
        role: decoded?.role,
      };

      localStorage.setItem("user", JSON.stringify(user));

      const role = decoded?.role;

      if (role === "ADMIN") {
        router.push("/dashboard?showHealthPopup=1");
      } else {
        router.push("/user-dashboard?showHealthPopup=1");
      }
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const data = await login(email, password);
      console.log("LOGIN RESPONSE:", data);

      const token = data?.data?.accessToken;
      const role = data?.data?.user?.role;

      if (token) {
        localStorage.setItem("accessToken", token);
      }

      if (data?.data?.user) {
        localStorage.setItem("user", JSON.stringify(data.data.user));
      }

      if (role === "ADMIN") {
        router.push("/dashboard?showHealthPopup=1");
      } else {
        router.push("/user-dashboard?showHealthPopup=1");
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    googleLogin();
  };

  const handleMicrosoftLogin = () => {
    microsoftLogin();
  };

  return (
    /* Full screen, two equal halves side by side */
    <div className="flex h-screen w-screen overflow-hidden">
      {/* ── LEFT HALF ─────────────────────────────── */}
      <AuthLeftPanel />

      {/* ── RIGHT HALF ────────────────────────────── */}
      <div
        className="flex-1 flex flex-col items-center justify-center relative overflow-hidden"
        style={{ background: "#050B18" }}
      >
        {/* Subtle grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Subtle glow top-right */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 80% 20%, rgba(0,230,118,0.04) 0%, transparent 60%)",
          }}
        />

        {/* Form box — fixed width, vertically centered */}
        <div
          className="relative z-10 w-full"
          style={{ maxWidth: 420, padding: "0 40px" }}
        >
          {/* Mobile-only logo */}
          <div className="flex lg:hidden justify-center mb-8">
            <div
              style={{
                width: 48,
                height: 48,
                background: "linear-gradient(135deg, #00E676, #00BFA5)",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width={22} height={26} viewBox="0 0 20 26" fill="none">
                <path d="M12 2L2 15H10L8 24L18 11H10L12 2Z" fill="#050B18" />
              </svg>
            </div>
          </div>

          <h2
            className="font-bold text-white"
            style={{ fontSize: 24, marginBottom: 4 }}
          >
            Welcome Back!
          </h2>
          <p style={{ fontSize: 14, color: "#8899BB", marginBottom: 28 }}>
            Sign in to continue to your Dashboard
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <Input
              label="Email address"
              type="email"
              placeholder="admin@bms.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              showPasswordToggle
              placeholder="password123"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* Remember me + Forgot */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                }}
              >
                <div
                  onClick={() => setRemember(!remember)}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    border: `1px solid ${remember ? "#00E676" : "rgba(0,230,118,0.3)"}`,
                    background: remember ? "#00E676" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    flexShrink: 0,
                  }}
                >
                  {remember && (
                    <svg width={10} height={8} viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4L3.5 6.5L9 1"
                        stroke="#050B18"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: 13, color: "#8899BB" }}>
                  Remember me
                </span>
              </label>
              <Link
                href="/forgot-password"
                style={{
                  fontSize: 13,
                  color: "#00E676",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading}>
              Sign in
            </Button>
          </form>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "20px 0",
            }}
          >
            <div
              style={{
                flex: 1,
                height: 1,
                background: "rgba(255,255,255,0.06)",
              }}
            />
            <span style={{ fontSize: 12, color: "#4A5A7A" }}>
              or continue with
            </span>
            <div
              style={{
                flex: 1,
                height: 1,
                background: "rgba(255,255,255,0.06)",
              }}
            />
          </div>

          {/* SSO */}
          <div style={{ display: "flex", gap: 10 }}>
            <SsoButton
              icon={<GoogleIcon />}
              label="Google"
              onClick={handleGoogleLogin}
            />
            <SsoButton
              icon={<MicrosoftIcon />}
              label="Microsoft"
              onClick={handleMicrosoftLogin}
            />
          </div>

          <p
            style={{
              fontSize: 13,
              color: "#8899BB",
              textAlign: "center",
              marginTop: 24,
            }}
          >
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              style={{
                color: "#00E676",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// function SsoButton({ icon, label }: { icon: React.ReactNode; label: string }) {
//   return (
//     <button
//       className="btn-secondary"
//       style={{
//         flex: 1,
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         gap: 8,
//         padding: "10px 0",
//         fontSize: 13,
//         fontWeight: 600,
//         borderRadius: 8,
//       }}
//     >
//       {icon}
//       {label}
//     </button>
//   );
// }

function SsoButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-secondary"
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "11px 0",
        fontSize: 13,
        fontWeight: 600,
        borderRadius: 8,
        marginBottom: 20,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path d="M11.4 2H2v9.4h9.4V2z" fill="#F25022" />
      <path d="M22 2h-9.4v9.4H22V2z" fill="#7FBA00" />
      <path d="M11.4 12.6H2V22h9.4v-9.4z" fill="#00A4EF" />
      <path d="M22 12.6h-9.4V22H22v-9.4z" fill="#FFB900" />
    </svg>
  );
}
