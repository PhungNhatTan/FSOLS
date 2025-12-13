import React from "react";

export const Card: React.FC<
  React.PropsWithChildren<{
    title?: string;
    action?: React.ReactNode;
    className?: string;
  }>
> = ({ title, action, className = "", children }) => (
  <div
    className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}
  >
    {(title || action) && (
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold">{title}</h3>
        {action}
      </div>
    )}
    <div className="p-4">{children}</div>
  </div>
);
