import axios from "axios"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"

export interface Account {
  Id: string
  Username: string
  DisplayName: string
  AvatarUrl?: string
  Bio?: string
  CreatedAt: string
  AccountRole: Array<{ Role: string }>
  Mentor?: {
    Email?: string
    Phone?: string
  }
}

export const getAllAccounts = async (role?: string | null): Promise<Account[]> => {
  try {
    const token = localStorage.getItem("token")
    const url = role ? `${API_BASE_URL}/account/all?role=${role}` : `${API_BASE_URL}/account/all`

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response.data.data
  } catch (error) {
    console.error("Error fetching accounts:", error)
    throw error
  }
}
