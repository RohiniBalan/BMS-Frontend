"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import AuthLeftPanel from "@/components/auth/AuthLeftPanel";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { signup, googleLogin } from "@/services/authService";
import {useRouter} from "next/navigation";
import { toast } from "react-hot-toast";

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    agreed: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isFormValid =
    form.fullName &&
    form.email &&
    form.password &&
    form.confirmPassword &&
    form.phoneNumber &&
    form.agreed &&
    form.password === form.confirmPassword;

  const set = (key: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));
  

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   setTimeout(() => {
  //     setLoading(false);
  //     window.location.href = "/dashboard";
  //   }, 1200);
  // };

  // HANDLE SUBMIT
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    setLoading(true);
    setError("");

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const res = await signup({
      fullName: form.fullName,
      email: form.email,
      password: form.password,
      confirmPassword: form.confirmPassword,
      phoneNumber: form.phoneNumber,
    });

    toast.success("Account created successfully 🎉")
    const role = res?.user?.role;

    if (role === "ADMIN") {
      router.push("/dashboard");
    } else {
      router.push("/user-dashboard");
    }

  } catch (err: any) {
     const message = err?.response?.data?.message || err?.message || "Signup failed";
     toast.error(message);
  } finally {
    setLoading(false);
  }
};


// Handle Google
  const handleGoogleLogin = () => {
    toast.loading("Redirecting to Google...");
    googleLogin();
  };

  return (
    /* Full screen, two equal halves */
    <div className="flex h-screen w-screen overflow-hidden">
      {/* ── LEFT HALF ─────────────────────────────── */}
      <AuthLeftPanel />

      {/* ── RIGHT HALF ────────────────────────────── */}
      <div
        className="flex-1 flex flex-col items-center justify-center relative overflow-auto"
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
        {/* Glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 80% 20%, rgba(0,230,118,0.04) 0%, transparent 60%)",
          }}
        />

        {/* Form box */}
        <div
          className="relative z-10 w-full"
          style={{ maxWidth: 420, padding: "40px 40px" }}
        >
          {/* Mobile logo */}
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
            Create Account 🎉
          </h2>
          <p style={{ fontSize: 14, color: "#8899BB", marginBottom: 24 }}>
            Join and start learning today.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <Input
              label="Name"
              type="text"
              placeholder="Enter your name"
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="admin@bms.io"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
            <Input
              label="Password"
              showPasswordToggle
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
            />
            <Input
              label="Confirm Password"
              showPasswordToggle
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={(e) => set("confirmPassword", e.target.value)}
            />
            {error && <p style={{ color: "red", fontSize: 12 }}>{error}</p>}
            <Input
              label="Phone Number"
              type="tel"
              placeholder="Enter your phone number"
              value={form.phoneNumber}
              onChange={(e) => set("phoneNumber", e.target.value)}
            />

            {/* Terms */}
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                cursor: "pointer",
              }}
            >
              <div
                onClick={() => set("agreed", !form.agreed)}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  border: `1px solid ${form.agreed ? "#00E676" : "rgba(0,230,118,0.3)"}`,
                  background: form.agreed ? "#00E676" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                {form.agreed && (
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
              <span style={{ fontSize: 13, color: "#8899BB", lineHeight: 1.5 }}>
                I agree to the{" "}
                <Link
                  href="#"
                  style={{
                    color: "#00E676",
                    fontWeight: 500,
                    textDecoration: "none",
                  }}
                >
                  Terms &amp; Condition
                </Link>
              </span>
            </label>

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              disabled={!isFormValid}
            >
              Sign Up
            </Button>
          </form>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "16px 0",
            }}
          >
            <div
              style={{
                flex: 1,
                height: 1,
                background: "rgba(255,255,255,0.06)",
              }}
            />
            <span style={{ fontSize: 12, color: "#4A5A7A" }}>OR</span>
            <div
              style={{
                flex: 1,
                height: 1,
                background: "rgba(255,255,255,0.06)",
              }}
            />
          </div>

          {/* Google SSO */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="btn-secondary"
            style={{
              width: "100%",
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
            <GoogleIcon />
            Continue with Google
          </button>

          <p style={{ fontSize: 13, color: "#8899BB", textAlign: "center" }}>
            Already have an account?{" "}
            <Link
              href="/login"
              style={{
                color: "#00E676",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
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
