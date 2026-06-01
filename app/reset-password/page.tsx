"use client";

import AuthLeftPanel from "@/components/auth/AuthLeftPanel";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button"
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/services/authService";
import { toast } from "react-toastify";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // HANDLE SUBMIT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Invalid or expired link");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      await resetPassword(token, password, confirmPassword);

      toast.success("Password reset successful 🎉");

      router.push("/login");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Full screen, two equal halves */
    <div className="flex h-screen w-screen overflow-hidden">
      {/* ── LEFT HALF ─────────────────────────────── */}
      <AuthLeftPanel />

      {/* ── RIGHT HALF ─────────────────────────────── */}
      <div
        className="flex-1 flex flex-col items-center justify-center relative
        overflow-auto"
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
            Reset Password
          </h2>
          <p style={{ fontSize: 14, color: "#8899BB", marginBottom: 28 }}>
            Create a strong new password below...
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <Input
              label="Password"
              showPasswordToggle
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Input
              label="Password"
              showPasswordToggle
              placeholder="Retype your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button type="submit" fullWidth size="lg" loading={loading}>
              Reset Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
