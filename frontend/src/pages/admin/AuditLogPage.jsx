import { useEffect, useState } from 'react'
import { FileClock, RefreshCw, Search, SlidersHorizontal, X, AlertCircle } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { getAuditLogs } from '../../api/auditLogs'
import { useAuth } from '../../auth/useAuth'
import { AuditLogDetailModal } from '../../components/admin/AuditLogDetailModal'
import { AuditLogTable } from '../../components/admin/AuditLogTable'
import { PaginationFooter } from '../../components/common/PaginationFooter'
import { AUDIT_ACTIONS, AUDIT_RESOURCES } from '../../config/auditLogOptions'

const EMPTY_FILTERS = { search: '', action: '', resource_type: '', start_date: '', end_date: '' }
const PAGE_SIZE = 8

function AuditLogContent() {
  const [draft, setDraft] = useState(EMPTY_FILTERS)
  const [query, setQuery] = useState({ filters: EMPTY_FILTERS, page: 1 })
  const [data, setData] = useState({ results: [], count: 0, next: null, previous: null })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterError, setFilterError] = useState('')
  const [selectedLog, setSelectedLog] = useState(null)
  const activeFilterCount = Object.values(query.filters).filter(Boolean).length

  useEffect(() => {
    const controller = new AbortController()
    getAuditLogs({ ...query.filters, page: query.page, pageSize: PAGE_SIZE }, controller.signal)
      .then((result) => { if (!controller.signal.aborted) setData(result) })
      .catch((requestError) => {
        if (controller.signal.aborted) return
        const detail = requestError.data?.start_date || requestError.data?.end_date
        setError(detail ? [].concat(detail).join(' ') : requestError.message || 'Không thể tải nhật ký hoạt động.')
      })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false) })
    return () => controller.abort()
  }, [query])

  function load(filters = query.filters, page = query.page) {
    setIsLoading(true)
    setError('')
    setQuery({ filters, page })
  }

  function changeField(event) {
    const { name, value } = event.target
    setDraft((current) => ({ ...current, [name]: value }))
    setFilterError('')
  }

  function applyFilters(event) {
    event.preventDefault()
    if (draft.start_date && draft.end_date && draft.start_date > draft.end_date) {
      setFilterError('Ngày kết thúc phải từ ngày bắt đầu trở đi.')
      return
    }
    setFilterError('')
    load({ ...draft, search: draft.search.trim() }, 1)
  }

  function resetFilters() {
    setDraft(EMPTY_FILTERS)
    setFilterError('')
    load(EMPTY_FILTERS, 1)
  }

  return (
    <div className="users-page audit-page">
      <header className="users-page__header audit-page__header">
        <div className="audit-page__title">
          <span className="audit-page__icon"><FileClock size={23} aria-hidden="true" /></span>
          <div>
          <h1>Nhật ký hoạt động</h1>
          <p>Theo dõi và tra cứu lịch sử thao tác trên hệ thống.</p>
          </div>
        </div>
        <button className="secondary-button" type="button" disabled={isLoading} onClick={() => load()}>
          <RefreshCw size={17} className={isLoading ? 'is-spinning' : ''} aria-hidden="true" />
          Làm mới
        </button>
      </header>

      <section className="audit-panel" aria-label="Danh sách nhật ký">
      <form className="audit-filters" onSubmit={applyFilters} aria-label="Bộ lọc nhật ký">
        <div className="audit-filters__top">
          <label className="audit-search">
            <Search size={18} aria-hidden="true" />
            <input type="search" aria-label="Tìm kiếm nhật ký" name="search" value={draft.search} onChange={changeField}
              placeholder="Tìm người dùng, mã đối tượng, mô tả hoặc IP..." />
          </label>
          <button className="primary-button" type="submit" disabled={isLoading}>Tìm kiếm</button>
        </div>
        <div className="audit-filters__row">
        <span className="audit-filters__label"><SlidersHorizontal size={15} aria-hidden="true" />Bộ lọc</span>
        <label className="audit-filter-field">
          <span>Hành động</span>
          <select name="action" value={draft.action} onChange={changeField}>
            <option value="">Tất cả hành động</option>
            {Object.entries(AUDIT_ACTIONS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="audit-filter-field">
          <span>Đối tượng</span>
          <select name="resource_type" value={draft.resource_type} onChange={changeField}>
            <option value="">Tất cả đối tượng</option>
            {Object.entries(AUDIT_RESOURCES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="audit-filter-field">
          <span>Từ ngày</span>
          <input type="date" name="start_date" value={draft.start_date} onChange={changeField} max="9998-12-31" />
        </label>
        <label className="audit-filter-field">
          <span>Đến ngày</span>
          <input type="date" name="end_date" value={draft.end_date} onChange={changeField} max="9998-12-31"
            aria-invalid={Boolean(filterError)} aria-describedby={filterError ? 'audit-filter-error' : undefined} />
        </label>
          <button className="audit-reset" type="button" disabled={isLoading} onClick={resetFilters}>
            <X size={14} aria-hidden="true" />Đặt lại
          </button>
        </div>
        {filterError && <p className="audit-filters__error" id="audit-filter-error" role="alert">{filterError}</p>}
      </form>

      {error && (
        <div className="users-page__error audit-error" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{error}</span>
          <button type="button" onClick={() => load()}>Thử lại</button>
        </div>
      )}

        <header className="audit-results-header">
          <div>
            <h2>Lịch sử hoạt động</h2>
            {!isLoading && !error && <span className="audit-count">{data.count} bản ghi</span>}
            {activeFilterCount > 0 && <span className="audit-filter-count">{activeFilterCount} bộ lọc</span>}
          </div>
          <span>Mới nhất trước · Giờ Việt Nam</span>
        </header>
        {isLoading ? (
          <div className="audit-empty" role="status">
            <RefreshCw size={25} className="is-spinning" aria-hidden="true" />
            <strong>Đang tải nhật ký...</strong>
          </div>
        ) : error ? (
          <div className="audit-empty">
            <span className="audit-empty__icon"><AlertCircle size={28} aria-hidden="true" /></span>
            <strong>Chưa tải được lịch sử hoạt động</strong>
            <span>Vui lòng thử lại để cập nhật danh sách.</span>
          </div>
        ) : data.results.length ? (
          <>
            <AuditLogTable logs={data.results} onSelect={setSelectedLog} />
            <PaginationFooter count={data.count} entityLabel="nhật ký" page={query.page}
              pageSize={PAGE_SIZE} next={data.next} previous={data.previous}
              onPageChange={(page) => load(query.filters, page)} />
          </>
        ) : (
          <div className="audit-empty" role="status">
            <span className="audit-empty__icon"><FileClock size={30} aria-hidden="true" /></span>
            <strong>{activeFilterCount ? 'Không tìm thấy hoạt động phù hợp' : 'Chưa có hoạt động được ghi nhận'}</strong>
            <span>{activeFilterCount ? 'Thử đổi từ khóa hoặc mở rộng khoảng thời gian.' : 'Các thao tác được hệ thống ghi nhận sẽ xuất hiện tại đây.'}</span>
            {activeFilterCount > 0 && <button className="secondary-button" type="button" onClick={resetFilters}>Xóa bộ lọc</button>}
          </div>
        )}
      </section>

      {selectedLog && <AuditLogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  )
}

export default function AuditLogPage() {
  const { user } = useAuth()
  return user?.role === 'admin' ? <AuditLogContent /> : <Navigate to="/app" replace />
}
