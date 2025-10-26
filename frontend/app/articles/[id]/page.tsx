"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Calendar, User, Clock, Tag, Share2 } from "lucide-react"
import { articles } from "@/lib/article-data"

export default function ArticleDetailPage() {
  const params = useParams()
  const articleId = Number.parseInt(params.id as string)
  const article = articles.find((a) => a.id === articleId)

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Article not found</h1>
          <Link href="/articles">
            <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
              Back to Articles
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
          <div className="flex items-center justify-between">
            <Link href="/articles">
              <button className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-semibold">
                <ArrowLeft className="w-5 h-5" />
                Back to Articles
              </button>
            </Link>
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Share2 className="w-5 h-5" />
              Share
            </button>
          </div>
        </div>
      </header>

      {/* Hero Image */}
      <div className="relative h-96 bg-muted overflow-hidden">
        <img src={article.image || "/placeholder.svg"} alt={article.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Badge */}
        <div className="mb-4">
          <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
            {article.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">{article.title}</h1>

        {/* Meta Information */}
        <div className="flex flex-wrap gap-6 text-muted-foreground mb-8 pb-8 border-b border-border">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <span>{article.author}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <span>{article.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span>{article.readTime}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-8">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
            >
              <Tag className="w-3 h-3" />
              {tag}
            </span>
          ))}
        </div>

        {/* Article Content */}
        <div className="prose prose-invert max-w-none">
          {article.content.split("\n").map((line, index) => {
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

        {/* Author Bio */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="bg-muted/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">About the Author</h3>
            <p className="text-muted-foreground">
              {article.author} is a technical writer and software architect with expertise in {article.category.toLowerCase()} and modern software development practices.
            </p>
          </div>
        </div>

        {/* Related Articles */}
        <div className="mt-12 pt-8 border-t border-border">
          <h3 className="text-2xl font-bold text-foreground mb-6">Related Articles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles
              .filter(a => a.id !== article.id && a.category === article.category)
              .slice(0, 2)
              .map((relatedArticle) => (
                <Link key={relatedArticle.id} href={`/articles/${relatedArticle.id}`}>
                  <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <h4 className="font-semibold text-foreground mb-2 line-clamp-2">
                      {relatedArticle.title}
                    </h4>
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {relatedArticle.excerpt}
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{relatedArticle.readTime}</span>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>

        {/* Back to Articles */}
        <div className="mt-12 pt-8 border-t border-border">
          <Link href="/articles">
            <button className="bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-secondary/90 transition-colors">
              ← Back to All Articles
            </button>
          </Link>
        </div>
      </article>
    </main>
  )
}
