"use client"

import { Cloud } from "lucide-react"

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border animate-fade-in">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 animate-slide-in-left">
          <Cloud className="w-8 h-8 text-primary animate-float" />
          <h1 className="text-2xl font-bold text-foreground">Cloud Stories</h1>
        </div>

        <nav className="hidden md:flex gap-8 animate-slide-in-right">
          <a href="#" className="text-foreground hover:text-primary transition-colors">
            Home
          </a>
          <a href="#" className="text-foreground hover:text-primary transition-colors">
            Articles
          </a>
          <a href="#" className="text-foreground hover:text-primary transition-colors">
            About
          </a>
          <a href="#" className="text-foreground hover:text-primary transition-colors">
            Contact
          </a>
        </nav>
      </div>
    </header>
  )
}
