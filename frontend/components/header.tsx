"use client"

import Link from "next/link"
import { Cloud } from "lucide-react"

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border animate-fade-in">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 animate-slide-in-left">
          <Cloud className="w-8 h-8 text-primary animate-float" />
          <h1 className="text-2xl font-bold text-foreground">Cloud Stories</h1>
        </Link>

        <nav className="hidden md:flex gap-8 animate-slide-in-right">
          <Link href="/" className="text-foreground hover:text-primary transition-colors">
            Home
          </Link>
          <Link href="/articles" className="text-foreground hover:text-primary transition-colors">
            Articles
          </Link>
          <Link href="/blog" className="text-foreground hover:text-primary transition-colors">
            Blog
          </Link>
          <Link href="#" className="text-foreground hover:text-primary transition-colors">
            About
          </Link>
          <Link href="#" className="text-foreground hover:text-primary transition-colors">
            Contact
          </Link>
        </nav>
      </div>
    </header>
  )
}
