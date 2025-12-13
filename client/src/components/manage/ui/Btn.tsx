import React from "react";

export type BtnProps = React.PropsWithChildren<{
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md";
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}>;

export const Btn: React.FC<BtnProps> = ({
  variant = "outline",
  size = "md",
  className = "",
  children,
  onClick,
  type = "button",
  disabled = false,
}) => {
  const base =
    "inline-flex items-center justify-center rounded-xl font-medium transition focus:outline-none";
  const sz = size === "sm" ? "px-3 py-1.5 text-sm" : "px-3.5 py-2";
  const map: Record<string, string> = {
    primary: disabled
      ? "bg-indigo-400 text-white"
      : "bg-indigo-600 text-white hover:opacity-90",
    outline: disabled
      ? "border border-slate-300 bg-slate-100 text-slate-500"
      : "border border-slate-300 bg-white hover:bg-slate-50",
    ghost: disabled ? "opacity-50" : "hover:bg-white/10",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sz} ${map[variant]} ${className}`}
    >
      {children}
    </button>
  );
};
