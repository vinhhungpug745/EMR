import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { getOutpatientReport } from '../../api/reports'
import { useAuth } from '../../auth/useAuth'
import { ReportDepartmentTable } from '../../components/admin/ReportDepartmentTable'
import { ReportFilters } from '../../components/admin/ReportFilters'
import { ReportHeader } from '../../components/admin/ReportHeader'
import { ReportSummary } from '../../components/admin/ReportSummary'
import { exportReport } from '../../utils/reportExport'

function initialDates() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return { start_date: `${values.year}-${values.month}-01`, end_date: `${values.year}-${values.month}-${values.day}` }
}

function ReportContent() {
  const [dates, setDates] = useState(initialDates)
  const [filters, setFilters] = useState(dates)
  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterError, setFilterError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    getOutpatientReport(filters, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setReport(data) })
      .catch((requestError) => {
        if (controller.signal.aborted) return
        const detail = requestError.data?.end_date || requestError.data?.start_date
        setError(detail ? [].concat(detail).join(' ') : requestError.message)
      })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false) })
    return () => controller.abort()
  }, [filters])

  function loadReport(nextFilters) {
    setIsLoading(true)
    setError('')
    setFilters({ ...nextFilters })
  }

  function applyFilters(event) {
    event.preventDefault()
    if (dates.start_date > dates.end_date) {
      setFilterError('Ngày kết thúc phải từ ngày bắt đầu trở đi.')
      return
    }
    if ((new Date(dates.end_date) - new Date(dates.start_date)) / 86400000 > 365) {
      setFilterError('Vui lòng chọn tối đa 366 ngày.')
      return
    }
    setFilterError('')
    loadReport(dates)
  }

  return (
    <div className="users-page reports-page">
      <ReportHeader
        canExport={Boolean(report) && !isLoading && !error}
        onExport={() => exportReport(report)}
      />
      <ReportFilters
        dates={dates}
        isLoading={isLoading}
        error={filterError}
        onChange={setDates}
        onSubmit={applyFilters}
      />
      {error && (
        <div className="users-page__error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => loadReport(filters)}>Thử lại</button>
        </div>
      )}
      {isLoading && <p role="status">Đang tổng hợp dữ liệu khám ngoại trú...</p>}
      {!isLoading && !error && report && (
        <>
          <ReportSummary
            summary={report.summary}
            startDate={report.start_date}
            endDate={report.end_date}
          />
          <ReportDepartmentTable departments={report.departments} />
        </>
      )}
    </div>
  )
}

export default function ReportPage() {
  const { user } = useAuth()
  return user.role === 'admin' ? <ReportContent /> : <Navigate to="/app" replace />
}
