"use client";

import AuthLeftPanel from "@/components/auth/AuthLeftPanel";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/services/authService";
import { toast } from "react-toastify";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
      toast.error(
        err?.response?.data?.message ||
        err.message ||
        "Password reset failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <AuthLeftPanel />

      <div
        className="flex-1 flex flex-col items-center justify-center relative overflow-auto"
        style={{ background: "#050B18" }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 80% 20%, rgba(0,230,118,0.04) 0%, transparent 60%)",
          }}
        />

        <div
          className="relative z-10 w-full"
          style={{ maxWidth: 420, padding: "0 40px" }}
        >
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}