import client from "../service/client";
import type { Certificate } from "../types/course";

const getCertificateByCourseId = async (courseId: number): Promise<Certificate | null> => {
  try {
    const response = await client.get<Certificate | null>(`/manage/course/${courseId}/certificate/`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch certificate for course", courseId, error);
    throw error;
  }
};

const certificateApi = { getCertificateByCourseId };
export default certificateApi;