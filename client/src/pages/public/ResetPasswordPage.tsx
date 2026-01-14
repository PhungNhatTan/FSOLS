import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { resetPassword, getErrorMessage } from "../../api/auth";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function ResetPasswordPage() {
  const query = useQuery();
  const navigate = useNavigate();

  const [email, setEmail] = useState(query.get("email") || "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirm) {
      setMessage("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword({ email, code, newPassword });
      setMessage(res.message || "Password reset successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 800);
    } catch (err) {
      setMessage(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-sm mx-auto">
      <h2 className="text-xl font-bold mb-2 text-center">Reset Password</h2>
      <p className="text-sm text-gray-600 mb-4 text-center">
        Enter the OTP code from your email and set a new password.
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

        <input
          required
          className="border p-2 w-full"
          name="code"
          placeholder="OTP code"
          value={code}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
        />

        <input
          required
          className="border p-2 w-full"
          type="password"
          name="newPassword"
          placeholder="New password"
          value={newPassword}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
        />

        <input
          required
          className="border p-2 w-full"
          type="password"
          name="confirm"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)}
        />

        <button
          type="submit"
          disabled={!email || !code || !newPassword || !confirm || loading}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full disabled:opacity-50"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>

      {message && <p className="mt-3 text-sm text-center">{message}</p>}
    </div>
  );
}
