import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { requestPasswordReset, getErrorMessage } from "../../api/auth";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function ForgotPasswordPage() {
  const query = useQuery();
  const navigate = useNavigate();

  const [email, setEmail] = useState(query.get("email") || "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await requestPasswordReset(email);
      setMessage(res.message || "If the email exists, a reset code has been sent.");
      setTimeout(() => {
        navigate(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 600);
    } catch (err) {
      setMessage(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-sm mx-auto">
      <h2 className="text-xl font-bold mb-2 text-center">Forgot Password</h2>
      <p className="text-sm text-gray-600 mb-4 text-center">
        Enter your email. We will send an OTP code to confirm password reset.
      </p>

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          required
          className="border p-2 w-full"
          name="email"
          placeholder="Email"
          value={email}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
        />

        <button
          type="submit"
          disabled={!email || loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send OTP"}
        </button>
      </form>

      {message && <p className="mt-3 text-sm text-center">{message}</p>}
    </div>
  );
}
