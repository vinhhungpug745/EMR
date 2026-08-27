import { useCallback, useState } from 'react'
import { Eye, RefreshCw, Search, Stethoscope } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'

import { getEncounters } from '../../api/encounters'
import { useAuth } from '../../auth/useAuth'
import { PaginationFooter } from '../../components/common/PaginationFooter'
import { formatVietnamTime } from '../../utils/dateTime'
import { usePaginatedResource } from '../../utils/usePaginatedResource'


const PAGE_SIZE = 8

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'in_progress', label: 'Đang khám' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
]

export default function EncounterListPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('in_progress')

  const fetchEncounters = useCallback(
    ({ page, pageSize }) =>
      getEncounters({
        search,
        status,
        ordering: '-started_at',
        page,
        pageSize,
      }),
    [search, status],
  )

  const {
    items: encounters,
    page,
    setPage,
    pageSize,
    pagination,
    isLoading,
    errorMessage,
    loadItems,
  } = usePaginatedResource({
    fetchPage: fetchEncounters,
    resetKey: `${search}-${status}`,
    pageSize: PAGE_SIZE,
    errorFallback: 'Không thể tải danh sách lượt khám.',
  })

  if (user?.role !== 'doctor') {
    return <Navigate to="/app" replace />
  }

  return (
    <div className="doctor-page">
      <header className="doctor-page__header">
        <div>
          <span className="doctor-page__eyebrow">
            <Stethoscope size={15} />
            Thực hiện khám bệnh
          </span>

          <h1>Danh sách lượt khám</h1>

          <p>
            Theo dõi các lượt đang khám và mở chi tiết để tiếp tục cập nhật bệnh án.
          </p>
        </div>

        <div className="doctor-page__summary">
          <Stethoscope size={20} />

          <div>
            <strong>{pagination.count}</strong>
            <span>Lượt khám</span>
          </div>
        </div>
      </header>

      <section className="doctor-toolbar">
        <label className="doctor-search">
          <Search size={17} />

          <input
            value={search}
            placeholder="Tìm tên, mã lượt khám hoặc triệu chứng"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <select
          className="doctor-filter"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="icon-button"
          disabled={isLoading}
          onClick={loadItems}
        >
          <RefreshCw
            size={17}
            className={isLoading ? 'is-spinning' : ''}
          />
        </button>
      </section>

      {errorMessage && (
        <div className="users-page__error">
          <span>{errorMessage}</span>

          <button type="button" onClick={loadItems}>
            Thử lại
          </button>
        </div>
      )}

      <section className="encounter-list">
        {isLoading ? (
          <div className="consultation-queue-state">
            <Stethoscope size={32} className="is-spinning" />
            <strong>Đang tải danh sách lượt khám...</strong>
            <span>Vui lòng chờ trong giây lát.</span>
          </div>
        ) : encounters.length ? (
          encounters.map((encounter) => (
            <article className="encounter-list-card" key={encounter.id}>
              <div>
                <strong>{encounter.patient_name || 'Chưa rõ bệnh nhân'}</strong>
                <span>{encounter.visit_number || 'Chưa có mã lượt khám'}</span>
              </div>

              <div>
                <small>Khoa khám</small>
                <span>{encounter.department_name || 'Chưa phân khoa'}</span>
              </div>

              <div>
                <small>Trạng thái</small>
                <span>{encounter.status_display || encounter.status}</span>
              </div>

              <div>
                <small>Bắt đầu</small>
                <span>{formatVietnamTime(encounter.started_at)}</span>
              </div>

              <Link
                className="doctor-detail-button"
                to={`/app/encounters/${encounter.id}`}
              >
                <Eye size={16} />
                Xem chi tiết
              </Link>
            </article>
          ))
        ) : (
          <div className="consultation-queue-state">
            <Stethoscope size={34} />
            <strong>Không có lượt khám phù hợp</strong>
            <span>Những lượt đã bắt đầu khám sẽ xuất hiện tại đây.</span>
          </div>
        )}
      </section>

      {!isLoading && (
        <PaginationFooter
          count={pagination.count}
          entityLabel="lượt khám"
          page={page}
          pageSize={pageSize}
          previous={pagination.previous}
          next={pagination.next}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
