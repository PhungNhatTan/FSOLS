import { useState, type ChangeEvent, type FormEvent } from "react";
import { register, type AuthData, type AuthResponse } from "../api/auth";

export default function RegisterPage() {
  const [form, setForm] = useState<AuthData>({ username: "", password: "" });
  const [message, setMessage] = useState<string>("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result: AuthResponse = await register(form);
    if (result.token) {
      localStorage.setItem("token", result.token);
      setMessage("Registered successfully!");
    } else {
      setMessage(result.message || "Registration failed");
    }
  };

  return (
    <div className="p-6 max-w-sm mx-auto">
      <h2 className="text-xl font-bold mb-4">Register</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="border p-2 w-full"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
        />
        <input
          className="border p-2 w-full"
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Register
        </button>
      </form>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  );
}
