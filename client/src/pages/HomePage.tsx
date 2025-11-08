import React, { useEffect, useMemo, useState } from "react";

// ======================================
// HOMEPAGE —  (BE-ready)

// ==========================
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

// ==========================
// CONFIG
// ==========================
export type RoutingMode = "path" | "hash";
export const ROUTING_MODE: RoutingMode = "hash"; // ✅ Free/static hosting default

// ==========================
// HARDCODE MOCK DATA (Demo)
// ==========================
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
    title: "React + TypeScript từ A-Z",
    slug: "react-typescript-a-z",
    thumbnail: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&q=80&auto=format&fit=crop",
    mentor: "Nguyễn Minh",
    mentorId: 501,
    rating: 4.8,
    ratingCount: 1298,
    durationHours: 18,
    lessons: 96,
    categoryId: 1,
  },
  {
    id: 1002,
    title: "Python cho Phân tích Dữ liệu",
    slug: "python-data-analysis",
    thumbnail: "https://images.unsplash.com/photo-1551281044-8af22deaacb9?w=1200&q=80&auto=format&fit=crop",
    mentor: "Trần Bảo",
    mentorId: 502,
    rating: 4.7,
    ratingCount: 876,
    durationHours: 20,
    lessons: 110,
    categoryId: 2,
  },
  {
    id: 1003,
    title: "Kotlin Android App từ Cơ bản đến Nâng cao",
    slug: "kotlin-android-app",
    thumbnail: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1200&q=80&auto=format&fit=crop",
    mentor: "Phạm Quân",
    mentorId: 503,
    rating: 4.6,
    ratingCount: 412,
    durationHours: 24,
    lessons: 132,
    categoryId: 3,
  },
  {
    id: 1004,
    title: "Thiết kế UI/UX thực chiến với Figma",
    slug: "uiux-figma-thuc-chien",
    thumbnail: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=1200&q=80&auto=format&fit=crop",
    mentor: "Lê Ánh",
    mentorId: 504,
    rating: 4.5,
    ratingCount: 265,
    durationHours: 14,
    lessons: 75,
    categoryId: 4,
  },
];

const MENTORS: Mentor[] = [
  { id: 501, name: "Nguyễn Minh", avatar: "https://i.pravatar.cc/150?img=12", headline: "Senior Frontend @ Unicorn", students: 12456, courses: 8 },
  { id: 502, name: "Trần Bảo", avatar: "https://i.pravatar.cc/150?img=32", headline: "Data Scientist @ Fintech", students: 10234, courses: 6 },
  { id: 503, name: "Phạm Quân", avatar: "https://i.pravatar.cc/150?img=5", headline: "Android Engineer @ Startup", students: 6321, courses: 5 },
  { id: 504, name: "Lê Ánh", avatar: "https://i.pravatar.cc/150?img=47", headline: "Product Designer @ SaaS", students: 3540, courses: 3 },
];

const POSTS: Post[] = [
  { id: 1, title: "Học React 2025: Lộ trình khuyến nghị", slug: "lo-trinh-react-2025", cover: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&q=80&auto=format&fit=crop", createdAt: "2025-10-08" },
  { id: 2, title: "SQL hay NoSQL cho dự án của bạn?", slug: "sql-vs-nosql", cover: "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=1200&q=80&auto=format&fit=crop", createdAt: "2025-09-21" },
  { id: 3, title: "Tailwind Tips: 12 mẹo tăng tốc UI", slug: "tailwind-12-tips", cover: "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=1200&q=80&auto=format&fit=crop", createdAt: "2025-08-15" },
];

const TESTIMONIALS: Testimonial[] = [
  { id: 1, name: "Lan Anh", avatar: "https://i.pravatar.cc/150?img=1", role: "Junior Frontend", content: "Nội dung rất dễ hiểu, mentor phản hồi nhanh. Sau khoá React mình pass thực tập!" },
  { id: 2, name: "Hoàng Nam", avatar: "https://i.pravatar.cc/150?img=25", role: "Data Analyst", content: "Khoá Python giúp mình tự tin chuyển ngành. Bài tập thực tế, có data dự án!" },
  { id: 3, name: "Bảo Châu", avatar: "https://i.pravatar.cc/150?img=14", role: "Mobile Dev", content: "Series Kotlin có phần kiến trúc rất ổn, dễ áp dụng ngay vào app công ty." },
];

// ==========================
// ROUTING HELPERS
// ==========================
export const buildCategoryUrl = (slug: string) => `/categories/${slug}`;
export const buildCourseUrl = (c: Pick<CourseCard, "id" | "slug">) => `/courses/${c.id}`; // match /courses/:id
export const buildBlogUrl = (slug: string) => `/blog/${slug}`;
export const buildHref = (path: string, mode: RoutingMode = ROUTING_MODE) => mode === "hash" ? `#${path}` : path;

// ==========================
// AUTH — JWT-ready shim (no external hook)
// ==========================
export type LiteUser = { id?: number | string; name?: string; email?: string } | null;
const USER_KEY = "fsols:user";
const TOKEN_KEY = "fsols:token";

export const buildAuthHeaders = (token?: string) => token ? ({ Authorization: `Bearer ${token}` }) : ({} as Record<string, string>);

function getStoredUser(): LiteUser {
  try { return typeof localStorage === "undefined" ? null : (localStorage.getItem(USER_KEY) ? JSON.parse(localStorage.getItem(USER_KEY) as string) : null); } catch { return null; }
}
function getStoredToken(): string | null {
  try { return typeof localStorage === "undefined" ? null : (localStorage.getItem(TOKEN_KEY)); } catch { return null; }
}
function saveAuth(token: string | undefined, user: LiteUser) {
  try {
    if (typeof localStorage === "undefined") return;
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user)); else localStorage.removeItem(USER_KEY);
    if (token) localStorage.setItem(TOKEN_KEY, token); else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

// [BE] Expected API
//   POST /auth/login { email, password }  → { accessToken, refreshToken?, user }
//   POST /auth/logout                      → 200
//   Option A (khuyên dùng): httpOnly cookie → FE không cần lưu token, chỉ đọc user.
//   Option B (tạm): trả accessToken trong body → FE lưu tạm ở localStorage.

type LoginPayload = { email: string; password: string };
const authApi = {
  async login(payload: LoginPayload): Promise<{ user: LiteUser; token?: string }>{
    // Try real BE first
    try {
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // send cookies when BE uses httpOnly cookie
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data: any = await res.json().catch(() => ({}));
        return { user: data.user ?? { email: payload.email }, token: data.accessToken };
      }
    } catch {}
    // Demo fallback for local dev without BE
    return { user: { email: payload.email, name: payload.email.split("@")[0] }, token: "demo-token" };
  },
  async logout() {
    try { await fetch("/auth/logout", { method: "POST", credentials: "include" }); } catch {}
  },
};

function useAuthLite() {
  const [user, setUser] = useState<LiteUser>(null);
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => { setUser(getStoredUser()); setToken(getStoredToken()); }, []);

  const login = async (payload: LoginPayload) => {
    const { user, token } = await authApi.login(payload);
    saveAuth(token, user);
    setUser(user);
    setToken(token ?? null);
    return user;
  };
  const logout = async () => {
    await authApi.logout();
    saveAuth(undefined, null);
    setUser(null);
    setToken(null);
  };
  return { user, token, login, logout } as const;
}

// ==========================
// UTILS (stars)
// ==========================
const starRow = (rating: number) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const total = 5;
  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < full; i++) nodes.push(<span key={"f"+i}>★</span>);
  if (half) nodes.push(<span key="h">☆</span>);
  for (let i = nodes.length; i < total; i++) nodes.push(<span key={"e"+i}>☆</span>);
  return <span className="text-yellow-500">{nodes}</span>;
};

// ==========================
// ROUTER-AGNOSTIC LINK
// ==========================
function AnchorLink({ to, children, ...rest }: { to: string; children: React.ReactNode } & any) {
  return <a href={buildHref(to)} {...rest}>{children}</a>;
}

// ==========================
// HOME PAGE COMPONENT
// ==========================
export default function HomePage() {
  const [q, setQ] = useState("");

  // Data placeholders → replace with real fetches
  // [BE] GET /api/categories?limit=6 → setCategories
  const categories = useMemo(() => CATEGORIES, []);
  // [BE] GET /api/courses?featured=true&limit=8 → setFeatured
  const featured = useMemo(() => FEATURED, []);
  // [BE] GET /api/mentors/top?limit=8 → setMentors
  const mentors = useMemo(() => MENTORS, []);
  // [BE] GET /api/posts?limit=3 → setPosts
  const posts = useMemo(() => POSTS, []);
  // [BE] GET /api/testimonials?limit=3 → setTestimonials
  const testimonials = useMemo(() => TESTIMONIALS, []);

  const onSearch = (e: React.FormEvent<HTMLFormElement>) => {
    // [NAV] Redirect to search result page `#/courses?query=...`
    // [BE on CoursePage] GET /api/courses?query=<q>&page=1&pageSize=20
    e.preventDefault();
    window.location.href = buildHref(`/courses?query=${encodeURIComponent(q)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 opacity-90" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-24 text-white">
          {/* [AUTH] khu vực auth */}
          <div className="flex justify-end">
            <AuthActions />
          </div>

          <p className="text-sm uppercase tracking-widest/relaxed mb-4 opacity-90">FSOLS Academy</p>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
            Học nhanh – Thực chiến – <span className="underline decoration-8 decoration-white/60">Nâng cấp sự nghiệp</span>
          </h1>
          <p className="mt-4 text-lg md:text-xl max-w-2xl text-white/90">
            Khoá học chất lượng bởi mentor giàu kinh nghiệm. Xây dựng dự án thật, phỏng vấn tự tin.
          </p>

          {/* Search */}
          <form onSubmit={onSearch} className="mt-8 flex items-center gap-3 bg-white/10 p-2 rounded-2xl backdrop-blur" data-testid="search-form">
            <input
              name="query"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm khoá học, chủ đề, mentor..."
              className="flex-1 bg-transparent placeholder-white/70 text-white px-4 py-3 focus:outline-none"
            />
            <button type="submit" className="px-5 py-3 bg-white text-slate-900 rounded-xl font-semibold hover:opacity-90">
              Tìm kiếm
            </button>
          </form>

          <div className="mt-8 flex flex-wrap items-center gap-6 text-white/90" data-testid="site-stats">
            {/* [BE] GET /api/stats/site → { learners, courses, mentors, projects } */}
            <Stat label="Học viên" value="35k+" />
            <Stat label="Khoá học" value="120+" />
            <Stat label="Mentor" value="40+" />
            <Stat label="Dự án mẫu" value="80+" />
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Danh mục nổi bật</h2>
            <p className="text-slate-600 mt-1">Chọn lộ trình theo mục tiêu của bạn</p>
          </div>
          <AnchorLink to="/categories" className="text-indigo-600 hover:underline">Xem tất cả</AnchorLink>
        </div>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((c) => (
            <AnchorLink key={c.id} to={buildCategoryUrl(c.slug)} className="group rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md transition">
              <div className="text-xl font-semibold group-hover:text-indigo-600">{c.name}</div>
              <div className="text-sm text-slate-500">{c.courseCount} khoá</div>
            </AnchorLink>
          ))}
        </div>
      </section>

      {/* FEATURED COURSES (no price) */}
      <section className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Khoá học nổi bật</h2>
            <p className="text-slate-600 mt-1">Được nhiều học viên quan tâm</p>
          </div>
          <AnchorLink to="/courses?sort=featured" className="text-indigo-600 hover:underline">Xem thêm</AnchorLink>
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
                  <span className="text-slate-500">{c.rating} ({c.ratingCount})</span>
                </div>
                <div className="mt-3 flex items-center justify-end">
                  <div className="text-xs text-slate-500">{c.durationHours}h • {c.lessons} bài</div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <AnchorLink to={buildCourseUrl(c)} className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:opacity-90">Xem chi tiết</AnchorLink>
                  <button
                    onClick={() => {
                      // [BE-POST] POST /api/wishlist  { courseId: c.id } (use JWT cookie or Authorization header)
                      alert(`(demo) Đã thêm vào wishlist: ${c.title}`);
                    }}
                    className="px-3 py-2 rounded-xl border text-sm font-medium hover:bg-slate-50"
                  >Wishlist</button>
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
            <p className="text-slate-600 mt-1">Người đồng hành trong lộ trình của bạn</p>
          </div>
          <AnchorLink to="/mentors" className="text-indigo-600 hover:underline">Xem tất cả</AnchorLink>
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
              <div className="mt-3 text-sm text-slate-600">{m.students.toLocaleString()} học viên • {m.courses} khoá</div>
            </AnchorLink>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-14">
          <h2 className="text-2xl md:text-3xl font-bold">Học viên nói gì?</h2>
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
            <h2 className="text-2xl md:text-3xl font-bold">Bài viết mới</h2>
            <p className="text-slate-600 mt-1">Cập nhật kiến thức & xu hướng</p>
          </div>
          <AnchorLink to="/blog" className="text-indigo-600 hover:underline">Xem tất cả</AnchorLink>
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((p) => (
            <article key={p.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-md transition">
              <AnchorLink to={buildBlogUrl(p.slug)}>
                <img src={p.cover} alt={p.title} className="h-40 w-full object-cover" />
              </AnchorLink>
              <div className="p-4">
                <AnchorLink to={buildBlogUrl(p.slug)} className="font-semibold text-slate-900 hover:text-indigo-600 line-clamp-2">{p.title}</AnchorLink>
                <div className="mt-1 text-sm text-slate-500">{new Date(p.createdAt).toLocaleDateString("vi-VN")}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CTA NEWSLETTER */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold">Nhận tài liệu & ưu đãi sớm</h3>
            <p className="text-white/90 mt-1">Đăng ký nhận mail mỗi tuần. Không spam.</p>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            const email = new FormData(e.currentTarget).get("email") as string;
            // [BE-POST] POST /api/newsletter/subscribe  { email }
            //           → 201 Created { id, email, subscribedAt }
            alert(`Đã (demo) gửi email: ${email}`);
            (e.currentTarget as HTMLFormElement).reset();
          }} className="w-full md:w-auto flex gap-3" data-testid="newsletter-form">
            <input name="email" type="email" required placeholder="Email của bạn"
              className="flex-1 md:w-80 px-4 py-3 rounded-xl text-slate-900 placeholder-slate-500" />
            <button type="submit" className="px-5 py-3 bg-white text-slate-900 rounded-xl font-semibold hover:opacity-90">Đăng ký</button>
          </form>
        </div>
      </section>

      {/* FAQ (client only) */}
      <section className="max-w-7xl mx-auto px-4 pb-20">
        <h2 className="text-2xl md:text-3xl font-bold">Câu hỏi thường gặp</h2>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Faq q="Các khoá học có miễn phí?" a="Có. Toàn bộ hệ thống cung cấp các khoá học miễn phí cho cộng đồng." />
          <Faq q="Tôi có được học thử không?" a="Bạn có thể xem 2–3 bài học đầu miễn phí (mọi khoá đều miễn phí)." />
          <Faq q="Thanh toán như thế nào?" a="Không cần thanh toán vì khoá học miễn phí." />
          <Faq q="Nhận hỗ trợ ở đâu?" a="Gia nhập Discord cộng đồng, group Facebook hoặc hỏi trực tiếp mentor trong từng bài học." />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div>
            <div className="font-bold text-slate-900">FSOLS Academy</div>
            <p className="mt-2 text-slate-600">Nền tảng học lập trình & công nghệ dành cho người Việt.</p>
          </div>
          <div>
            <div className="font-semibold text-slate-900">Khám phá</div>
            <ul className="mt-2 space-y-2 text-slate-600">
              <li><AnchorLink to="/courses">Tất cả khoá học</AnchorLink></li>
              <li><AnchorLink to="/categories">Danh mục</AnchorLink></li>
              <li><AnchorLink to="/mentors">Mentors</AnchorLink></li>
              <li><AnchorLink to="/blog">Blog</AnchorLink></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-slate-900">Hỗ trợ</div>
            <ul className="mt-2 space-y-2 text-slate-600">
              <li><AnchorLink to="/help">Trung tâm trợ giúp</AnchorLink></li>
              <li><AnchorLink to="/refund-policy">Chính sách hoàn tiền</AnchorLink></li>
              <li><AnchorLink to="/terms">Điều khoản</AnchorLink></li>
              <li><AnchorLink to="/privacy">Bảo mật</AnchorLink></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-slate-900">Liên hệ</div>
            <ul className="mt-2 space-y-2 text-slate-600">
              <li>Email: support@fsols.vn</li>
              <li>Discord cộng đồng</li>
              <li>Facebook Group</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">© {new Date().getFullYear()} FSOLS Academy. All rights reserved.</div>
      </footer>

      {/* =============================
          GHI CHÚ TÍCH HỢP BACKEND (FREE + JWT)
          -----------------------------
          1) Auth (JWT):
             - POST /auth/login { email, password } → { accessToken, user }
                 • Nếu dùng httpOnly cookie: FE không lưu token, chỉ fetch with credentials
                 • Nếu trả token trong body: FE gửi header Authorization: Bearer <token>
             - POST /auth/logout → 200 (xoá cookie / vô hiệu refresh token)
             - FE helpers: buildAuthHeaders(token), useAuthLite.login/logout
          2) HERO Stats: GET /api/stats/site → { learners, courses, mentors, projects }
          3) Categories: GET /api/categories?limit=6 → [{ id, name, slug, courseCount }]
          4) Featured: GET /api/courses?featured=true&limit=8 → CourseCard[]
          5) Mentors: GET /api/mentors/top?limit=8
          6) Testimonials: GET /api/testimonials?limit=3
          7) Posts: GET /api/posts?limit=3
      ============================= */}
    </div>
  );
}

// ==============
// SUB COMPONENTS
// ==============
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 px-4 py-3" data-testid="stat-item">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}

// ------------------------------
// [AUTH UI] Actions + Login form (JWT-ready)
// ------------------------------
function AuthActions() {
  const { user, login, logout, token } = useAuthLite();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      await login({ email, password });
      setOpen(false); setEmail(""); setPassword("");
    } catch (e: any) {
      setErr(e?.message || "Đăng nhập thất bại");
    } finally { setLoading(false); }
  };

  if (!user) {
    return (
      <div className="relative">
        <button onClick={() => setOpen(v => !v)} className="px-4 py-2 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:opacity-90">Đăng nhập</button>
        <a href={buildHref("/register")} className="ml-2 px-4 py-2 rounded-xl border border-white/60 text-white text-sm font-semibold hover:bg-white/10">Đăng ký</a>
        {open && (
          <form onSubmit={onSubmit} className="absolute right-0 mt-2 w-72 rounded-2xl bg-white p-4 text-slate-900 shadow-xl">
            <div className="font-semibold mb-2">Đăng nhập</div>
            <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required placeholder="Email" className="w-full mb-2 px-3 py-2 rounded-lg border" />
            <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" required placeholder="Mật khẩu" className="w-full mb-3 px-3 py-2 rounded-lg border" />
            {err && <div className="text-sm text-red-600 mb-2">{err}</div>}
            <button disabled={loading} type="submit" className="w-full px-3 py-2 rounded-lg bg-indigo-600 text-white font-medium disabled:opacity-60">{loading ? "Đang đăng nhập..." : "Đăng nhập"}</button>
            <div className="mt-2 text-xs text-slate-500">*BE: /auth/login trả JWT (cookie hoặc body).</div>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-sm">Xin chào, <span className="font-semibold">{(user as any).name ?? (user as any).email ?? "User"}</span></div>
      {token && <span title="JWT available" className="text-xs opacity-80">(JWT)</span>}
      <button onClick={() => { logout(); window.location.href = buildHref("/"); }} className="px-3 py-2 rounded-xl border border-white/70 text-white text-sm hover:bg-white/10">Đăng xuất</button>
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

// =====================
// SELF-CHECKS for CI (keep old + add new)
// =====================
export const __selfTest = () => {
  const assert = (cond: boolean, msg: string) => { if (!cond) throw new Error(msg); };
  // URL builders
  assert(buildCategoryUrl("web-dev") === "/categories/web-dev", "Category URL incorrect");
  assert(buildCourseUrl({ id: 1, slug: "react" }) === "/courses/1", "Course URL incorrect (should be /courses/:id)");
  assert(buildBlogUrl("hello-world") === "/blog/hello-world", "Blog URL incorrect");
  // Hash converter
  const hashHref = buildHref("/courses?query=test", "hash");
  assert(hashHref === "#/courses?query=test", "Hash href wrong");
  const pathHref = buildHref("/courses", "path");
  assert(pathHref === "/courses", "Path href wrong");
  // Auth helpers
  const hdr = buildAuthHeaders("token123");
  assert((hdr as any).Authorization === "Bearer token123", "buildAuthHeaders should format Authorization header");
  // Data presence (free courses — durations must be positive)
  assert(FEATURED.every(c => c.durationHours > 0 && c.lessons > 0), "Featured durations/lessons must be > 0");
  return true;
};

if (typeof process !== "undefined" && (process as any).env && (process as any).env.NODE_ENV === "test") {
  __selfTest();
}
