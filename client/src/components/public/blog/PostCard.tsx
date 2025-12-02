import React from "react";
import type { Post } from "../../../api/post";

interface Props {
  post: Post;
}

export const buildBlogUrl = (slug: string) => `/blog/${slug}`;

function AnchorLink(
  { to, children, ...rest }: { to: string; children: React.ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>,
) {
  return (
    <a href={to} {...rest}>
      {children}
    </a>
  );
}

const PostCard: React.FC<Props> = ({ post }) => {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-md transition">
      <AnchorLink to={buildBlogUrl(post.slug)}>
        <img src={post.cover} alt={post.title} className="h-40 w-full object-cover" />
      </AnchorLink>
      <div className="p-4">
        <AnchorLink to={buildBlogUrl(post.slug)} className="font-semibold text-slate-900 hover:text-indigo-600 line-clamp-2">
          {post.title}
        </AnchorLink>
        <div className="mt-1 text-sm text-slate-500">{new Date(post.createdAt).toLocaleDateString("en-GB")}</div>
      </div>
    </article>
  );
};

export default PostCard;
