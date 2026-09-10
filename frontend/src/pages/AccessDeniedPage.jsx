import { ArrowLeft, ShieldX } from 'lucide-react'
import { Link } from 'react-router-dom'

export function AccessDeniedPage() {
  return (
    <section className="empty-module access-denied" aria-labelledby="access-denied-title">
      <span aria-hidden="true">
        <ShieldX size={28} strokeWidth={1.8} />
      </span>
      <p className="access-denied__code">403 - Truy cập bị từ chối</p>
      <h1 id="access-denied-title">Bạn không có quyền truy cập</h1>
      <p>
        Tài khoản hiện tại không được phân quyền sử dụng chức năng này.
        Vui lòng quay lại trang tổng quan hoặc liên hệ quản trị viên.
      </p>
      <Link className="secondary-button" to="/app">
        <ArrowLeft size={17} aria-hidden="true" />
        Quay lại tổng quan
      </Link>
    </section>
  )
}
