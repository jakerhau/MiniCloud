"use client"

import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Calendar, Clock, User } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { blogPosts } from "@/lib/blog-data"

export default function BlogDetailPage() {
  const params = useParams()
  const postId = Number.parseInt(params.id as string)
  const post = blogPosts.find(p => p.id === postId)

  if (!post) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Bài viết không tồn tại</h1>
        <Link href="/blog" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">
          <ArrowLeft className="h-4 w-4" />
          Quay lại blog
        </Link>
      </div>
    )
  }

  return (
    <article className="bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Link href="/blog" className="inline-flex items-center gap-2 text-primary font-semibold">
          <ArrowLeft className="h-4 w-4" />
          Tất cả bài blog
        </Link>

        <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-border bg-muted">
          <Image
            src={post.image || "/placeholder.svg"}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 700px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        </div>

        <span className="inline-flex rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
          {post.category}
        </span>

        <header className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground">{post.title}</h1>
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2"><User className="h-4 w-4" />{post.author}</span>
            <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4" />{post.date}</span>
            <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4" />{post.readTime}</span>
          </div>
        </header>

        <div className="prose prose-slate dark:prose-invert max-w-none leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>
      </div>
    </article>
  )
}
