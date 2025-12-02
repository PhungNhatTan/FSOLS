import React from "react";
import type { CourseCard as CourseCardType } from "../../../pages/HomePage";

interface Props {
  course: CourseCardType;
  onWishlistClick?: (course: CourseCardType) => void;
}

const starRow = (rating: number) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const total = 5;
  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < full; i++) nodes.push(<span key={`f${i}`}>★</span>);
  if (half) nodes.push(<span key="h">☆</span>);
  for (let i = nodes.length; i < total; i++) nodes.push(<span key={`e${i}`}>☆</span>);
  return <span className="text-yellow-500">{nodes}</span>;
};

function AnchorLink(
  { to, children, ...rest }: { to: string; children: React.ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>,
) {
  return (
    <a href={to} {...rest}>
      {children}
    </a>
  );
}

export const buildCourseUrl = (c: Pick<CourseCardType, "id" | "slug">) => `/courses/${c.id}`;

const CourseCard: React.FC<Props> = ({ course, onWishlistClick }) => {
  const courseUrl = buildCourseUrl(course);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-md transition" data-testid="course-card">
      <AnchorLink to={courseUrl}>
        <img src={course.thumbnail} alt={course.title} className="h-40 w-full object-cover" />
      </AnchorLink>
      <div className="p-4">
        <AnchorLink to={courseUrl} className="line-clamp-2 font-semibold text-slate-900 hover:text-indigo-600">
          {course.title}
        </AnchorLink>
        <div className="mt-1 text-sm text-slate-600">{course.mentor}</div>
        <div className="mt-2 flex items-center gap-2 text-sm">
          {starRow(course.rating)}
          <span className="text-slate-500">
            {course.rating} ({course.ratingCount})
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {course.durationHours}h • {course.lessons} lessons
          </div>
          <AnchorLink to={`/courses/${course.id}/manage`} className="text-xs px-2 py-1 rounded-lg border hover:bg-slate-50">
            Manage
          </AnchorLink>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <AnchorLink to={courseUrl} className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:opacity-90">
            View details
          </AnchorLink>
          <button
            onClick={() => {
              onWishlistClick?.(course);
              alert(`(demo) Added to wishlist: ${course.title}`);
            }}
            className="px-3 py-2 rounded-xl border text-sm font-medium hover:bg-slate-50"
          >
            Wishlist
          </button>
        </div>
      </div>
    </article>
  );
};

export default CourseCard;
