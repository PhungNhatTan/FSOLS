"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "../../components/manage/ui/Card"
import { Btn } from "../../components/manage/ui/Btn"
import { Modal } from "../../components/manage/ui/Modal"
import { createAccountWithRole } from "../../api/auth"
import { getAllAccounts, type Account } from "../../api/account"

interface AccountFormData {
  username: string
  displayName: string
  password: string
  role: "Moderator" | "Mentor" | ""
  email?: string
  phone?: string
}

const ROLES = ["All", "Student", "Mentor", "Moderator", "Admin"]

export default function AccountsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([])
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState("All")
  const [initialLoading, setInitialLoading] = useState(true)
  const [formData, setFormData] = useState<AccountFormData>({
    username: "",
    displayName: "",
    password: "",
    role: "",
    email: "",
    phone: "",
  })

  useEffect(() => {
    loadAccounts()
  }, [])

  useEffect(() => {
    if (selectedRole === "All") {
      setFilteredAccounts(accounts)
    } else {
      const filtered = accounts.filter((account) => {
        if (selectedRole === "Student") {
          return account.AccountRole.length === 0
        }
        return account.AccountRole.some((role) => role.Role === selectedRole)
      })
      setFilteredAccounts(filtered)
    }
  }, [selectedRole, accounts])

  const loadAccounts = async () => {
    try {
      setInitialLoading(true)
      const data = await getAllAccounts()
      setAccounts(data)
      setFilteredAccounts(data)
    } catch (err: any) {
      console.error("Error loading accounts:", err)
      setError("Failed to load accounts from database")
    } finally {
      setInitialLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")

    if (!formData.username || !formData.displayName || !formData.password || !formData.role) {
      setError("Please fill in all required fields")
      return
    }

    try {
      setLoading(true)
      await createAccountWithRole({
        username: formData.username,
        displayName: formData.displayName,
        password: formData.password,
        role: formData.role as "Mentor" | "Moderator" | "Admin",
        email: formData.email,
        phone: formData.phone,
      })

      setMessage(`Account created successfully for ${formData.displayName}`)

      setFormData({
        username: "",
        displayName: "",
        password: "",
        role: "",
        email: "",
        phone: "",
      })

      setTimeout(() => {
        setShowCreateModal(false)
        setMessage("")
        loadAccounts()
      }, 1500)
    } catch (err: any) {
      console.error("Error creating account:", err)
      setError(err.response?.data?.message || "Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  const getRoleDisplay = (account: Account) => {
    if (account.AccountRole.length === 0) {
      return "Student"
    }
    return account.AccountRole[0].Role
  }

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      Student: "bg-green-100 text-green-700",
      Mentor: "bg-blue-100 text-blue-700",
      Moderator: "bg-orange-100 text-orange-700",
      Admin: "bg-red-100 text-red-700",
    }
    return colors[role] || "bg-gray-100 text-gray-700"
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manage Accounts</h1>
        <Btn variant="primary" onClick={() => setShowCreateModal(true)}>
          Create New Account
        </Btn>
      </div>

      {message && <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">{message}</div>}
      {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

      <div className="mb-6 flex gap-2 flex-wrap">
        {ROLES.map((role) => (
          <Btn
            key={role}
            variant={selectedRole === role ? "primary" : "outline"}
            onClick={() => setSelectedRole(role)}
            className="text-sm"
          >
            {role}
            {selectedRole === role && ` (${filteredAccounts.length})`}
          </Btn>
        ))}
      </div>

      <Card title={`Account List - ${selectedRole}`} className="mb-6">
        {initialLoading ? (
          <div className="text-center py-8 text-gray-500">Loading accounts...</div>
        ) : filteredAccounts.length === 0 ? (
          <p className="text-gray-500 italic">No accounts found for {selectedRole} role.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-semibold">Username</th>
                  <th className="text-left py-3 px-2 font-semibold">Display Name</th>
                  <th className="text-left py-3 px-2 font-semibold">Role</th>
                  <th className="text-left py-3 px-2 font-semibold">Email</th>
                  <th className="text-left py-3 px-2 font-semibold">Phone</th>
                  <th className="text-left py-3 px-2 font-semibold">Created At</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account) => (
                  <tr key={account.Id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2">{account.Username}</td>
                    <td className="py-3 px-2">{account.DisplayName}</td>
                    <td className="py-3 px-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(getRoleDisplay(account))}`}
                      >
                        {getRoleDisplay(account)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-600">{account.Mentor?.Email || "-"}</td>
                    <td className="py-3 px-2 text-sm text-gray-600">{account.Mentor?.Phone || "-"}</td>
                    <td className="py-3 px-2 text-sm text-gray-600">
                      {new Date(account.CreatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showCreateModal && (
        <Modal title="Create New Account" onClose={() => setShowCreateModal(false)}>
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Display Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter display name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter password"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select a role</option>
                <option value="Mentor">Mentor</option>
                <option value="Moderator">Moderator</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email (Optional)</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone (Optional)</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter phone number"
              />
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Btn type="button" onClick={() => setShowCreateModal(false)} disabled={loading}>
                Cancel
              </Btn>
              <Btn variant="primary" type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Account"}
              </Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
