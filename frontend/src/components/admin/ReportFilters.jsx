import { BarChart3 } from 'lucide-react'

export function ReportFilters({ dates, isLoading, error, onChange, onSubmit }) {
  return (
    <>
      <form className="reports-filters" onSubmit={onSubmit}>
        <label className="user-form__field">
          <span>Từ ngày</span>
          <input
            type="date"
            required
            value={dates.start_date}
            onChange={(event) => onChange({ ...dates, start_date: event.target.value })}
          />
        </label>
        <label className="user-form__field">
          <span>Đến ngày</span>
          <input
            type="date"
            required
            value={dates.end_date}
            onChange={(event) => onChange({ ...dates, end_date: event.target.value })}
          />
        </label>
        <button className="primary-button" disabled={isLoading} type="submit">
          <BarChart3 size={17} aria-hidden="true" /> {isLoading ? 'Đang tải...' : 'Xem báo cáo'}
        </button>
      </form>
      {error && <p className="form-error" role="alert">{error}</p>}
    </>
  )
}
