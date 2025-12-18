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
import commitDraft from './commitDraft.js';
import createVerificationRequest from './createVerificationRequest.js';
import getVerificationRequest from './getVerificationRequest.js';
import getAllVerificationRequests from './getAllVerificationRequests.js';
import getDraft from './getDraft.js';
import rejectCourse from './rejectCourse.js';

export default {
  create,
  get,
  getAll,
  getEnrolled,
  getByCreator,
  getDraft,
  update,
  remove,
  verifyCourse,
  rejectCourse,
  getFeatured,
  saveDraft,
  commitDraft,
  createVerificationRequest,
  getVerificationRequest,
  getAllVerificationRequests,
};
