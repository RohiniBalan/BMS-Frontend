"use client";
import { useState, InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showPasswordToggle?: boolean;
}

export default function Input({ label, error, showPasswordToggle, type, className = "", ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = showPasswordToggle ? (showPassword ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium" style={{ color: "#8899BB" }}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={inputType}
          className={`input-field ${showPasswordToggle ? "pr-10" : ""} ${className}`}
          {...props}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: "#4A5A7A" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#00E676")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#4A5A7A")}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs" style={{ color: "#FF5252" }}>{error}</p>}
    </div>
  );
}
