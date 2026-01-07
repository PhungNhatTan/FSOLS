import create from './create.js';
import get from './get.js';
import getAll from './getAll.js';
import update from './update.js';
import remove from './delete.js';
import getByCreator from './getByCreator.js';
import verifyCourse from './verifyCourse.js';
import getFeatured from './getFeatured.js';
import getEnrolled from './getEnrolled.js';
import saveDraft from './saveDraft.js';
import requestVerification from './requestVerification.js';
import getVerificationStatus from './getVerificationStatus.js';
import getAllVerificationRequests from './getAllVerificationRequests.js';
import getDraft from './getDraft.js';
import getVerificationDraft from './getVerificationDraft.js';
import rejectCourse from './rejectCourse.js';
import getCertificate from './getCertificate.js';
import getRecommendation from './getRecommendation.js';

export default {
  create,
  get,
  getAll,
  getByCreator,
  getEnrolled,
  getDraft,
  getVerificationDraft,
  update,
  remove,
  verifyCourse,
  rejectCourse,
  getFeatured,
  saveDraft,
  requestVerification,
  getVerificationStatus,
  getAllVerificationRequests,
  getCertificate,
  getRecommendation,
};
