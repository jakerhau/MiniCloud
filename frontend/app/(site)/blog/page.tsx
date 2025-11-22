import Link from "next/link"
import { blogPosts } from "@/lib/blog-data"

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

      <section className="container mx-auto px-4 py-12">
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
      </section>
    </div>
  )
}
