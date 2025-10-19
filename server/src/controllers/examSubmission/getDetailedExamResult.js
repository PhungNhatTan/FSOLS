import examSubmission from "../../models/examSubmission/index.js";

export default async function getDetailedExamResult(req, res, next) {
  try {
    const { id } = req.params;
    const { user } = req;

    if (!id) {
      return res.status(400).json({ message: "Exam submission ID is required" });
    }

    // Get submission data
    const submission = await examSubmission.getDetailedExamResult(id);

    if (!submission) {
      return res.status(404).json({ message: "Exam submission not found" });
    }

    // Role check
    const userRoles = user.roles?.length > 0 ? user.roles : ["Student"];
    const isAdmin = userRoles.includes("Admin");
    const isMentor = userRoles.includes("Mentor");

    // Only allow owner or privileged roles
    if (!isAdmin && !isMentor && submission.AccountId !== user.id) {
      return res.status(403).json({ message: "Forbidden: cannot access others' results" });
    }

    res.status(200).json(submission);
  } catch (err) {
    console.error("Error fetching detailed exam result:", err);
    res.status(500).json({ message: "Failed to fetch exam result" });
    next(err);
  }
}
