import { useTimer } from "../../../hooks/useTimer"
import type { TimerProps } from "../../../types"

interface TimerDisplayProps extends TimerProps {
  compact?: boolean
}

export default function Timer({ timeLeft, setTimeLeft, onExpire, submitted, compact = false }: TimerDisplayProps) {
  useTimer(timeLeft, setTimeLeft, onExpire, submitted)

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? "0" : ""}${s}`
  }

  const getTimerColor = () => {
    if (timeLeft <= 60) return "text-red-600"
    if (timeLeft <= 300) return "text-orange-600"
    return "text-gray-600"
  }

  if (compact) {
    return <span className={`font-mono text-sm font-semibold ${getTimerColor()}`}>{formatTime(timeLeft)}</span>
  }

  return <div className={`text-lg font-mono font-semibold ${getTimerColor()}`}>Time Left: {formatTime(timeLeft)}</div>
}
