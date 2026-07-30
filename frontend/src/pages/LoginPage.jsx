import { Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import hospitalReception from '../assets/hospital-reception.png'
import { useAuth } from '../auth/useAuth'
import { Brand } from '../components/common/Brand'

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user) {
    return <Navigate to="/app" replace />
  }

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      await login(form)
      navigate(location.state?.from?.pathname || '/app', { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-visual" aria-label="Khu vực tiếp nhận bệnh viện">
        <img src={hospitalReception} alt="Khu vực tiếp nhận tại cơ sở y tế" />
        <div className="login-visual__overlay">
          <div>
            <span className="login-visual__icon"><ShieldCheck size={22} /></span>
            <h1>Dữ liệu đúng, chăm sóc liền mạch.</h1>
            <p>Một không gian làm việc thống nhất cho đội ngũ y tế.</p>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-panel__inner">
          <Brand />
          <div className="login-heading">
            <h2>Đăng nhập hệ thống</h2>
            <p>Sử dụng tài khoản nhân viên được cơ sở y tế cấp.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} autoComplete="off">
            <label htmlFor="username">Tên đăng nhập</label>
            <div className="input-control">
              <UserRound size={19} aria-hidden="true" />
              <input
                id="username"
                name="username"
                value={form.username}
                onChange={handleChange}
                autoComplete="off"
                placeholder="Nhập tên đăng nhập"
                required
                autoFocus
              />
            </div>

            <div className="label-row">
              <label htmlFor="password">Mật khẩu</label>
              <button type="button" className="text-button">Quên mật khẩu?</button>
            </div>
            <div className="input-control">
              <LockKeyhole size={19} aria-hidden="true" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                placeholder="Nhập mật khẩu"
                required
              />
              <button
                className="input-control__action"
                type="button"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>

            {error && <p className="form-error" role="alert">{error}</p>}

            <button className="primary-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang xác thực...' : 'Đăng nhập'}
            </button>
          </form>

          <p className="login-panel__support">
            Cần hỗ trợ tài khoản? Liên hệ quản trị viên hệ thống.
          </p>
        </div>
      </section>
    </main>
  )
}
