import accountModel from "../../models/account/getAll.js"

export default async function getAllAccounts(req, res) {
  try {
    const { role } = req.query

    const accounts = await accountModel(role)

    res.json({
      success: true,
      data: accounts,
      total: accounts.length,
    })
  } catch (err) {
    console.error("Get all accounts error:", err)
    res.status(500).json({
      success: false,
      message: "Failed to fetch accounts",
      error: err.message,
    })
  }
}
