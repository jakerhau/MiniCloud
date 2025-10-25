"use client"

import { useEffect, useState } from "react"

export default function Hero() {
  const [displayText, setDisplayText] = useState("")
  const fullText = "Khám Phá Thế Giới Của Những Đám Mây"

  useEffect(() => {
    let index = 0
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setDisplayText(fullText.slice(0, index + 1))
        index++
      } else {
        clearInterval(interval)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center animate-fade-in"
        style={{
          backgroundImage: "url(/placeholder.svg?height=600&width=1200&query=beautiful sky with white clouds)",
          opacity: 0.3,
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance animate-fade-in-up">
          {displayText}
          <span className="animate-shimmer">|</span>
        </h2>

        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance animate-fade-in-up animate-delay-200">
          Tìm hiểu về những hiện tượng thiên nhiên kỳ diệu, khoa học đằng sau các đám mây, và cách chúng ảnh hưởng đến
          cuộc sống của chúng ta.
        </p>

        <button className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors animate-fade-in-up animate-delay-300 hover:scale-105 transition-transform">
          Bắt Đầu Đọc
        </button>
      </div>
    </section>
  )
}
