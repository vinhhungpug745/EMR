import { RefreshCw, Search } from 'lucide-react'

import {
  USER_ORDERING_OPTIONS,
  USER_ROLE_OPTIONS,
  USER_STATUS_OPTIONS,
} from '../../config/userOptions'

export default function UserToolbar({
  search,
  roleFilter,
  statusFilter,
  ordering,
  isLoading,
  onSearchChange,
  onRoleChange,
  onStatusChange,
  onOrderingChange,
  onRefresh,
}) {
  return (
    <section className="users-toolbar" aria-label="Bộ lọc người dùng">
      <label className="users-toolbar__search">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          value={search}
          placeholder="Tìm theo tên đăng nhập, họ tên hoặc email..."
          aria-label="Tìm kiếm người dùng"
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>

      <select
        value={roleFilter}
        aria-label="Lọc theo vai trò"
        onChange={(event) => onRoleChange(event.target.value)}
      >
        <option value="all">Tất cả vai trò</option>
        {USER_ROLE_OPTIONS.map((role) => (
          <option key={role.value} value={role.value}>{role.label}</option>
        ))}
      </select>

      <select
        value={statusFilter}
        aria-label="Lọc theo trạng thái"
        onChange={(event) => onStatusChange(event.target.value)}
      >
        {USER_STATUS_OPTIONS.map((status) => (
          <option key={status.value} value={status.value}>{status.label}</option>
        ))}
      </select>

      <select
        value={ordering}
        aria-label="Sắp xếp danh sách"
        onChange={(event) => onOrderingChange(event.target.value)}
      >
        {USER_ORDERING_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>

      <button
        className="icon-button users-toolbar__refresh"
        type="button"
        title="Tải lại dữ liệu"
        aria-label="Tải lại dữ liệu"
        disabled={isLoading}
        onClick={onRefresh}
      >
        <RefreshCw size={18} className={isLoading ? 'is-spinning' : ''} />
      </button>
    </section>
  )
}
