import client from "../service/client";
import type { Certificate, UserCertificateDetail } from "../types/course";

const getCertificateByCourseId = async (courseId: number): Promise<Certificate | null> => {
  try {
    const response = await client.get<Certificate | null>(`/manage/course/${courseId}/certificate/`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch certificate for course", courseId, error);
    throw error;
  }
};

const getCourseCertificateTemplate = async (
  courseId: number
): Promise<Certificate | null> => {
  try {
    const response = await client.get<Certificate | null>(
      `/manage/course/${courseId}/certificate`
    );
    return response.data;
  } catch (error) {
    console.error(
      "Failed to fetch certificate template for course",
      courseId,
      error
    );
    throw error;
  }
};

// certificateApi.ts
const getUserCertificate = async (
  accountId: string,
  certificateId: string | null | undefined
): Promise<UserCertificateDetail> => {
  const response = await client.get<UserCertificateDetail>(
    `/certificate/${accountId}/${certificateId}`
  );
  return response.data;
};

const certificateApi = { getCertificateByCourseId, getCourseCertificateTemplate, getUserCertificate  };
export default certificateApi;