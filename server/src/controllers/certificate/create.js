import create from "../../models/certificate/index.js";

export default async function createCertificate(req, res, next) {
    try {
        const { certificateType, courseId, specializationId } = req.body;

        if (!certificateType) {
            return res.status(400).json({ error: "Certificate type is required" });
        }
        if (certificateType === "Course" && !courseId) {
            return res.status(400).json({ error: "courseId is required for course certificates" });
        }
        if (certificateType === "Specialization" && !specializationId) {
            return res.status(400).json({ error: "specializationId is required for specialization certificates" });
        }

        const certificate = await create({ certificateType, courseId, specializationId });

        return res.status(201).json({
            message: "Certificate created successfully",
            certificate,
        });
    } catch (error) {
        next(error);
        console.error("Error creating certificate:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
