import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import accountModel from "../../models/account/index.js";

export default async function login(req, res) {
  try {
    const { username, password } = req.body;

    const accountIdentifier = await accountModel.authenticate(username);
    if (!accountIdentifier) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const account = accountIdentifier.Account;

    const validPassword = await bcrypt.compare(password, accountIdentifier.Secret);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const roles = account.AccountRole.length > 0
      ? account.AccountRole.map((r) => r.Role)
      : ["Student"];

    const token = jwt.sign(
      {
        userId: account.Id,
        username: account.Username,
        roles,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token, roles });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
}
