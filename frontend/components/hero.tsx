"use client"

import Image from "next/image"
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

  const scrollToBlog = () => {
    document.getElementById("blog-section")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="absolute inset-0 animate-fade-in">
        <Image
          src="/image1.jpg"
          alt="Mây trắng trên nền trời xanh"
          fill
          priority
          className="object-cover opacity-30"
          sizes="100vw"
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance animate-fade-in-up">
          {displayText}
          <span className="animate-shimmer">|</span>
        </h2>

        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance animate-fade-in-up animate-delay-200">
          Tìm hiểu về những hiện tượng thiên nhiên kỳ diệu, khoa học đằng sau các đám mây, và cách chúng ảnh hưởng đến
          cuộc sống của chúng ta.
        </p>

        <button
          type="button"
          onClick={scrollToBlog}
          className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors animate-fade-in-up animate-delay-300 hover:scale-105 transition-transform"
        >
          Bắt Đầu Đọc
        </button>
      </div>
    </section>
  )
}
