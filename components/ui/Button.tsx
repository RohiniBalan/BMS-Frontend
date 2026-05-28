"use client";
import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const baseClass = `${variant === "primary" ? "btn-primary" : "btn-secondary"} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`;

  return (
    <button className={baseClass} disabled={disabled || loading} {...props}>
      {loading ? (
        <span
          className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
        />
      ) : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
