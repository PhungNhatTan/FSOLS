import enrollmentModel from "../../models/enrollment/index.js"

const getEnrolled = async (req, res) => {
  try {
    const accountId = req.user.userId

    const enrollments = await enrollmentModel.getEnrolledCourses(accountId)

    res.status(200).json(enrollments)
  } catch (error) {
    console.error("Get enrolled courses error:", error)
    res.status(500).json({ message: "Failed to get enrolled courses" })
  }
}

export default getEnrolled
