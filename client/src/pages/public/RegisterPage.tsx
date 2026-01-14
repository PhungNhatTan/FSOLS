import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { register, getErrorMessage } from "../../api/auth";
import type { RegisterData } from "../../types/auth";

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterData>({ username: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const result = await register(form);
      setMessage(result.message || "Registered. Check email for OTP.");
      setTimeout(() => navigate(`/verify-email?email=${encodeURIComponent(form.email)}`), 600);
    } catch (err) {
      setMessage(getErrorMessage(err));
    }
  };

  return (
    <div className="p-6 max-w-sm mx-auto">
      <h2 className="text-xl font-bold mb-4 text-center">Register</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input required className="border p-2 w-full" name="username" placeholder="Username" value={form.username} onChange={handleChange} />
        <input required className="border p-2 w-full" name="email" placeholder="Email" value={form.email} onChange={handleChange} />
        <input required className="border p-2 w-full" type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} />
        <button
          type="submit"
          disabled={!form.username || !form.email || !form.password}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full disabled:opacity-50"
        >
          Register
        </button>
      </form>
      {message && <p className="mt-3 text-sm text-center">{message}</p>}
    </div>
  );
}
