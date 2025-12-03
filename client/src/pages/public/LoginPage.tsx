import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/auth";
import { type AuthData, type AuthResponse } from "../../types/auth";

export default function LoginPage() {
  const [form, setForm] = useState<AuthData>({ username: "", password: "" });
  const [message, setMessage] = useState<string>("");
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

        setTimeout(() => navigate(redirectPath), 800);
      } else {
        setMessage(result.message || "Login failed");
      }
    } catch (e) {
      console.error(e);
      setMessage("Server error. Try again later.");
    }
  };

  return (
    <div className="p-6 max-w-sm mx-auto">
      <h2 className="text-xl font-bold mb-4 text-center">Login</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          required
          className="border p-2 w-full"
          name="username"
          placeholder="Username"
          value={form.username}
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
          disabled={!form.username || !form.password}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full disabled:opacity-50"
        >
          Login
        </button>
      </form>
      {message && <p className="mt-3 text-sm text-center">{message}</p>}
    </div>
  );
}
