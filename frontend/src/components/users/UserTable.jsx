import { useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
  Pencil,
  UnlockKeyhole,
  Users,
} from 'lucide-react'

import { getRoleLabel } from '../../config/userOptions'

const PAGE_SIZE = 8

export default function UserTable({
  users,
  isLoading,
  currentUserId,
  onEdit,
  onStatusChange,
}) {
  const [page, setPage] = useState(1)
  const [changingUserId, setChangingUserId] = useState(null)
  const pageCount = Math.max(1, Math.ceil(users.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)

  const visibleUsers = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return users.slice(start, start + PAGE_SIZE)
  }, [safePage, users])

  async function handleStatusClick(user) {
    const action = user.is_active ? 'khóa' : 'mở khóa'
    const confirmed = window.confirm(
      `Bạn có chắc muốn ${action} tài khoản ${user.username}?`,
    )
    if (!confirmed) return

    setChangingUserId(user.id)
    try {
      await onStatusChange(user)
    } finally {
      setChangingUserId(null)
    }
  }

  return (
    <section className="users-table-panel" aria-label="Danh sách người dùng">
      <div className="users-table-scroll">
        <table className="users-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Mã nhân viên</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th><span className="sr-only">Thao tác</span></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <LoadingRows />}

            {!isLoading && visibleUsers.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isCurrentUser={user.id === currentUserId}
                isChanging={changingUserId === user.id}
                onEdit={onEdit}
                onStatusClick={handleStatusClick}
              />
            ))}
          </tbody>
        </table>
      </div>

      {!isLoading && users.length === 0 && (
        <div className="users-table__empty">
          <Users size={28} aria-hidden="true" />
          <strong>Không tìm thấy người dùng</strong>
          <span>Thử thay đổi từ khóa hoặc bộ lọc hiện tại.</span>
        </div>
      )}

      {!isLoading && users.length > 0 && (
        <footer className="users-pagination">
          <span>
            Hiển thị {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, users.length)}
            {' '}trong {users.length} người dùng
          </span>
          <div>
            <button
              className="icon-button"
              type="button"
              aria-label="Trang trước"
              disabled={safePage === 1}
              onClick={() => setPage((current) => current - 1)}
            >
              <ChevronLeft size={18} />
            </button>
            <strong>{safePage} / {pageCount}</strong>
            <button
              className="icon-button"
              type="button"
              aria-label="Trang sau"
              disabled={safePage === pageCount}
              onClick={() => setPage((current) => current + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </footer>
      )}
    </section>
  )
}

function UserRow({
  user,
  isCurrentUser,
  isChanging,
  onEdit,
  onStatusClick,
}) {
  const name = user.full_name || user.username
  const initials = getInitials(name)

  return (
    <tr>
      <td>
        <div className="users-table__identity">
          <span className="users-table__avatar" aria-hidden="true">{initials}</span>
          <span>
            <strong>{name}</strong>
            <small>{user.email || `@${user.username}`}</small>
          </span>
        </div>
      </td>
      <td className="users-table__code">
        {user.staff_profile?.employee_code || 'Chưa cập nhật'}
      </td>
      <td>
        <span className={`role-badge role-badge--${user.staff_profile?.role || 'unknown'}`}>
          {getRoleLabel(user.staff_profile?.role)}
        </span>
      </td>
      <td>
        <span className={`status-label status-label--${user.is_active ? 'active' : 'inactive'}`}>
          <i aria-hidden="true" />
          {user.is_active ? 'Đang hoạt động' : 'Đã khóa'}
        </span>
      </td>
      <td>{formatDate(user.date_joined)}</td>
      <td>
        <div className="users-table__actions">
          <button
            className="icon-button"
            type="button"
            title="Chỉnh sửa"
            aria-label={`Chỉnh sửa ${name}`}
            onClick={() => onEdit(user)}
          >
            <Pencil size={17} />
          </button>
          <button
            className="icon-button"
            type="button"
            title={user.is_active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
            aria-label={user.is_active ? `Khóa ${name}` : `Mở khóa ${name}`}
            disabled={isCurrentUser || isChanging}
            onClick={() => onStatusClick(user)}
          >
            {user.is_active
              ? <LockKeyhole size={17} />
              : <UnlockKeyhole size={17} />}
          </button>
        </div>
      </td>
    </tr>
  )
}

function LoadingRows() {
  return Array.from({ length: 5 }, (_, index) => (
    <tr className="users-table__loading" key={index}>
      {Array.from({ length: 6 }, (__, cellIndex) => (
        <td key={cellIndex}><span /></td>
      ))}
    </tr>
  ))
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

function formatDate(value) {
  if (!value) return 'Chưa cập nhật'
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value))
}
