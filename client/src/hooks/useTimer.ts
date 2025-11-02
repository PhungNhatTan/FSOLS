import { useEffect } from "react";

export function useTimer(
  timeLeft: number,
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>,
  onExpire: () => void,
  submitted: boolean
) {
  useEffect(() => {
    if (!timeLeft || submitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitted, onExpire, setTimeLeft]);
}
