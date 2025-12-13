import React from "react";
import { Btn } from "./Btn";

export const Modal: React.FC<
  React.PropsWithChildren<{ title: string; onClose: () => void }>
> = ({ title, onClose, children }) => (
  <div
    className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
    onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
  >
    <div className="w-[780px] max-w-[95vw] rounded-3xl bg-white shadow-xl">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <div className="font-semibold">{title}</div>
        <Btn size="sm" onClick={onClose}>
          Close
        </Btn>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);
