// controllers/accountController.js
import bcrypt from "bcrypt";
import accountModel from "../../models/account/index.js";

export async function register(req, res) {
  try {
    const { username, displayName, identifier, password, providerId } = req.body;

    // Step 1: Check duplicates
    if (await accountModel.findAccountByUsername(username)) {
      return res.status(400).json({ message: "Username already taken" });
    }
    if (await accountModel.findIdentifier(identifier)) {
      return res.status(400).json({ message: "Identifier already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const account = await accountModel.createAccount({
      username,
      displayName,
      identifier,
      password: hashedPassword,
      providerId,
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