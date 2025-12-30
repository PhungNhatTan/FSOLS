"use client"

import type React from "react"

import Timer from "./Timer"

interface ExamHeaderProps {
  examTitle: string
  timeLeft: number
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>
  submitted: boolean
  onToggleSidebar: () => void
  sidebarOpen: boolean
  onTimeExpired: () => void
}

export default function ExamHeader({
  examTitle,
  timeLeft,
  setTimeLeft,
  submitted,
  onToggleSidebar,
  sidebarOpen,
  onTimeExpired,
}: ExamHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side: Menu and title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-lg"
            aria-label="Toggle sidebar"
            title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            {sidebarOpen ? "✕" : "☰"}
          </button>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-gray-900">{examTitle}</h1>
          </div>
        </div>

        {/* Right side: Timer */}
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
          <span className="text-gray-600 text-lg">⏱</span>
          <Timer timeLeft={timeLeft} setTimeLeft={setTimeLeft} onExpire={onTimeExpired} submitted={submitted} />
        </div>
      </div>
    </header>
  )
}
