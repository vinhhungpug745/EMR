import { useEffect, useState } from 'react'
import { Eye, EyeOff, X } from 'lucide-react'

import { GENDER_OPTIONS, USER_ROLE_OPTIONS } from '../../config/userOptions'

const EMPTY_FORM = {
  username: '',
  password: '',
  first_name: '',
  last_name: '',
  email: '',
  role: 'receptionist',
  employee_code: '',
  phone: '',
  gender: '',
  is_active: true,
}

export default function UserFormModal({
  user,
  isSaving,
  error,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(() => createInitialForm(user))
  const [showPassword, setShowPassword] = useState(false)
  const isEditing = Boolean(user)

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSaving) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSaving, onClose])

  function updateField(event) {
    const { name, value, checked, type } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    const staffProfile = {
      employee_code: form.employee_code.trim(),
      phone: form.phone.trim() || null,
      gender: form.gender || null,
      active: form.is_active,
    }
    if (!isEditing) staffProfile.role = form.role

    const payload = {
      username: form.username.trim(),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      is_active: form.is_active,
      staff_profile: staffProfile,
    }
    if (form.password) payload.password = form.password

    onSubmit(payload)
  }

  return (
    <div className="user-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="user-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="user-modal__header">
          <div>
            <h2 id="user-modal-title">
              {isEditing ? 'Chỉnh sửa tài khoản' : 'Thêm người dùng mới'}
            </h2>
            <p>Thông tin đăng nhập và hồ sơ nhân viên.</p>
          </div>
          <button className="icon-button" type="button" aria-label="Đóng" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <form className="user-form" onSubmit={handleSubmit}>
          {error && (
            <div className="user-form__error" role="alert">
              {getGeneralError(error)}
            </div>
          )}

          <div className="user-form__grid">
            <FormField label="Tên đăng nhập" error={getFieldError(error, 'username')}>
              <input
                name="username"
                value={form.username}
                required
                autoFocus
                autoComplete="off"
                onChange={updateField}
              />
            </FormField>

            <FormField
              label={isEditing ? 'Mật khẩu mới' : 'Mật khẩu'}
              hint={isEditing ? 'Để trống nếu không đổi mật khẩu' : ''}
              error={getFieldError(error, 'password')}
            >
              <span className="password-input">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  required={!isEditing}
                  minLength={8}
                  autoComplete="new-password"
                  onChange={updateField}
                />
                <button
                  type="button"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </FormField>

            <FormField label="Họ">
              <input name="last_name" value={form.last_name} onChange={updateField} />
            </FormField>

            <FormField label="Tên">
              <input name="first_name" value={form.first_name} onChange={updateField} />
            </FormField>

            <FormField label="Email" error={getFieldError(error, 'email')}>
              <input name="email" type="email" value={form.email} onChange={updateField} />
            </FormField>

            <FormField label="Số điện thoại">
              <input name="phone" type="tel" value={form.phone} onChange={updateField} />
            </FormField>

            <FormField
              label="Mã nhân viên"
              error={getFieldError(error, 'staff_profile', 'employee_code')}
            >
              <input
                name="employee_code"
                value={form.employee_code}
                required
                onChange={updateField}
              />
            </FormField>

            <FormField label="Vai trò">
              <select name="role" value={form.role} disabled={isEditing} onChange={updateField}>
                {USER_ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Giới tính">
              <select name="gender" value={form.gender} onChange={updateField}>
                <option value="">Chưa cập nhật</option>
                {GENDER_OPTIONS.map((gender) => (
                  <option key={gender.value} value={gender.value}>{gender.label}</option>
                ))}
              </select>
            </FormField>

            <label className="user-form__status">
              <input
                name="is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={updateField}
              />
              <span>
                <strong>Tài khoản hoạt động</strong>
                <small>Cho phép nhân viên đăng nhập hệ thống</small>
              </span>
            </label>
          </div>

          <footer className="user-modal__footer">
            <button className="secondary-button" type="button" disabled={isSaving} onClick={onClose}>
              Hủy
            </button>
            <button className="primary-button" type="submit" disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Tạo tài khoản'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

function FormField({ label, hint, error, children }) {
  return (
    <label className="user-form__field">
      <span>{label}</span>
      {children}
      {error && <small className="user-form__field-error">{error}</small>}
      {!error && hint && <small>{hint}</small>}
    </label>
  )
}

function getFieldError(error, ...path) {
  let value = error?.data
  for (const key of path) value = value?.[key]
  return Array.isArray(value) ? value[0] : value || ''
}

function getGeneralError(error) {
  return error?.data?.detail || error?.message || 'Không thể lưu tài khoản.'
}

function createInitialForm(user) {
  if (!user) return { ...EMPTY_FORM }

  return {
    username: user.username || '',
    password: '',
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    role: user.staff_profile?.role || 'receptionist',
    employee_code: user.staff_profile?.employee_code || '',
    phone: user.staff_profile?.phone || '',
    gender: user.staff_profile?.gender || '',
    is_active: Boolean(user.is_active),
  }
}
