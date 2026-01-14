import prisma from "../../prismaClient.js";

function cleanNullableString(v, maxLen) {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const s = String(v).trim();
  if (!s) return null;
  if (maxLen && s.length > maxLen) return s.slice(0, maxLen);
  return s;
}

export default async function updateMe(req, res) {
  try {
    const accountId = req.user?.accountId || req.user?.userId;
    if (!accountId) return res.status(401).json({ message: "Not authenticated" });

    const displayName = cleanNullableString(req.body.DisplayName ?? req.body.displayName, 100);
    const avatarUrl = cleanNullableString(req.body.AvatarUrl ?? req.body.avatarUrl, 500);
    const bio = cleanNullableString(req.body.Bio ?? req.body.bio, 1000);

    // DisplayName is required in schema; if caller tries to clear it, reject.
    if (displayName === null) {
      return res.status(400).json({ message: "DisplayName cannot be empty" });
    }

    // At least one field must be provided
    if (displayName === undefined && avatarUrl === undefined && bio === undefined) {
      return res.status(400).json({ message: "No updatable fields provided" });
    }

    const updated = await prisma.account.update({
      where: { Id: accountId },
      data: {
        ...(displayName !== undefined ? { DisplayName: displayName } : {}),
        ...(avatarUrl !== undefined ? { AvatarUrl: avatarUrl } : {}),
        ...(bio !== undefined ? { Bio: bio } : {}),
      },
      select: {
        Id: true,
        Username: true,
        DisplayName: true,
        AvatarUrl: true,
        Bio: true,
        CreatedAt: true,
        AccountRole: { select: { Role: true } },
      },
    });

    const roles = updated.AccountRole?.length
      ? updated.AccountRole.map((r) => r.Role)
      : ["Student"];

    return res.json({
      message: "Profile updated",
      account: {
        Id: updated.Id,
        Username: updated.Username,
        DisplayName: updated.DisplayName,
        AvatarUrl: updated.AvatarUrl,
        Bio: updated.Bio,
        CreatedAt: updated.CreatedAt,
        Roles: roles,
      },
    });
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
