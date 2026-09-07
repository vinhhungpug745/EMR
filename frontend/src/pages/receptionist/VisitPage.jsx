import { useCallback, useState } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import { Navigate } from 'react-router-dom'

import { getVisits } from '../../api/visits'
import { useAuth } from '../../auth/useAuth'
import { PaginationFooter } from '../../components/common/PaginationFooter'
import { VisitTable } from '../../components/receptionist/VisitTable'
import { usePaginatedResource } from '../../utils/usePaginatedResource'

const PAGE_SIZE = 8

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'checked_in', label: 'Đã tiếp nhận' },
  { value: 'in_progress', label: 'Đang khám' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
]

export default function VisitPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const fetchVisits = useCallback(({ page, pageSize }) => getVisits({
    search,
    status,
    ordering: '-arrived_at',
    page,
    pageSize,
  }), [search, status])

  const {
    items: visits,
    page,
    setPage,
    pageSize,
    pagination,
    isLoading,
    errorMessage,
    loadItems: loadVisits,
  } = usePaginatedResource({
    fetchPage: fetchVisits,
    resetKey: `${search}-${status}`,
    pageSize: PAGE_SIZE,
    errorFallback: 'Không thể tải danh sách lần đến khám.',
  })

  if (user.role !== 'receptionist') {
    return <Navigate to="/app" replace />
  }

  return (
    <div className="users-page visit-page">
      <header className="users-page__header">
        <div>
          <h1>Lần đến khám</h1>
          <p>Theo dõi trạng thái các lần tiếp nhận, từ lúc ghi nhận đến khi hoàn tất hoặc hủy.</p>
        </div>
      </header>

      <section className="users-toolbar visit-toolbar">
        <label className="users-toolbar__search">
          <Search size={17} aria-hidden="true" />
          <input
            value={search}
            placeholder="Tìm theo tên bệnh nhân, mã lần đến hoặc lý do khám"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <select
          aria-label="Lọc theo trạng thái lần đến khám"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          {STATUS_FILTERS.map((option) => (
            <option key={option.value || 'all'} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          className="icon-button users-toolbar__refresh"
          type="button"
          disabled={isLoading}
          onClick={loadVisits}
        >
          <RefreshCw className={isLoading ? 'is-spinning' : ''} size={17} />
        </button>
      </section>

      {errorMessage && (
        <div className="users-page__error">
          <span>{errorMessage}</span>
          <button type="button" onClick={loadVisits}>Thử lại</button>
        </div>
      )}

      <section className="users-table-panel visit-table-panel">
        <VisitTable
          isLoading={isLoading}
          visits={visits}
        />

        {!isLoading && pagination.count === 0 && (
          <div className="users-table__empty">
            <strong>Chưa có lần đến khám</strong>
            <span>Các lượt được tạo sau khi tiếp nhận bệnh nhân sẽ xuất hiện tại đây.</span>
          </div>
        )}

        {!isLoading && (
          <PaginationFooter
            count={pagination.count}
            entityLabel="lần đến khám"
            page={page}
            pageSize={pageSize}
            previous={pagination.previous}
            next={pagination.next}
            onPageChange={setPage}
          />
        )}
      </section>
    </div>
  )
}
