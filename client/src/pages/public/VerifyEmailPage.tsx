import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyEmail, resendEmailOtp, getErrorMessage } from "../../api/auth";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function VerifyEmailPage() {
  const query = useQuery();
  const navigate = useNavigate();

  const [email, setEmail] = useState(query.get("email") || "");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await verifyEmail({ email, code });
      if (res.token) {
        setMessage("Verified! Redirecting...");
        setTimeout(() => navigate("/"), 600);
      } else {
        setMessage(res.message || "Verified. Please login.");
        setTimeout(() => navigate("/login"), 600);
      }
    } catch (err) {
      setMessage(getErrorMessage(err));
    }
  };

  const onResend = async () => {
    try {
      const res = await resendEmailOtp(email);
      setMessage(res.message || "OTP resent.");
    } catch (err) {
      setMessage(getErrorMessage(err));
    }
  };

  return (
    <div className="p-6 max-w-sm mx-auto">
      <h2 className="text-xl font-bold mb-4 text-center">Verify Email</h2>

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          required
          className="border p-2 w-full"
          name="email"
          placeholder="Email"
          value={email}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
        />
        <input
          required
          className="border p-2 w-full"
          name="code"
          placeholder="OTP code"
          value={code}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
        />
        <button
          type="submit"
          disabled={!email || !code}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded w-full disabled:opacity-50"
        >
          Verify
        </button>
      </form>

      <button
        onClick={onResend}
        disabled={!email}
        className="mt-3 border px-4 py-2 rounded w-full"
      >
        Resend OTP
      </button>

      {message && <p className="mt-3 text-sm text-center">{message}</p>}
    </div>
  );
}
