import client from "../service/client";

export interface Mentor {
  id: string;
  name: string;
  avatar: string;
  headline: string;
  students: number;
  courses: number;
}

const getAll = async (): Promise<Mentor[]> => {
  const res = await client.get<Mentor[]>("/mentor");
  return res.data;
};

const mentor = { getAll };
export default mentor;
