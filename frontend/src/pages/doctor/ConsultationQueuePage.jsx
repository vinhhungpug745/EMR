import { useCallback, useState } from 'react'
import {
  RefreshCw,
  Search,
  Stethoscope,
} from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'

import { getConsultationQueue } from '../../api/consultationQueue'
import { startEncounter } from '../../api/encounters'
import { useAuth } from '../../auth/useAuth'
import { PaginationFooter } from '../../components/common/PaginationFooter'
import ConsultationQueueTable from '../../components/doctor/ConsultationQueueTable'
import { usePaginatedResource } from '../../utils/usePaginatedResource'


const PAGE_SIZE = 8

export default function ConsultationQueuePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [startingId, setStartingId] = useState(null)
  const [startError, setStartError] = useState('')

  const handleStartEncounter = async (encounter) => {
    setStartingId(encounter.id)
    setStartError('')

    try {
      await startEncounter(encounter.id)
      navigate(`/app/encounters/${encounter.id}`)
    } catch (error) {
      console.error(error)
      setStartError('Không thể bắt đầu lượt khám. Vui lòng thử lại.')
    } finally {
      setStartingId(null)
    }
  }


  const fetchQueue = useCallback(
    ({ page, pageSize }) =>
      getConsultationQueue({
        search,
        ordering: 'visit__arrived_at',
        page,
        pageSize,
      }),
    [search],
  )

  const {
    items: queue,
    page,
    setPage,
    pageSize,
    pagination,
    isLoading,
    errorMessage,
    loadItems: loadQueue,
  } = usePaginatedResource({
    fetchPage: fetchQueue,
    resetKey: search,
    pageSize: PAGE_SIZE,
    errorFallback: 'Không thể tải hàng đợi chờ khám.',
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
            Bác sĩ
          </span>

          <h1>Bệnh nhân chờ khám</h1>

          <p>
            Danh sách bệnh nhân đã hoàn tất đo sinh hiệu và đang chờ bác sĩ khám.
          </p>
        </div>

        <div className="doctor-page__summary">
          <Stethoscope size={20} />

          <div>
            <strong>{pagination.count}</strong>
            <span>Chờ khám</span>
          </div>
        </div>
      </header>

      <section className="doctor-toolbar">
        <label className="doctor-search">
          <Search size={17} />

          <input
            value={search}
            placeholder="Tìm tên, SĐT hoặc mã lượt khám"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <button
          type="button"
          className="icon-button"
          disabled={isLoading}
          onClick={loadQueue}
        >
          <RefreshCw
            size={17}
            className={isLoading ? 'is-spinning' : ''}
          />
        </button>
      </section>

      {(errorMessage || startError) && (
        <div className="users-page__error">
          <span>{errorMessage || startError}</span>

          <button
            type="button"
            onClick={errorMessage ? loadQueue : () => setStartError('')}
          >
            {errorMessage ? 'Thử lại' : 'Đóng'}
          </button>
        </div>
      )}

      <ConsultationQueueTable
        encounters={queue}
        isLoading={isLoading}
        onStart={handleStartEncounter}
        startingId={startingId}
      />

      {!isLoading && (
        <PaginationFooter
          count={pagination.count}
          entityLabel="bệnh nhân"
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
