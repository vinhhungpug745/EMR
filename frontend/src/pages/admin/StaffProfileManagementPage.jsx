import { useCallback, useState } from 'react'
import {
  BadgeInfo,
  LockKeyhole,
  RefreshCw,
  Search,
  UnlockKeyhole,
  UserRound,
} from 'lucide-react'
import { Navigate } from 'react-router-dom'

import { getStaffProfiles, updateStaffProfile } from '../../api/staffProfiles'
import { useAuth } from '../../auth/useAuth'
import ProfessionalProfileModal from '../../components/admin/ProfessionalProfileModal'
import { getRoleLabel, USER_ROLE_OPTIONS } from '../../config/userOptions'
import { PaginationFooter } from '../../components/common/PaginationFooter'
import { Snackbar } from '../../components/common/Snackbar'
import { usePaginatedResource } from '../../utils/usePaginatedResource'
import { useStatusToggle } from '../../utils/useStatusToggle'

const PAGE_SIZE = 8

export default function StaffProfileManagementPage() {
  const { user: currentUser } = useAuth()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedStaff, setSelectedStaff] = useState(null)

  const fetchStaffProfiles = useCallback(({ page, pageSize }) => getStaffProfiles({
    search,
    role: roleFilter,
    page,
    pageSize,
  }), [roleFilter, search])

  const {
    items: staffProfiles,
    setItems: setStaffProfiles,
    page,
    setPage,
    pageSize,
    pagination,
    isLoading,
    errorMessage,
    loadItems: loadStaffProfiles,
  } = usePaginatedResource({
    fetchPage: fetchStaffProfiles,
    resetKey: `${roleFilter}|${search}`,
    pageSize: PAGE_SIZE,
    errorFallback: 'Không thể tải danh sách hồ sơ nhân viên.',
  })

  const {
    snackbar,
    updatingId: changingStaffId,
    requestStatusChange,
    cancelStatusChange,
    confirmStatusChange,
  } = useStatusToggle({
    updateStatus: (staff, nextActive) => updateStaffProfile(staff.id, { active: nextActive }),
    getName: (staff) => staff.full_name,
    getConfirmMessage: (staff, nextActive) => (
      `${nextActive ? 'Mở khóa' : 'Khóa'} hồ sơ nhân viên ${staff.full_name}?`
    ),
    getSuccessMessage: (staff, nextActive) => (
      `Đã ${nextActive ? 'mở khóa' : 'khóa'} hồ sơ nhân viên ${staff.full_name}.`
    ),
    onSuccess: (staff, updatedStaff, nextActive) => {
      setStaffProfiles((currentStaffProfiles) => currentStaffProfiles.map((item) => (
        item.id === staff.id
          ? { ...item, active: updatedStaff.active ?? nextActive }
          : item
      )))
    },
    errorFallback: 'Không thể cập nhật trạng thái hồ sơ nhân viên.',
  })

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

      <section className="users-toolbar users-toolbar--staff-profiles" aria-label="Bộ lọc hồ sơ nhân viên">
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
            <colgroup>
              <col style={{ width: '32%' }} />
              <col style={{ width: '17%' }} />
              <col style={{ width: '17%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '16%' }} />
            </colgroup>
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Mã nhân viên</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th><span className="sr-only">Thao tác</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <LoadingRows />}

              {!isLoading && staffProfiles.map((staff) => (
                <StaffProfileRow
                  key={staff.id}
                  staff={staff}
                  isCurrentStaff={staff.id === currentUser.staff_id}
                  isChanging={changingStaffId === staff.id}
                  onEditProfessionalProfile={openProfessionalProfile}
                  onStatusChange={requestStatusChange}
                />
              ))}
            </tbody>
          </table>
        </div>

        {!isLoading && pagination.count === 0 && (
          <div className="users-table__empty">
            <UserRound size={28} aria-hidden="true" />
            <strong>Không tìm thấy hồ sơ nhân viên</strong>
            <span>Thử thay đổi từ khóa hoặc bộ lọc hiện tại.</span>
          </div>
        )}

        {!isLoading && (
          <PaginationFooter
            count={pagination.count}
            entityLabel="hồ sơ nhân viên"
            page={page}
            pageSize={pageSize}
            previous={pagination.previous}
            next={pagination.next}
            onPageChange={setPage}
          />
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

      <Snackbar
        snackbar={snackbar}
        onCancel={cancelStatusChange}
        onConfirm={confirmStatusChange}
      />
    </div>
  )
}

function StaffProfileRow({
  staff,
  isCurrentStaff,
  isChanging,
  onEditProfessionalProfile,
  onStatusChange,
}) {
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
        <span className={`status-label status-label--${staff.active ? 'active' : 'inactive'}`}>
          {staff.active ? 'Đang hoạt động' : 'Đã khóa'}
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
          <button
            className="icon-button"
            type="button"
            title={isCurrentStaff
              ? 'Không thể khóa hồ sơ đang đăng nhập'
              : staff.active ? 'Khóa hồ sơ nhân viên' : 'Mở khóa hồ sơ nhân viên'}
            aria-label={staff.active ? `Khóa hồ sơ ${name}` : `Mở khóa hồ sơ ${name}`}
            disabled={isCurrentStaff || isChanging}
            onClick={() => onStatusChange(staff)}
          >
            {staff.active
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
      {Array.from({ length: 5 }, (__, cellIndex) => (
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
