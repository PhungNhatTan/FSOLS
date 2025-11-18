import React, { useMemo, useState } from "react";

/* ======================================
   HOMEPAGE — English, no auth buttons
====================================== */

export type Category = { id: number; name: string; slug: string; courseCount: number };
export type CourseCard = {
  id: number;
  title: string;
  slug: string;
  thumbnail: string;
  mentor: string;
  mentorId: number;
  rating: number; // 0..5
  ratingCount: number;
  durationHours: number;
  lessons: number;
  categoryId: number;
};
export type Mentor = { id: number; name: string; avatar: string; headline: string; students: number; courses: number };
export type Post = { id: number; title: string; slug: string; cover: string; createdAt: string };
export type Testimonial = { id: number; name: string; avatar: string; role: string; content: string };

export type RoutingMode = "path" | "hash";
export const ROUTING_MODE: RoutingMode = "hash";

const CATEGORIES: Category[] = [
  { id: 1, name: "Web Development", slug: "web-dev", courseCount: 48 },
  { id: 2, name: "Data Science", slug: "data-science", courseCount: 26 },
  { id: 3, name: "Mobile", slug: "mobile", courseCount: 19 },
  { id: 4, name: "UI/UX", slug: "ui-ux", courseCount: 12 },
  { id: 5, name: "Cloud & DevOps", slug: "cloud-devops", courseCount: 14 },
  { id: 6, name: "Business", slug: "business", courseCount: 33 },
];

const FEATURED: CourseCard[] = [
  {
    id: 1001,
    title: "React + TypeScript from Zero to Pro",
    slug: "react-typescript-a-z",
    thumbnail: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&q=80&auto=format&fit=crop",
    mentor: "Minh Nguyen",
    mentorId: 501,
    rating: 4.8,
    ratingCount: 1298,
    durationHours: 18,
    lessons: 96,
    categoryId: 1,
  },
  {
    id: 1002,
    title: "Python for Data Analysis",
    slug: "python-data-analysis",
    thumbnail: "https://images.unsplash.com/photo-1551281044-8af22deaacb9?w=1200&q=80&auto=format&fit=crop",
    mentor: "Bao Tran",
    mentorId: 502,
    rating: 4.7,
    ratingCount: 876,
    durationHours: 20,
    lessons: 110,
    categoryId: 2,
  },
  {
    id: 1003,
    title: "Kotlin Android Apps — From Basics to Advanced",
    slug: "kotlin-android-app",
    thumbnail: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1200&q=80&auto=format&fit=crop",
    mentor: "Quan Pham",
    mentorId: 503,
    rating: 4.6,
    ratingCount: 412,
    durationHours: 24,
    lessons: 132,
    categoryId: 3,
  },
  {
    id: 1004,
    title: "Hands-on UI/UX Design with Figma",
    slug: "uiux-figma-hands-on",
    thumbnail: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=1200&q=80&auto=format&fit=crop",
    mentor: "Anh Le",
    mentorId: 504,
    rating: 4.5,
    ratingCount: 265,
    durationHours: 14,
    lessons: 75,
    categoryId: 4,
  },
];

const MENTORS: Mentor[] = [
  { id: 501, name: "Minh Nguyen", avatar: "https://i.pravatar.cc/150?img=12", headline: "Senior Frontend @ Unicorn", students: 12456, courses: 8 },
  { id: 502, name: "Bao Tran", avatar: "https://i.pravatar.cc/150?img=32", headline: "Data Scientist @ Fintech", students: 10234, courses: 6 },
  { id: 503, name: "Quan Pham", avatar: "https://i.pravatar.cc/150?img=5", headline: "Android Engineer @ Startup", students: 6321, courses: 5 },
  { id: 504, name: "Anh Le", avatar: "https://i.pravatar.cc/150?img=47", headline: "Product Designer @ SaaS", students: 3540, courses: 3 },
];

const POSTS: Post[] = [
  { id: 1, title: "React 2025: A Recommended Roadmap", slug: "react-roadmap-2025", cover: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&q=80&auto=format&fit=crop", createdAt: "2025-10-08" },
  { id: 2, title: "SQL or NoSQL for Your Project?", slug: "sql-vs-nosql", cover: "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=1200&q=80&auto=format&fit=crop", createdAt: "2025-09-21" },
  { id: 3, title: "Tailwind Tips: 12 Tricks to Speed Up UI", slug: "tailwind-12-tips", cover: "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=1200&q=80&auto=format&fit=crop", createdAt: "2025-08-15" },
];

const TESTIMONIALS: Testimonial[] = [
  { id: 1, name: "Lan Anh", avatar: "https://i.pravatar.cc/150?img=1", role: "Junior Frontend", content: "Very clear content and quick mentor feedback. I landed an internship after the React course!" },
  { id: 2, name: "Hoang Nam", avatar: "https://i.pravatar.cc/150?img=25", role: "Data Analyst", content: "The Python course helped me switch careers confidently. Real datasets and projects!" },
  { id: 3, name: "Bao Chau", avatar: "https://i.pravatar.cc/150?img=14", role: "Mobile Dev", content: "Great architecture section in the Kotlin series — easy to apply at work." },
];

export const buildCategoryUrl = (slug: string) => `/categories/${slug}`;
export const buildCourseUrl = (c: Pick<CourseCard, "id" | "slug">) => `/courses/${c.id}`;
export const buildBlogUrl = (slug: string) => `/blog/${slug}`;
export const buildHref = (path: string, mode: RoutingMode = ROUTING_MODE) => (mode === "hash" ? `#${path}` : path);

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
    <a href={buildHref(to)} {...rest}>
      {children}
    </a>
  );
}

export default function HomePage() {
  const [q, setQ] = useState("");

  const categories = useMemo(() => CATEGORIES, []);
  const featured = useMemo(() => FEATURED, []);
  const mentors = useMemo(() => MENTORS, []);
  const posts = useMemo(() => POSTS, []);
  const testimonials = useMemo(() => TESTIMONIALS, []);

  const onSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    window.location.href = buildHref(`/courses?query=${encodeURIComponent(q)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 opacity-90" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-24 text-white">
          {/* (Removed auth buttons) */}
          <p className="text-sm uppercase tracking-widest/relaxed mb-4 opacity-90">FSOLS Academy</p>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
            Learn fast — Hands-on — <span className="underline decoration-8 decoration-white/60">Level up your career</span>
          </h1>
          <p className="mt-4 text-lg md:text-xl max-w-2xl text-white/90">
            High-quality courses taught by experienced mentors. Build real projects and ace interviews.
          </p>

          {/* Search */}
          <form onSubmit={onSearch} className="mt-8 flex items-center gap-3 bg-white/10 p-2 rounded-2xl backdrop-blur" data-testid="search-form">
            <input
              name="query"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for courses, topics, mentors…"
              className="flex-1 bg-transparent placeholder-white/70 text-white px-4 py-3 focus:outline-none"
            />
            <button type="submit" className="px-5 py-3 bg-white text-slate-900 rounded-xl font-semibold hover:opacity-90">
              Search
            </button>
          </form>

          <div className="mt-8 flex flex-wrap items-center gap-6 text-white/90" data-testid="site-stats">
            <Stat label="Students" value="35k+" />
            <Stat label="Courses" value="120+" />
            <Stat label="Mentors" value="40+" />
            <Stat label="Projects" value="80+" />
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Popular Categories</h2>
            <p className="text-slate-600 mt-1">Pick a path that matches your goal</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((c) => (
            <AnchorLink key={c.id} to={buildCategoryUrl(c.slug)} className="group rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md transition">
              <div className="text-xl font-semibold group-hover:text-indigo-600">{c.name}</div>
              <div className="text-sm text-slate-500">{c.courseCount} courses</div>
            </AnchorLink>
          ))}
        </div>
      </section>

      {/* FEATURED COURSES */}
      <section className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Featured Courses</h2>
            <p className="text-slate-600 mt-1">Trending among learners</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((c) => (
            <article key={c.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-md transition" data-testid="course-card">
              <AnchorLink to={buildCourseUrl(c)}>
                <img src={c.thumbnail} alt={c.title} className="h-40 w-full object-cover" />
              </AnchorLink>
              <div className="p-4">
                <AnchorLink to={buildCourseUrl(c)} className="line-clamp-2 font-semibold text-slate-900 hover:text-indigo-600">
                  {c.title}
                </AnchorLink>
                <div className="mt-1 text-sm text-slate-600">{c.mentor}</div>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  {starRow(c.rating)}
                  <span className="text-slate-500">
                    {c.rating} ({c.ratingCount})
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    {c.durationHours}h • {c.lessons} lessons
                  </div>
                  <AnchorLink to={`/courses/${c.id}/manage`} className="text-xs px-2 py-1 rounded-lg border hover:bg-slate-50">
                    Manage
                  </AnchorLink>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <AnchorLink to={buildCourseUrl(c)} className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:opacity-90">
                    View details
                  </AnchorLink>
                  <button
                    onClick={() => {
                      alert(`(demo) Added to wishlist: ${c.title}`);
                    }}
                    className="px-3 py-2 rounded-xl border text-sm font-medium hover:bg-slate-50"
                  >
                    Wishlist
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* MENTORS */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Top Mentors</h2>
            <p className="text-slate-600 mt-1">Your companions along the journey</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {mentors.map((m) => (
            <AnchorLink key={m.id} to={`/mentors/${m.id}`} className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition">
              <div className="flex items-center gap-3">
                <img src={m.avatar} alt={m.name} className="h-14 w-14 rounded-full object-cover" />
                <div>
                  <div className="font-semibold text-slate-900">{m.name}</div>
                  <div className="text-sm text-slate-600 line-clamp-1">{m.headline}</div>
                </div>
              </div>
              <div className="mt-3 text-sm text-slate-600">
                {m.students.toLocaleString()} students • {m.courses} courses
              </div>
            </AnchorLink>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-14">
          <h2 className="text-2xl md:text-3xl font-bold">What learners say</h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <figure key={t.id} className="rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="h-12 w-12 rounded-full object-cover" />
                  <figcaption>
                    <div className="font-semibold text-slate-900">{t.name}</div>
                    <div className="text-sm text-slate-600">{t.role}</div>
                  </figcaption>
                </div>
                <p className="mt-3 text-slate-700">“{t.content}”</p>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* BLOG */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Latest posts</h2>
            <p className="text-slate-600 mt-1">Keep up with trends and knowledge</p>
          </div>
          <AnchorLink to="/blog" className="text-indigo-600 hover:underline">
            See all
          </AnchorLink>
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((p) => (
            <article key={p.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-md transition">
              <AnchorLink to={buildBlogUrl(p.slug)}>
                <img src={p.cover} alt={p.title} className="h-40 w-full object-cover" />
              </AnchorLink>
              <div className="p-4">
                <AnchorLink to={buildBlogUrl(p.slug)} className="font-semibold text-slate-900 hover:text-indigo-600 line-clamp-2">
                  {p.title}
                </AnchorLink>
                <div className="mt-1 text-sm text-slate-500">{new Date(p.createdAt).toLocaleDateString("en-GB")}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CTA NEWSLETTER */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold">Get resources & early deals</h3>
            <p className="text-white/90 mt-1">One email per week. No spam.</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const email = new FormData(e.currentTarget).get("email");
              alert(`(demo) Subscribed: ${String(email)}`);
              (e.currentTarget as HTMLFormElement).reset();
            }}
            className="w-full md:w-auto flex gap-3"
            data-testid="newsletter-form"
          >
            <input
              name="email"
              type="email"
              required
              placeholder="Your email"
              className="flex-1 md:w-80 px-4 py-3 rounded-xl text-slate-900 placeholder-slate-500"
            />
            <button type="submit" className="px-5 py-3 bg-white text-slate-900 rounded-xl font-semibold hover:opacity-90">
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-7xl mx-auto px-4 pb-20">
        <h2 className="text-2xl md:text-3xl font-bold">Frequently asked questions</h2>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Faq q="Are the courses free?" a="Yes. The entire platform provides free courses to the community." />
          <Faq q="Can I preview lessons?" a="You can watch the first 2–3 lessons for free (most courses are open)." />
          <Faq q="How do I pay?" a="No payment is required because the courses are free." />
          <Faq q="Where can I get support?" a="Join our Discord, Facebook group, or ask mentors directly in each lesson." />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div>
            <div className="font-bold text-slate-900">FSOLS Academy</div>
            <p className="mt-2 text-slate-600">Learning platform for coding & tech enthusiasts.</p>
          </div>
          <div>
            <div className="font-semibold text-slate-900">Explore</div>
            <ul className="mt-2 space-y-2 text-slate-600">
              <li>
                <AnchorLink to="/courses">All courses</AnchorLink>
              </li>
              <li>
                <AnchorLink to="/categories">Categories</AnchorLink>
              </li>
              <li>
                <AnchorLink to="/mentors">Mentors</AnchorLink>
              </li>
              <li>
                <AnchorLink to="/blog">Blog</AnchorLink>
              </li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-slate-900">Support</div>
            <ul className="mt-2 space-y-2 text-slate-600">
              <li>
                <AnchorLink to="/help">Help center</AnchorLink>
              </li>
              <li>
                <AnchorLink to="/refund-policy">Refund policy</AnchorLink>
              </li>
              <li>
                <AnchorLink to="/terms">Terms</AnchorLink>
              </li>
              <li>
                <AnchorLink to="/privacy">Privacy</AnchorLink>
              </li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-slate-900">Contact</div>
            <ul className="mt-2 space-y-2 text-slate-600">
              <li>Email: support@fsols.vn</li>
              <li>Discord community</li>
              <li>Facebook group</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} FSOLS Academy. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 px-4 py-3" data-testid="stat-item">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white" data-testid="faq-item">
      <button onClick={() => setOpen(!open)} className="w-full text-left px-5 py-4 font-semibold flex items-center justify-between">
        <span>{q}</span>
        <span className="text-slate-400">{open ? "–" : "+"}</span>
      </button>
      {open && <div className="px-5 pb-5 text-slate-700">{a}</div>}
    </div>
  );
}
