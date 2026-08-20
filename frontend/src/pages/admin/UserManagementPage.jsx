import { useCallback, useEffect, useState } from 'react'
import {
  UserPlus,
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
import { Snackbar } from '../../utils/Snackbar'

const SEARCH_DELAY = 350
const PAGE_SIZE = 8

export default function UserManagementPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [ordering, setOrdering] = useState('username')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  })
  const [selectedUser, setSelectedUser] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [pendingStatusChange, setPendingStatusChange] = useState(null)
  const [changingUserId, setChangingUserId] = useState(null)
  const [snackbar, setSnackbar] = useState(null)

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const data = await getUsers({
        search,
        ordering,
        role: roleFilter,
        status: statusFilter,
        page,
        pageSize: PAGE_SIZE,
      })
      setUsers(data.results || [])
      setPagination({
        count: data.count || 0,
        next: data.next,
        previous: data.previous,
      })
    } catch (error) {
      setErrorMessage(error.message || 'Không thể tải danh sách tài khoản.')
    } finally {
      setIsLoading(false)
    }
  }, [ordering, page, roleFilter, search, statusFilter])

  useEffect(() => {
    setPage(1)
  }, [ordering, roleFilter, search, statusFilter])

  useEffect(() => {
    const timer = window.setTimeout(loadUsers, SEARCH_DELAY)
    return () => window.clearTimeout(timer)
  }, [loadUsers])

  useEffect(() => {
    if (!snackbar || snackbar.type === 'confirm') return undefined

    const timer = window.setTimeout(() => {
      setSnackbar(null)
    }, 3000)

    return () => window.clearTimeout(timer)
  }, [snackbar])

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

  function requestStatusChange(user) {
    const action = user.is_active ? 'khóa' : 'mở khóa'

    setPendingStatusChange(user)
    setSnackbar({
      type: 'confirm',
      message: `Bạn có chắc muốn ${action} tài khoản ${user.username}?`,
    })
  }

  async function confirmStatusChange() {
    if (!pendingStatusChange) return

    const user = pendingStatusChange
    const actionResult = user.is_active ? 'khóa' : 'mở khóa'

    setErrorMessage('')
    setSnackbar(null)
    setChangingUserId(user.id)

    try {
      await changeUserStatus(user.id, !user.is_active)
      await loadUsers()
      setSnackbar({
        type: 'success',
        message: `Đã ${actionResult} tài khoản ${user.username}.`,
      })
    } catch (error) {
      setSnackbar({
        type: 'error',
        message: error.message || 'Không thể cập nhật trạng thái tài khoản.',
      })
    } finally {
      setChangingUserId(null)
      setPendingStatusChange(null)
    }
  }

  function cancelStatusChange() {
    setPendingStatusChange(null)
    setSnackbar(null)
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
        users={users}
        isLoading={isLoading}
        currentUserId={currentUser.id}
        page={page}
        pageSize={PAGE_SIZE}
        pagination={pagination}
        changingUserId={changingUserId}
        onEdit={openEditForm}
        onPageChange={setPage}
        onStatusChange={requestStatusChange}
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

      <Snackbar
        snackbar={snackbar}
        onCancel={cancelStatusChange}
        onConfirm={confirmStatusChange}
      />
    </div>
  )
}
