import Hero from "@/components/hero"
import BlogGrid from "@/components/blog-grid"

export default function Home() {
  return (
    <>
      <Hero />

      <section id="about" className="bg-muted/30 py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <p className="text-sm uppercase tracking-[0.3em] text-primary">About Cloud Stories</p>
          <h2 className="text-4xl font-bold text-foreground">Cộng đồng yêu mây & công nghệ</h2>
          <p className="text-lg text-muted-foreground">
            Cloud Stories được xây dựng để chia sẻ kiến thức về cloud computing, kiến trúc phần mềm và những câu chuyện
            đời sống xoay quanh nền tảng công nghệ đám mây. Nội dung được tuyển chọn kỹ, dễ đọc cho người mới nhưng vẫn
            có chiều sâu để bạn áp dụng vào dự án thực tế.
          </p>
        </div>
      </section>

      <BlogGrid />

      <section id="contact" className="bg-card py-16 md:py-24 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-10 md:grid-cols-2 items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-primary">Liên hệ</p>
            <h2 className="text-3xl font-bold text-foreground mt-4 mb-6">Luôn sẵn sàng trò chuyện</h2>
            <p className="text-muted-foreground">
              Có góp ý hay muốn hợp tác? Hãy gửi email hoặc kết nối qua mạng xã hội. Chúng tôi phản hồi trong 24 giờ làm việc.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-background p-6 space-y-4">
            <p className="text-sm font-semibold text-muted-foreground">Thông tin liên lạc</p>
            <a href="mailto:hello@cloudstories.vn" className="block text-lg font-medium hover:text-primary">
              hello@cloudstories.vn
            </a>
            <a href="tel:+84123456789" className="block text-lg font-medium hover:text-primary">
              +84 123 456 789
            </a>
            <p className="text-muted-foreground">Hà Nội · Thành phố Hồ Chí Minh · Remote</p>
          </div>
        </div>
      </section>
    </>
  )
}
