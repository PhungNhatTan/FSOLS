import enrollmentModel from "../../models/enrollment/index.js"

const unenroll = async (req, res) => {
  try {
    const { courseId } = req.params
    const accountId = req.user.userId

    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" })
    }

    await enrollmentModel.unenroll(accountId, Number.parseInt(courseId))

    res.status(200).json({
      message: "Successfully unenrolled from course",
    })
  } catch (error) {
    if (error.message === "Not enrolled in this course") {
      return res.status(404).json({ message: error.message })
    }

    if (error.message === "Cannot unenroll from a completed course") {
      return res.status(409).json({ message: error.message })
    }

    console.error("Unenrollment error:", error)
    res.status(500).json({ message: "Failed to unenroll from course" })
  }

}

export default unenroll
