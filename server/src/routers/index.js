import { Router } from "express"

// public route import
import accountRoutes from "./public/accountRoute.js"
import userCertificateRoutes from "./public/userCertificateRoute.js"
import specializationCourseRoutes from "./public/specializationCourseRoute.js"
import courseRoutes from "./public/courseRoute.js"
import categoryRoute from "./public/categoryRoute.js"
import mentorRoute from "./public/mentorRoute.js"
import certificateRoute from "./public/certificateRoute.js"
import lessonRoute from "./public/lessonRoute.js"
import examRoute from "./public/examRoute.js"
import answerRoute from "./public/answerRoute.js"
import questionBankRoute from "./public/questionBankRoute.js"
import examQuestionRoute from "./public/examQuestionRoute.js"
import examSubmissionRoute from "./public/examSubmissionRoute.js"
import enrollmentRoute from "./public/enrollmentRoute.js"
import progressRoute from "./public/progress.route.js"

// manage route import
import certificateRoutesManage from "./manage/certificateRoute.js"
import questionBankRoutesManage from "./manage/questionBankRoute.js"
import courseRouteManage from "./manage/courseRoute.js"
import examQuestionRouteManage from "./manage/examQuestionRoute.js"
import lessonRouteManage from "./manage/lessonRoute.js"
import examRouteManage from "./manage/examRouteManage.js"
import moduleRouteManage from "./manage/moduleRoute.js"

// moderator route import
import courseRouteModerator from "./moderator/courseRoute.js"

// admin route import
import accountRoutesAdmin from "./manage/account.route.js"

// file upload route import
import draftResourceRoute from "./draftResourceRoute.js"
// import uploadRoute from "./uploadRoute.js"

const router = Router()

// public

router.use("/api/account", accountRoutes)
router.use("/api/userCertificate", userCertificateRoutes)
router.use("/api/specializationCourse", specializationCourseRoutes)
router.use("/api/course", courseRoutes)
router.use("/api/category", categoryRoute)
router.use("/api/mentor", mentorRoute)
router.use("/api/lesson", lessonRoute)
router.use("/api/certificate", certificateRoute)
router.use("/api/exam", examRoute)
router.use("/api/answer", answerRoute)
router.use("/api/questionBank", questionBankRoute)
router.use("/api/examQuestion", examQuestionRoute)
router.use("/api/examSubmission", examSubmissionRoute)
router.use("/api/enrollment", enrollmentRoute)
router.use("/api/progress", progressRoute)

// manage

router.use("/api/manage/certificate", certificateRoutesManage)
router.use("/api/manage/questionBank", questionBankRoutesManage)
router.use("/api/manage/course", courseRouteManage)
router.use("/api/manage/module", moduleRouteManage)
router.use("/api/manage/examQuestion", examQuestionRouteManage)
router.use("/api/manage/lesson", lessonRouteManage)
router.use("/api/manage/exam", examRouteManage)
router.use("/api/manage/course", draftResourceRoute)

// moderator

router.use("/api/moderator/course", courseRouteModerator)

// admin
router.use("/api/admin/account", accountRoutesAdmin)
// file upload
// router.use("/api/upload", uploadRoute)

export default router
