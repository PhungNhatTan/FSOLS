import React, { useEffect, useMemo, useState } from "react";
import courseApi from "../../api/course";
import categoryApi from "../../api/category";
import mentorApi from "../../api/mentor";
import postApi from "../../api/post";
import CourseCard from "../../components/public/course/CourseCard";
import PostCard from "../../components/public/blog/PostCard";

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
export type Mentor = { id: string; name: string; avatar: string; headline: string; students: number; courses: number };
export type Post = { id: number; title: string; slug: string; cover: string; createdAt: string };

export type RoutingMode = "path" | "hash";
export const ROUTING_MODE: RoutingMode = "hash";




export const buildCategoryUrl = (slug: string) => `/categories/${slug}`;
export const buildBlogUrl = (slug: string) => `/blog/${slug}`;
export const buildHref = (path: string, mode: RoutingMode = ROUTING_MODE) => (mode === "hash" ? `#${path}` : path);

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
  const [featured, setFeatured] = useState<CourseCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mentorsData, setMentorsData] = useState<Mentor[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [featuredData, categoriesData, mentorsDataAPI, postsData] = await Promise.all([
        courseApi.getFeatured(),
        categoryApi.getAll(),
        mentorApi.getAll(),
        postApi.getAll(),
      ]);
      setFeatured(featuredData || []);
      setCategories(categoriesData || []);
      setMentorsData(mentorsDataAPI || []);
      setPosts(postsData || []);
    } catch (err) {
      console.error("Failed to load data:", err);
      setFeatured([]);
      setCategories([]);
      setMentorsData([]);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const mentors = useMemo(() => mentorsData, [mentorsData]);

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

        {loading && (
          <div className="mt-6 text-center text-slate-600">
            <p>Loading categories...</p>
          </div>
        )}

        {!loading && categories.length === 0 && (
          <div className="mt-6 text-center text-slate-600">
            <p>No categories available at the moment.</p>
          </div>
        )}

        {!loading && categories.length > 0 && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((c) => (
              <AnchorLink key={c.id} to={buildCategoryUrl(c.slug)} className="group rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md transition">
                <div className="text-xl font-semibold group-hover:text-indigo-600">{c.name}</div>
                <div className="text-sm text-slate-500">{c.courseCount} courses</div>
              </AnchorLink>
            ))}
          </div>
        )}
      </section>

      {/* FEATURED COURSES */}
      <section className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Featured Courses</h2>
            <p className="text-slate-600 mt-1">Trending among learners</p>
          </div>
        </div>

        {loading && (
          <div className="mt-6 text-center text-slate-600">
            <p>Loading featured courses...</p>
          </div>
        )}

        {!loading && featured.length === 0 && (
          <div className="mt-6 text-center text-slate-600">
            <p>No featured courses available at the moment.</p>
          </div>
        )}

        {!loading && featured.length > 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        )}
      </section>

      {/* MENTORS */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Top Mentors</h2>
            <p className="text-slate-600 mt-1">Your companions along the journey</p>
          </div>
        </div>

        {loading && (
          <div className="mt-6 text-center text-slate-600">
            <p>Loading mentors...</p>
          </div>
        )}

        {!loading && mentors.length === 0 && (
          <div className="mt-6 text-center text-slate-600">
            <p>No mentors available at the moment.</p>
          </div>
        )}

        {!loading && mentors.length > 0 && (
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
        )}
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

        {loading && (
          <div className="mt-6 text-center text-slate-600">
            <p>Loading posts...</p>
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="mt-6 text-center text-slate-600">
            <p>No posts available at the moment.</p>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
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
