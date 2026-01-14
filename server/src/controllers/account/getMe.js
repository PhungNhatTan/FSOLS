import prisma from "../../prismaClient.js";

function pickEmailIdentity(account) {
  const emailId = account?.AccountIdentifier?.find(
    (ai) => ai?.Provider?.Name === "email"
  );
  if (!emailId) return { email: null, emailVerified: null };
  return { email: emailId.Identifier, emailVerified: !!emailId.Verified };
}

export default async function getMe(req, res) {
  try {
    const accountId = req.user?.accountId || req.user?.userId;
    if (!accountId) return res.status(401).json({ message: "Not authenticated" });

    const account = await prisma.account.findUnique({
      where: { Id: accountId },
      select: {
        Id: true,
        Username: true,
        DisplayName: true,
        AvatarUrl: true,
        Bio: true,
        CreatedAt: true,
        AccountRole: { select: { Role: true } },
        AccountIdentifier: {
          select: {
            Identifier: true,
            Verified: true,
            Provider: { select: { Name: true } },
          },
        },
      },
    });

    if (!account) return res.status(404).json({ message: "Account not found" });

    const roles = account.AccountRole?.length
      ? account.AccountRole.map((r) => r.Role)
      : ["Student"];
    const { email, emailVerified } = pickEmailIdentity(account);

    return res.json({
      Id: account.Id,
      Username: account.Username,
      DisplayName: account.DisplayName,
      AvatarUrl: account.AvatarUrl,
      Bio: account.Bio,
      CreatedAt: account.CreatedAt,
      Roles: roles,
      Email: email,
      EmailVerified: emailVerified,
    });
  } catch (err) {
    console.error("Get profile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
