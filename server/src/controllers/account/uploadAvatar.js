import fs from "fs";
import path from "path";
import prisma from "../../prismaClient.js";
import { avatarDir, buildAvatarUrl } from "../../middleware/avatarUpload.js";
import {
  isDriveEnabled,
  ensureAvatarsFolder,
  uploadFileToFolder,
  getFileMetadata,
  deleteFile,
} from "../../services/googleDriveService.js";

function isManagedAvatarUrl(url) {
  return typeof url === "string" && url.startsWith("/uploads/production/avatars/");
}

export default async function uploadAvatar(req, res) {
  try {
    const accountId = req.user?.accountId || req.user?.userId;
    if (!accountId) return res.status(401).json({ message: "Not authenticated" });

    if (!req.file) {
      return res.status(400).json({ message: "No avatar file uploaded" });
    }

    let newAvatarUrl = buildAvatarUrl(req.file.filename);

    // Drive mode: upload to Drive and use the Drive file id in the URL.
    if (isDriveEnabled()) {
      const folderId = await ensureAvatarsFolder();
      const uploaded = await uploadFileToFolder({
        folderId,
        localPath: req.file.path,
        name: req.file.filename,
        mimeType: req.file.mimetype,
        appProperties: { originalName: req.file.originalname || "avatar" },
      });
      newAvatarUrl = buildAvatarUrl(uploaded.id);

      // Clean up temp file.
      if (req.file?.path) {
        fs.promises.unlink(req.file.path).catch(() => undefined);
      }
    }

    // Best-effort delete previous managed avatar to avoid accumulating files.
    const existing = await prisma.account.findUnique({
      where: { Id: accountId },
      select: { AvatarUrl: true },
    });

    if (existing?.AvatarUrl && isManagedAvatarUrl(existing.AvatarUrl)) {
      const oldName = path.basename(existing.AvatarUrl);

      if (isDriveEnabled()) {
        // Best-effort delete previous Drive avatar if it is under the avatars folder.
        try {
          const folderId = await ensureAvatarsFolder();
          const meta = await getFileMetadata(oldName);
          const parents = meta?.parents || [];
          if (parents.includes(folderId)) {
            await deleteFile(oldName);
          }
        } catch {
          // ignore
        }
      } else {
        // Legacy local cleanup.
        const oldPath = path.join(avatarDir, oldName);
        fs.promises.unlink(oldPath).catch(() => undefined);
      }
    }

    const updated = await prisma.account.update({
      where: { Id: accountId },
      data: { AvatarUrl: newAvatarUrl },
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
      message: "Avatar uploaded",
      avatarUrl: updated.AvatarUrl,
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
    console.error("Upload avatar error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
