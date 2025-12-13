import enrollmentModel from "../../models/enrollment/index.js"

const enroll = async (req, res) => {
  try {
    const { courseId } = req.params
    const accountId = req.user.userId

    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" })
    }

    const enrollment = await enrollmentModel.enroll(accountId, Number.parseInt(courseId))

    res.status(201).json({
      message: "Successfully enrolled in course",
      enrollment,
    })
  } catch (error) {
    if (error.message === "Already enrolled in this course") {
      return res.status(409).json({ message: error.message })
    }
    console.error("Enrollment error:", error)
    res.status(500).json({ message: "Failed to enroll in course" })
  }
}

export default enroll
