import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ClipboardList,
  FlaskConical,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  UserPlus,
  Users,
} from 'lucide-react'
import { Navigate } from 'react-router-dom'

import {
  changeUserStatus,
  createUser,
  getUsers,
  updateUser,
} from '../../api/users'
import { useAuth } from '../../auth/useAuth'
import UserFormModal from '../../components/users/UserFormModal'
import UserTable from '../../components/users/UserTable'
import UserToolbar from '../../components/users/UserToolbar'

const SEARCH_DELAY = 350

export default function UserManagementPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [ordering, setOrdering] = useState('username')
  const [selectedUser, setSelectedUser] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const data = await getUsers({ search, ordering })
      setUsers(Array.isArray(data) ? data : data.results || [])
    } catch (error) {
      setErrorMessage(error.message || 'Không thể tải danh sách tài khoản.')
    } finally {
      setIsLoading(false)
    }
  }, [search, ordering])

  useEffect(() => {
    const timer = window.setTimeout(loadUsers, SEARCH_DELAY)
    return () => window.clearTimeout(timer)
  }, [loadUsers])

  const filteredUsers = useMemo(() => users.filter((user) => {
    const matchesRole = roleFilter === 'all'
      || user.staff_profile?.role === roleFilter
    const matchesStatus = statusFilter === 'all'
      || (statusFilter === 'active' && user.is_active)
      || (statusFilter === 'inactive' && !user.is_active)

    return matchesRole && matchesStatus
  }), [users, roleFilter, statusFilter])

  const summary = useMemo(() => ({
    total: users.length,
    doctors: users.filter(
      (user) => user.staff_profile?.role === 'doctor',
    ).length,
    nurses: users.filter(
      (user) => user.staff_profile?.role === 'nurse',
    ).length,
    admins: users.filter(
      (user) => user.staff_profile?.role === 'admin',
    ).length,
    receptionists: users.filter(
      (user) => user.staff_profile?.role === 'receptionist',
    ).length,
    labTechnicians: users.filter(
      (user) => user.staff_profile?.role === 'lab_technician',
    ).length,
  }), [users])

  if (currentUser.role !== 'admin') {
    return <Navigate to="/app" replace />
  }

  function openCreateForm() {
    setSelectedUser(null)
    setFormError(null)
    setIsFormOpen(true)
  }

  function openEditForm(user) {
    setSelectedUser(user)
    setFormError(null)
    setIsFormOpen(true)
  }

  function closeForm() {
    if (isSaving) return
    setIsFormOpen(false)
    setSelectedUser(null)
    setFormError(null)
  }

  async function handleSaveUser(formData) {
    setIsSaving(true)
    setFormError(null)

    try {
      if (selectedUser) {
        await updateUser(selectedUser.id, formData)
      } else {
        await createUser(formData)
      }
      setIsFormOpen(false)
      setSelectedUser(null)
      await loadUsers()
    } catch (error) {
      setFormError(error)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleStatusChange(user) {
    setErrorMessage('')
    try {
      await changeUserStatus(user.id, !user.is_active)
      await loadUsers()
    } catch (error) {
      setErrorMessage(error.message || 'Không thể cập nhật trạng thái tài khoản.')
    }
  }

  return (
    <div className="users-page">
      <header className="users-page__header">
        <div>
          <h1>Quản lý người dùng</h1>
          <p>Phân quyền và quản lý tài khoản nhân viên y tế trong hệ thống.</p>
        </div>
        <button className="primary-button" type="button" onClick={openCreateForm}>
          <UserPlus size={18} aria-hidden="true" />
          Thêm người dùng
        </button>
      </header>

      <section className="users-stats" aria-label="Thống kê người dùng">
        <StatItem icon={Users} label="Tổng người dùng" value={summary.total} tone="blue" />
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
          label="Kỹ thuật viên xét nghiệm"
          value={summary.labTechnicians}
          tone="purple"
        />
        <StatItem icon={ShieldCheck} label="Quản trị viên" value={summary.admins} tone="red" />
      </section>

      <UserToolbar
        search={search}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        ordering={ordering}
        isLoading={isLoading}
        onSearchChange={setSearch}
        onRoleChange={setRoleFilter}
        onStatusChange={setStatusFilter}
        onOrderingChange={setOrdering}
        onRefresh={loadUsers}
      />

      {errorMessage && (
        <div className="users-page__error" role="alert">
          <span>{errorMessage}</span>
          <button type="button" onClick={loadUsers}>Thử lại</button>
        </div>
      )}

      <UserTable
        key={`${search}:${roleFilter}:${statusFilter}:${ordering}`}
        users={filteredUsers}
        isLoading={isLoading}
        currentUserId={currentUser.id}
        onEdit={openEditForm}
        onStatusChange={handleStatusChange}
      />

      {isFormOpen && (
        <UserFormModal
          key={selectedUser?.id || 'new-user'}
          user={selectedUser}
          isSaving={isSaving}
          error={formError}
          onClose={closeForm}
          onSubmit={handleSaveUser}
        />
      )}

      <button
        className="users-page__mobile-create"
        type="button"
        title="Thêm người dùng"
        aria-label="Thêm người dùng"
        onClick={openCreateForm}
      >
        <UserPlus size={24} aria-hidden="true" />
      </button>
    </div>
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
