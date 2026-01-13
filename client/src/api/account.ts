import client from "../service/client"

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
    const url = role ? `/account/all?role=${role}` : `/account/all`
    
    const response = await client.get(url)
    
    return response.data.data
  } catch (error) {
    console.error("Error fetching accounts:", error)
    throw error
  }
}