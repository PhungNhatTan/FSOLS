// controllers/accountController.js
import bcrypt from "bcrypt";
import accountModel from "../../models/account/index.js";

export default async function register(req, res) {
  try {
    const { username, password} = req.body;

    // Step 1: Check duplicates
    if (await accountModel.getByUsername(username)) {
      return res.status(400).json({ message: "Username already taken" });
    }
    if (await accountModel.getByIdentifier(username, 1)) {
      return res.status(400).json({ message: "Identifier already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const account = await accountModel.createAccount({
      username,
      displayName: username,
      identifier: username,
      password: hashedPassword,
      providerId: 1,
    });

    const roles = account.AccountRole.length > 0
      ? account.AccountRole.map((r) => r.Role)
      : ["Student"];

    res.status(201).json({
      message: "Account created successfully",
      account: {
        id: account.Id,
        username: account.Username,
        displayName: account.DisplayName,
        roles,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
}