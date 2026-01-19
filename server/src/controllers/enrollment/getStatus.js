import enrollmentModel from '../../models/enrollment/index.js'

const getStatus = async (req, res) => {
  try {
    const { courseId } = req.params
    const accountId = req.user.userId

    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" })
    }

    const status = await enrollmentModel.getEnrollmentStatus(accountId, Number.parseInt(courseId))

    res.status(200).json(status)
  } catch (error) {
    console.error('Get enrollment status error:', error)
    res.status(500).json({ message: 'Failed to get enrollment status' })
  }
}

export default getStatus
