"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Calendar, User, Clock } from "lucide-react"
import { blogPosts } from "@/lib/blog-data"

export default function BlogDetailPage() {
  const params = useParams()
  const postId = Number.parseInt(params.id as string)
  const post = blogPosts.find((p) => p.id === postId)

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Bài viết không tìm thấy</h1>
          <Link href="/">
            <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
              Quay lại trang chủ
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/">
            <button className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-semibold">
              <ArrowLeft className="w-5 h-5" />
              Quay lại
            </button>
          </Link>
        </div>
      </header>

      {/* Hero Image */}
      <div className="relative h-96 bg-muted overflow-hidden">
        <img src={post.image || "/placeholder.svg"} alt={post.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Badge */}
        <div className="mb-4">
          <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
            {post.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">{post.title}</h1>

        {/* Meta Information */}
        <div className="flex flex-wrap gap-6 text-muted-foreground mb-8 pb-8 border-b border-border">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <span>{post.author}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <span>{post.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span>{post.readTime}</span>
          </div>
        </div>

        {/* Article Content */}
        <div className="prose prose-invert max-w-none">
          {post.content.split("\n").map((line, index) => {
            // Skip empty lines
            if (line.trim() === "") {
              return <br key={index} />
            }
            
            // Handle headings (lines starting with **)
            if (line.startsWith("**") && line.endsWith(":**")) {
              return (
                <h2 key={index} className="text-2xl font-bold text-foreground mt-8 mb-4">
                  {line.replace(/\*\*/g, "")}
                </h2>
              )
            }
            
            // Handle numbered lists
            if (
              line.startsWith("1.") ||
              line.startsWith("2.") ||
              line.startsWith("3.") ||
              line.startsWith("4.") ||
              line.startsWith("5.") ||
              line.startsWith("6.")
            ) {
              return (
                <p key={index} className="text-foreground/90 leading-relaxed mb-4">
                  {line}
                </p>
              )
            }
            
            // Handle regular paragraphs
            return (
              <p key={index} className="text-foreground/90 leading-relaxed mb-4">
                {line}
              </p>
            )
          })}
        </div>

        {/* Back to Blog */}
        <div className="mt-12 pt-8 border-t border-border">
          <Link href="/blog">
            <button className="bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-secondary/90 transition-colors">
              ← Quay lại danh sách bài viết
            </button>
          </Link>
        </div>
      </article>
    </main>
  )
}
