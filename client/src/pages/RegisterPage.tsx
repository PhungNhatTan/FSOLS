import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../api/auth";
import { type AuthData, type AuthResponse } from "../types/auth";

export default function RegisterPage() {
  const [form, setForm] = useState<AuthData>({ username: "", password: "" });
  const [message, setMessage] = useState<string>("");
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const result: AuthResponse = await register(form);
      if (result.token) {
        setMessage("Registered successfully!");
        setTimeout(() => navigate("/login"), 800);
      } else {
        setMessage(result.message || "Registration failed");
      }
    } catch {
      setMessage("Server error. Try again later.");
    }
  };

  return (
    <div className="p-6 max-w-sm mx-auto">
      <h2 className="text-xl font-bold mb-4 text-center">Register</h2>
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
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full disabled:opacity-50"
        >
          Register
        </button>
      </form>
      {message && <p className="mt-3 text-sm text-center">{message}</p>}
    </div>
  );
}
