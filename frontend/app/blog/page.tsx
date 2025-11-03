// app/blog/page.tsx
import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { blogPosts } from "@/lib/blog-data";

export default function BlogIndexPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">Blog</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map(post => (
            <article key={post.id} className="rounded-2xl border p-4">
              <h2 className="text-xl font-semibold mb-2">
                <Link href={`/blog/${post.id}`}>{post.title}</Link>
              </h2>
              <p className="text-foreground/70 mb-3">{post.excerpt}</p>
              <Link className="underline" href={`/blog/${post.id}`}>
                Đọc tiếp →
              </Link>
            </article>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}
