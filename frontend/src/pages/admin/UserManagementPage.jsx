import { useCallback, useState } from 'react'
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
import UserFormModal from '../../components/admin/UserFormModal'
import UserTable from '../../components/admin/UserTable'
import UserToolbar from '../../components/admin/UserToolbar'
import { Snackbar } from '../../components/common/Snackbar'
import { usePaginatedResource } from '../../utils/usePaginatedResource'
import { useStatusToggle } from '../../utils/useStatusToggle'

const PAGE_SIZE = 8

export default function UserManagementPage() {
  const { user: currentUser } = useAuth()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [ordering, setOrdering] = useState('username')
  const [selectedUser, setSelectedUser] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  const fetchUsers = useCallback(({ page, pageSize }) => getUsers({
    search,
    ordering,
    role: roleFilter,
    status: statusFilter,
    page,
    pageSize,
  }), [ordering, roleFilter, search, statusFilter])

  const {
    items: users,
    page,
    setPage,
    pageSize,
    pagination,
    isLoading,
    errorMessage,
    loadItems: loadUsers,
  } = usePaginatedResource({
    fetchPage: fetchUsers,
    resetKey: `${ordering}|${roleFilter}|${search}|${statusFilter}`,
    pageSize: PAGE_SIZE,
    errorFallback: 'Không thể tải danh sách tài khoản.',
  })

  const {
    snackbar,
    updatingId: changingUserId,
    requestStatusChange,
    cancelStatusChange,
    confirmStatusChange,
  } = useStatusToggle({
    updateStatus: (user, nextActive) => changeUserStatus(user.id, nextActive),
    getName: (user) => user.username,
    getCurrentStatus: (user) => user.is_active,
    getConfirmMessage: (user) => (
      `Bạn có chắc muốn ${user.is_active ? 'khóa' : 'mở khóa'} tài khoản ${user.username}?`
    ),
    getSuccessMessage: (user) => (
      `Đã ${user.is_active ? 'khóa' : 'mở khóa'} tài khoản ${user.username}.`
    ),
    onSuccess: loadUsers,
    errorFallback: 'Không thể cập nhật trạng thái tài khoản.',
  })

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
        pageSize={pageSize}
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
