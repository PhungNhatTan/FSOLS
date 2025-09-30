import { useState, type ChangeEvent, type FormEvent } from "react";
import { login, type AuthData, type AuthResponse } from "../api/auth";

export default function LoginPage() {
  const [form, setForm] = useState<AuthData>({ username: "", password: "" });
  const [message, setMessage] = useState<string>("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result: AuthResponse = await login(form);
    if (result.token) {
      localStorage.setItem("token", result.token);
      setMessage("Login successful!");
    } else {
      setMessage(result.message || "Login failed");
    }
  };

  return (
    <div className="p-6 max-w-sm mx-auto flex justify-center">
      <h2 className="text-xl font-bold mb-4">Login</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="border p-2 w-full"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
        />
        <br/>
        <input
          className="border p-2 w-full"
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
        />
        <br/>
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Login
        </button>
      </form>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  );
}
