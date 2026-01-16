import courseModel from '../../models/course/index.js';
import { isDriveEnabled, ensureCourseFolder } from '../../services/googleDriveService.js';

function driveFolderWebUrl(folderId) {
  if (!folderId) return null;
  return `https://drive.google.com/drive/folders/${folderId}`;
}

const saveDraft = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { draft } = req.body;

    if (!draft) {
      return res.status(400).json({ message: "draft is required" });
    }

    const parsedDraft =
      typeof draft === "string" ? JSON.parse(draft) : draft;

    if (!Array.isArray(parsedDraft.modules)) {
      return res.status(400).json({ message: "draft.modules is required" });
    }

    const result = await courseModel.saveDraft(
      Number(id),
      parsedDraft
    );

    // Provide where the draft resources are stored.
    // This helps the client (and debugging) confirm Drive-backed storage.
    let storage = { driver: isDriveEnabled() ? "drive" : "local" };
    if (isDriveEnabled()) {
      const folderId = await ensureCourseFolder(Number(id), "draft");
      storage = {
        driver: "drive",
        draftFolderId: folderId,
        draftFolderUrl: driveFolderWebUrl(folderId),
      };
    }

    res.json({
      message: "Draft saved successfully",
      draft: parsedDraft,
      result,
      storage,
    });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Course not found" });
    }
    next(err);
  }
};

export default saveDraft;