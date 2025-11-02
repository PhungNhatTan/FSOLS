import { useTimer } from "../hooks/useTimer";

interface TimerProps {
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  onExpire: () => void;
  submitted: boolean;
}

export default function Timer({ timeLeft, setTimeLeft, onExpire, submitted }: TimerProps) {
  useTimer(timeLeft, setTimeLeft, onExpire, submitted);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="mb-4 text-red-600 font-semibold text-lg">
      Time Left: {formatTime(timeLeft)}
    </div>
  );
}
