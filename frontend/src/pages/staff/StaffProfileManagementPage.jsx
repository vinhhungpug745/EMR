import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BadgeInfo,
  ClipboardList,
  FlaskConical,
  HeartPulse,
  RefreshCw,
  Search,
  Stethoscope,
  UserRound,
  Users,
} from 'lucide-react'
import { Navigate } from 'react-router-dom'

import { getStaffProfiles } from '../../api/staffProfiles'
import { useAuth } from '../../auth/useAuth'
import ProfessionalProfileModal from '../../components/users/ProfessionalProfileModal'
import { getRoleLabel, USER_ROLE_OPTIONS } from '../../config/userOptions'

const SEARCH_DELAY = 350

export default function StaffProfileManagementPage() {
  const { user: currentUser } = useAuth()
  const [staffProfiles, setStaffProfiles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedStaff, setSelectedStaff] = useState(null)

  const loadStaffProfiles = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const data = await getStaffProfiles({ search })
      setStaffProfiles(Array.isArray(data) ? data : data.results || [])
    } catch (error) {
      setErrorMessage(error.message || 'Không thể tải danh sách hồ sơ nhân viên.')
    } finally {
      setIsLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timer = window.setTimeout(loadStaffProfiles, SEARCH_DELAY)
    return () => window.clearTimeout(timer)
  }, [loadStaffProfiles])

  const filteredProfiles = useMemo(() => staffProfiles.filter((staff) => (
    roleFilter === 'all' || staff.role === roleFilter
  )), [roleFilter, staffProfiles])

  const summary = useMemo(() => ({
    total: staffProfiles.length,
    doctors: staffProfiles.filter((staff) => staff.role === 'doctor').length,
    nurses: staffProfiles.filter((staff) => staff.role === 'nurse').length,
    receptionists: staffProfiles.filter((staff) => staff.role === 'receptionist').length,
    labTechnicians: staffProfiles.filter((staff) => staff.role === 'lab_technician').length,
  }), [staffProfiles])

  if (currentUser.role !== 'admin') {
    return <Navigate to="/app" replace />
  }

  function openProfessionalProfile(staff) {
    setSelectedStaff(staff)
  }

  function closeProfessionalProfile() {
    setSelectedStaff(null)
  }

  return (
    <div className="users-page">
      <header className="users-page__header">
        <div>
          <h1>Quản lý hồ sơ nhân viên</h1>
          <p>Quản lý hồ sơ nhân viên và thông tin chuyên môn theo từng vai trò.</p>
        </div>
      </header>

      {/* <section className="users-stats" aria-label="Thống kê hồ sơ nhân viên">
        <StatItem icon={Users} label="Tổng nhân viên" value={summary.total} tone="blue" />
        <StatItem icon={Stethoscope} label="Bác sĩ" value={summary.doctors} tone="cyan" />
        <StatItem icon={HeartPulse} label="Điều dưỡng" value={summary.nurses} tone="green" />
        <StatItem
          icon={ClipboardList}
          label="Nhân viên tiếp nhận"
          value={summary.receptionists}
          tone="amber"
        />
        <StatItem
          icon={FlaskConical}
          label="Nhân viên xét nghiệm"
          value={summary.labTechnicians}
          tone="purple"
        />
      </section> */}

      <section className="users-toolbar" aria-label="Bộ lọc hồ sơ nhân viên">
        <label className="users-toolbar__search">
          <Search size={17} aria-hidden="true" />
          <input
            value={search}
            placeholder="Tìm theo tên, tài khoản hoặc mã nhân viên"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
          <option value="all">Tất cả vai trò</option>
          {USER_ROLE_OPTIONS.filter((role) => role.value !== 'admin').map((role) => (
            <option key={role.value} value={role.value}>{role.label}</option>
          ))}
        </select>

        <button
          className="icon-button users-toolbar__refresh"
          type="button"
          title="Tải lại"
          aria-label="Tải lại"
          disabled={isLoading}
          onClick={loadStaffProfiles}
        >
          <RefreshCw className={isLoading ? 'is-spinning' : ''} size={17} />
        </button>
      </section>

      {errorMessage && (
        <div className="users-page__error" role="alert">
          <span>{errorMessage}</span>
          <button type="button" onClick={loadStaffProfiles}>Thử lại</button>
        </div>
      )}

      <section className="users-table-panel" aria-label="Danh sách hồ sơ nhân viên">
        <div className="users-table-scroll">
          <table className="users-table staff-profiles-table">
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Mã nhân viên</th>
                <th>Vai trò</th>
                <th><span className="sr-only">Thao tác</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <LoadingRows />}

              {!isLoading && filteredProfiles.map((staff) => (
                <StaffProfileRow
                  key={staff.id}
                  staff={staff}
                  onEditProfessionalProfile={openProfessionalProfile}
                />
              ))}
            </tbody>
          </table>
        </div>

        {!isLoading && filteredProfiles.length === 0 && (
          <div className="users-table__empty">
            <UserRound size={28} aria-hidden="true" />
            <strong>Không tìm thấy hồ sơ nhân viên</strong>
            <span>Thử thay đổi từ khóa hoặc bộ lọc hiện tại.</span>
          </div>
        )}
      </section>

      {selectedStaff && (
        <ProfessionalProfileModal
          key={selectedStaff.id}
          user={createUserLikeStaff(selectedStaff)}
          onClose={closeProfessionalProfile}
          onSaved={loadStaffProfiles}
        />
      )}
    </div>
  )
}

function StaffProfileRow({ staff, onEditProfessionalProfile }) {
  const name = staff.full_name || staff.user_detail?.full_name || 'Chưa cập nhật'
  const initials = getInitials(name)
  const canEditProfessionalProfile = staff.role !== 'admin'

  return (
    <tr>
      <td>
        <div className="users-table__identity">
          <span className="users-table__avatar" aria-hidden="true">{initials}</span>
          <span>
            <strong>{name}</strong>
            <small>{staff.user_detail?.username || getRoleLabel(staff.role)}</small>
          </span>
        </div>
      </td>
      <td className="users-table__code">{staff.employee_code || 'Chưa cập nhật'}</td>
      <td>
        <span className={`role-badge role-badge--${staff.role || 'unknown'}`}>
          {staff.role_display || getRoleLabel(staff.role)}
        </span>
      </td>
      <td>
        <div className="users-table__actions">
          <button
            className="icon-button"
            type="button"
            title="Hồ sơ chuyên môn"
            aria-label={`Hồ sơ chuyên môn ${name}`}
            disabled={!canEditProfessionalProfile}
            onClick={() => onEditProfessionalProfile(staff)}
          >
            <BadgeInfo size={17} />
          </button>
        </div>
      </td>
    </tr>
  )
}

function StatItem({ icon: Icon, label, value, tone }) {
  return (
    <article className="users-stat">
      <span className={`users-stat__icon users-stat__icon--${tone}`}>
        <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span className="users-stat__content">
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
    </article>
  )
}

function LoadingRows() {
  return Array.from({ length: 5 }, (_, index) => (
    <tr className="users-table__loading" key={index}>
      {Array.from({ length: 4 }, (__, cellIndex) => (
        <td key={cellIndex}><span /></td>
      ))}
    </tr>
  ))
}

function createUserLikeStaff(staff) {
  return {
    id: staff.user_detail?.id || staff.id,
    username: staff.user_detail?.username || staff.employee_code,
    full_name: staff.full_name || staff.user_detail?.full_name,
    staff_profile: staff,
  }
}

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}
