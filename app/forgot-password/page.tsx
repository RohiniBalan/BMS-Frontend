"use client";

import AuthLeftPanel from "@/components/auth/AuthLeftPanel";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/services/authService";
import { toast } from "react-toastify";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);


  // HANDLE SUBMIT
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!email) {
      toast.error("Email is required");
      return;
    }

    try {
      setLoading(true);

      const res = await forgotPassword(email);

      toast.success(res?.message || "Check your email for reset link 📩");

      setEmail("");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to send reset link",
      );
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
            Forgot Password
          </h2>

          <p style={{ fontSize: 14, color: "#8899BB", marginBottom: 28 }}>
            Don't worry! It happens. Enter your email below, and we'll send you
            instructions to reset your password.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <Input
              label="Email address"
              type="email"
              placeholder="user@bms.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" fullWidth size="lg" loading={loading}>
              Send Rest Link
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
          </div>

          <p className="text-sm text-center text-gray-700">
            Remember password?{" "}
            <Link
              href="/login"
              style={{
                fontSize: 13,
                color: "#00E676",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Login?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
