import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import accountModel from "../../models/account/index.js";

export default async function login(req, res) {
  try {
    const identifier = (req.body.identifier || req.body.username || "").trim();
    const { password } = req.body;

    if (!identifier || !password) return res.status(400).json({ message: "Missing identifier or password" });

    const accountIdentifier = await accountModel.authenticate(identifier);
    if (!accountIdentifier) return res.status(401).json({ message: "Invalid credentials" });

    const account = accountIdentifier.Account;
    const validPassword = await bcrypt.compare(password, accountIdentifier.Secret || "");
    if (!validPassword) return res.status(401).json({ message: "Invalid credentials" });

    const emailIdentity = account.AccountIdentifier?.find((ai) => ai.Provider?.Name === "email");
    if (emailIdentity && !emailIdentity.Verified) {
      return res.status(403).json({
        message: "Email not verified. Please verify your email to activate the account.",
        requiresEmailVerification: true,
        email: emailIdentity.Identifier,
      });
    }

    const roles = account.AccountRole.length ? account.AccountRole.map((r) => r.Role) : ["Student"];

    const token = jwt.sign(
      { userId: account.Id, accountId: account.Id, username: account.Username, roles },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({ token, roles });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
