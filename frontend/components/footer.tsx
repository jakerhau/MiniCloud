import Link from "next/link"
import { Cloud, Mail, MapPin, Phone } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Cloud className="w-6 h-6" />
              <h3 className="text-xl font-bold">Cloud Stories</h3>
            </div>
            <p className="text-primary-foreground/80">Khám phá thế giới của những đám mây và thiên nhiên kỳ diệu.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4">Liên Kết Nhanh</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li>
                <Link href="/" className="hover:text-primary-foreground transition-colors">
                  Trang Chủ
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-primary-foreground transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/articles" className="hover:text-primary-foreground transition-colors">
                  Bài Viết Chuyên Sâu
                </Link>
              </li>
              <li>
                <Link href="/#contact" className="hover:text-primary-foreground transition-colors">
                  Liên Hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-bold mb-4">Danh Mục</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li>
                <Link href="/blog" className="hover:text-primary-foreground transition-colors">
                  Khoa Học
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-primary-foreground transition-colors">
                  Môi Trường
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-primary-foreground transition-colors">
                  Nhiếp Ảnh
                </Link>
              </li>
              <li>
                <Link href="/articles" className="hover:text-primary-foreground transition-colors">
                  Khí Hậu
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4">Liên Hệ</h4>
            <ul className="space-y-3 text-primary-foreground/80">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>info@cloudstories.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+84 123 456 789</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Hà Nội, Việt Nam</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-primary-foreground/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-primary-foreground/80 text-sm">
            <p>&copy; 2025 Cloud Stories. Tất cả quyền được bảo lưu.</p>
            <div className="flex gap-6 mt-4 md:mt-0 text-primary-foreground/70">
              <span>Chính sách bảo mật (đang cập nhật)</span>
              <span>Điều khoản sử dụng (đang cập nhật)</span>
              <Link href="/" className="hover:text-primary-foreground transition-colors">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
