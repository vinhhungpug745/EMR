import { ClipboardList, RefreshCw, Search } from 'lucide-react'

import { formatVietnamDate } from '../../utils/dateTime'
import { PaginationFooter } from '../common/PaginationFooter'

export function ReceptionPatientSearch({
  errorMessage,
  hasSearch,
  isLoading,
  onPageChange,
  onRefresh,
  onRetry,
  onSearchChange,
  onSelectPatient,
  page,
  pageSize,
  pagination,
  patients,
  search,
  selectedPatientId,
  selectingPatientId,
}) {
  const showResults = hasSearch
  const showEmpty = showResults && !isLoading && patients.length === 0

  return (
    <section className="reception-panel reception-search-panel">
      <section className="users-toolbar patients-toolbar reception-toolbar">
        <label className="users-toolbar__search">
          <Search size={17} aria-hidden="true" />
          <input
            value={search}
            placeholder="Tìm bệnh nhân: tên,số điện thoại"
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>

        <button
          className="icon-button users-toolbar__refresh"
          type="button"
          disabled={isLoading || !hasSearch}
          title="Tải lại danh sách"
          aria-label="Tải lại danh sách bệnh nhân"
          onClick={onRefresh}
        >
          <RefreshCw className={isLoading ? 'is-spinning' : ''} size={17} />
        </button>
      </section>

      {!hasSearch && (
        <div className="reception-search-state">
          <ClipboardList size={22} aria-hidden="true" />
          <strong>Chưa nhập thông tin tìm kiếm</strong>
          <span>Danh sách bệnh nhân chỉ hiển thị sau khi có từ khóa.</span>
        </div>
      )}

      {hasSearch && errorMessage && (
        <div className="users-page__error">
          <span>{errorMessage}</span>
          <button type="button" onClick={onRetry}>Thử lại</button>
        </div>
      )}

      {showResults && (
        <div className="reception-patient-list">
          {isLoading && (
            <div className="reception-patient reception-patient--muted">
              <strong>Đang tải...</strong>
              <span>Đang tìm bệnh nhân phù hợp.</span>
            </div>
          )}

          {showEmpty && (
            <div className="reception-search-state reception-search-state--empty">
              <Search size={22} aria-hidden="true" />
              <strong>Không tìm thấy bệnh nhân</strong>
              <span>Kiểm tra lại tên, số điện thoại hoặc tạo hồ sơ bệnh nhân mới.</span>
            </div>
          )}

          {!isLoading && patients.map((patient) => (
            <PatientSelectCard
              key={patient.id}
              isSelected={selectedPatientId === patient.id}
              isSelecting={selectingPatientId === patient.id}
              patient={patient}
              onSelect={() => onSelectPatient(patient)}
            />
          ))}
        </div>
      )}

      {showResults && !isLoading && pagination.count > 0 && (
        <PaginationFooter
          count={pagination.count}
          entityLabel="bệnh nhân"
          page={page}
          pageSize={pageSize}
          previous={pagination.previous}
          next={pagination.next}
          onPageChange={onPageChange}
        />
      )}
    </section>
  )
}

function PatientSelectCard({ isSelected, isSelecting, onSelect, patient }) {
  return (
    <button
      className={`reception-patient ${isSelected ? 'is-selected' : ''}`}
      type="button"
      disabled={isSelecting}
      onClick={onSelect}
    >
      <span className="reception-patient__avatar">{getInitials(patient.full_name)}</span>
      <span className="reception-patient__content">
        <strong>{patient.full_name}</strong>
        <small>
          {patient.phone || 'Chưa có SĐT'} · {formatVietnamDate(patient.date_of_birth, 'Chưa có ngày sinh')}
          {isSelecting ? ' · Đang chọn' : ''}
        </small>
      </span>
    </button>
  )
}

function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'BN'
}
