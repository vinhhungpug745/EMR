import { useCallback, useEffect, useState } from 'react'
import {
  HeartPulse,
  RefreshCcw,
  Search,
  Stethoscope,
} from 'lucide-react'

import { Navigate } from 'react-router-dom'
import { getNurseQueue } from '../../api/nursequeue'
import { createVitalSign } from '../../api/vitalsigns'

import { useAuth } from '../../auth/useAuth'
import NurseQueueTable from '../../components/nurse/NurseQueueTable'
import VitalSignModal from '../../components/nurse/VitalSignModal'
import {PaginationFooter} from "../../components/common/PaginationFooter"
import {Snackbar} from "../../components/common/Snackbar"

import { usePaginatedResource } from '../../utils/usePaginatedResource'
import { useSnackbar } from '../../utils/useSnackbar'

import '../../styles/nurse.css'

const PAGE_SIZE = 8

function NursePage() {
  const { user } = useAuth()

  const [search, setSearch] = useState('')

  const [selectedEncounter, setSelectedEncounter] = useState(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError , setFormError] = useState('')

  const {snackbar, showSnackbar} = useSnackbar()

  const fetchQueue = useCallback(
    ({ page, pageSize }) =>
      getNurseQueue({
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
    errorFallback: 'Không thể tải hàng đợi điều dưỡng.',
  })


  if (user.role !== 'nurse') {
    return <Navigate to="/app" replace />
  }

  function openVitalSignForm(encounter) {
    setFormError(null)
    setSelectedEncounter(encounter)
  }


  function closeVitalSignForm() {
    if (isSubmitting) return

    setSelectedEncounter(null)
    setFormError(null)
  }

  async function handleCreateVitalSign(payload) {
    setIsSubmitting(true)
    setFormError(null)

    try {
      await createVitalSign(payload)

      setSelectedEncounter(null)

      await loadQueue()

      showSnackbar({
        type: 'success',
        message: 'Đã lưu sinh hiệu bệnh nhân.',
      })
    } catch (error) {
      setFormError(error)
    } finally {
      setIsSubmitting(false)
    }
  }


  return (
    <div className="nurse-page">
      <header className="nurse-page__header">
        <div>
          <span className="nurse-page__eyebrow">
            <Stethoscope size={15} />
            Điều dưỡng
          </span>

          <h1>Hàng đợi đo sinh hiệu</h1>

          <p>
            Danh sách bệnh nhân đã được tiếp nhận và đang chờ đo sinh hiệu.
          </p>
        </div>

        <div className="nurse-page__summary">
          <HeartPulse size={20} />

          <div>
            <strong>{pagination.count}</strong>
            <span>Đang chờ</span>
          </div>
        </div>
      </header>


      <section className="nurse-toolbar">
        <label className="nurse-search">
          <Search
            size={17}
            aria-hidden="true"
          />

          <input
            value={search}
            placeholder="Tìm theo tên, SĐT hoặc mã lượt khám"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <button
          className="nurse-refresh"
          type="button"
          disabled={isLoading}
          onClick={loadQueue}
        >
          <RefreshCcw
            size={17}
            className={isLoading ? 'is-spinning' : ''}
          />
        </button>
      </section>


      {errorMessage && (
        <div className="users-page__error">
          <span>{errorMessage}</span>

          <button
            type="button"
            onClick={loadQueue}
          >
            Thử lại
          </button>
        </div>
      )}


      <section className="nurse-panel">
        <NurseQueueTable
          patients={queue}
          isLoading={isLoading}
          onMeasure={openVitalSignForm}
        />

        {!isLoading && pagination.count === 0 && (
          <div className="users-table__empty">
            <strong>Không có bệnh nhân đang chờ</strong>

            <span>
              Chưa có bệnh nhân nào trong hàng đợi đo sinh hiệu.
            </span>
          </div>
        )}

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
      </section>


      <Snackbar snackbar={snackbar} />


      {selectedEncounter && (
        <VitalSignModal
          encounter={selectedEncounter}
          isSubmitting={isSubmitting}
          error={formError}
          onClose={closeVitalSignForm}
          onSubmit={handleCreateVitalSign}
        />
      )}
    </div>
  )
}

export default NursePage