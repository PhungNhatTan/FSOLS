import client from "../service/client";

export interface Post {
  id: number;
  title: string;
  slug: string;
  cover: string;
  createdAt: string;
}

const getAll = async (): Promise<Post[]> => {
  const res = await client.get<Post[]>("/post");
  return res.data;
};

const post = { getAll };
export default post;
