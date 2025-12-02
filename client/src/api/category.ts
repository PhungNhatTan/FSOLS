import client from "../service/client";

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  courseCount: number;
}

const getAll = async (): Promise<Category[]> => {
  const res = await client.get<Category[]>("/category");
  return res.data;
};

const category = { getAll };
export default category;
