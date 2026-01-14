import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, getErrorMessage } from "../../api/auth";
import type { LoginData, AuthResponse } from "../../types/auth";

export default function LoginPage() {
  const [form, setForm] = useState<LoginData>({ identifier: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const result: AuthResponse = await login(form);
      if (result.token) {
        setMessage("Login successful!");
        const redirectPath = result.roles?.includes("Mentor") ? "/manage/dashboard" : "/";
        setTimeout(() => navigate(redirectPath), 600);
      } else {
        setMessage(result.message || "Login failed");
      }
    } catch (err) {
      setMessage(getErrorMessage(err));
    }
  };

  return (
    <div className="p-6 max-w-sm mx-auto">
      <h2 className="text-xl font-bold mb-4 text-center">Login</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          required
          className="border p-2 w-full"
          name="identifier"
          placeholder="Username or email"
          value={form.identifier}
          onChange={handleChange}
        />

        <input
          required
          className="border p-2 w-full"
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
        />

        <button
          type="submit"
          disabled={!form.identifier || !form.password}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full disabled:opacity-50"
        >
          Login
        </button>

        {/* Forgot password link */}
        <div className="text-right">
          <Link
            to={`/forgot-password?email=${encodeURIComponent(form.identifier || "")}`}
            className="text-sm text-blue-600 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      </form>

      {message && <p className="mt-3 text-sm text-center">{message}</p>}
    </div>
  );
}
