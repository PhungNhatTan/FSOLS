import certificateModel from "../../models/certificate/index.js";

export default async function getMyCertificates(req, res) {
  try {
    const accountId = req.user?.accountId;
    if (!accountId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const items = await certificateModel.listByAccountId(accountId);
    return res.json(items);
  } catch (error) {
    console.error("Error fetching my certificates:", error);
    return res.status(500).json({ message: "Failed to fetch certificates" });
  }
}
