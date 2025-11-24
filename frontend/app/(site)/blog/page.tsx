import Link from "next/link"
import { blogPosts } from "@/lib/blog-data"

const staticBlogLinks = [
  {
    slug: "blog1",
    href: "/blog-static/blog1.html",
    title: "Nhật ký 30 ngày tự học Cloud",
    description: "Bài viết HTML tĩnh minh hoạ được phục vụ trực tiếp bởi Nginx alias.",
  },
  {
    slug: "blog2",
    href: "/blog-static/blog2.html",
    title: "Checklist du lịch một mình",
    description: "Gợi ý hành trang và an toàn cá nhân cho những chuyến độc hành.",
  },
  {
    slug: "blog3",
    href: "/blog-static/blog3.html",
    title: "3 kỹ thuật ghi chép hiệu quả",
    description: "Cornell, Zettelkasten và Bullet Journal bản thuần HTML.",
  },
]

export default function BlogIndexPage() {
  return (
    <div className="bg-background">
      <section className="bg-gradient-to-br from-primary/10 via-background to-background py-16">
        <div className="container mx-auto px-4 text-center space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-primary">Blog</p>
          <h1 className="text-4xl font-bold text-foreground">Câu chuyện mây cho mọi người</h1>
          <p className="text-muted-foreground text-lg">
            Những bài viết nhẹ nhàng, dễ đọc về hiện tượng thiên nhiên, nhiếp ảnh và cảm hứng từ bầu trời.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 space-y-12">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Blog Next.js</h2>
          <p className="text-muted-foreground">
            Những bài viết được tổng hợp từ dữ liệu JSON và render bằng Next.js.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map(post => (
            <article key={post.id} className="rounded-2xl border border-border bg-card/40 p-6 hover:border-primary">
              <p className="text-sm text-muted-foreground">{post.date}</p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">
                <Link href={`/blog/${post.id}`}>{post.title}</Link>
              </h2>
              <p className="text-muted-foreground mt-3 line-clamp-3">{post.excerpt}</p>
              <Link className="mt-4 inline-flex items-center gap-2 text-primary font-semibold" href={`/blog/${post.id}`}>
                Đọc tiếp
                <span aria-hidden>→</span>
              </Link>
            </article>
          ))}
        </div>

        <div className="space-y-4 pt-10 border-t border-dashed border-border">
          <h2 className="text-2xl font-semibold text-foreground">Blog HTML tĩnh (Nginx alias)</h2>
          <p className="text-muted-foreground">
            Bộ demo phục vụ trực tiếp qua alias Nginx tại <code>/blog-static/</code>, minh hoạ bài tập web hosting.
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {staticBlogLinks.map(item => (
              <article key={item.slug} className="rounded-2xl border border-border bg-card/30 p-6 hover:border-primary/70">
                <p className="text-sm font-semibold text-primary uppercase tracking-widest">HTML tĩnh</p>
                <h3 className="mt-2 text-xl font-semibold text-foreground">
                  <a href={item.href} target="_blank" rel="noopener noreferrer">
                    {item.title}
                  </a>
                </h3>
                <p className="text-muted-foreground mt-3">{item.description}</p>
                <a className="mt-4 inline-flex items-center gap-2 text-primary font-semibold" href={item.href} target="_blank" rel="noopener noreferrer">
                  Mở bài viết
                  <span aria-hidden>↗</span>
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
