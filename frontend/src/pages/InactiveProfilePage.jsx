import { LockKeyhole, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/useAuth'
import { Brand } from '../components/common/Brand'

export function InactiveProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)
    await logout()
    navigate('/login', { replace: true, state: { loggedOut: true } })
  }

  return (
    <main className="inactive-profile-page">
      <div className="inactive-profile-page__brand">
        <Brand />
      </div>

      <section className="inactive-profile-card" aria-labelledby="inactive-profile-title">
        <span className="inactive-profile-card__icon" aria-hidden="true">
          <LockKeyhole size={28} strokeWidth={1.8} />
        </span>
        <p className="inactive-profile-card__status">Hồ sơ không hoạt động</p>
        <h1 id="inactive-profile-title">Hồ sơ nhân viên của bạn đã bị khóa</h1>
        <p className="inactive-profile-card__message">
          Bạn đã đăng nhập thành công nhưng không thể sử dụng các chức năng nghiệp vụ.
          Vui lòng liên hệ quản trị viên để được mở khóa hồ sơ.
        </p>

        <dl className="inactive-profile-card__details">
          <div>
            <dt>Nhân viên</dt>
            <dd>{user.full_name}</dd>
          </div>
          <div>
            <dt>Mã nhân viên</dt>
            <dd>{user.employee_code || 'Chưa cập nhật'}</dd>
          </div>
        </dl>

        <button
          className="secondary-button inactive-profile-card__logout"
          type="button"
          disabled={isLoggingOut}
          onClick={handleLogout}
        >
          <LogOut size={18} aria-hidden="true" />
          {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
        </button>
      </section>
    </main>
  )
}
