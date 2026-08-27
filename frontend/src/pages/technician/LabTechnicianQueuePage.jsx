import { useCallback, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { RefreshCw, Search } from 'lucide-react'

import { useAuth } from '../../auth/useAuth'
import { updateLabTest } from '../../api/labtests'
import { getLabTechnicianQueue } from '../../api/labTestQueue'
import { PaginationFooter } from '../../components/common/PaginationFooter'
import { LabTechnicianQueueModal } from '../../components/technician/LabTechnicianQueueModal'
import { LabTechnicianQueueTable } from '../../components/technician/LabTechnicianQueueTable'
import { usePaginatedResource } from '../../utils/usePaginatedResource'

const PAGE_SIZE = 8

export default function LabTechnicianQueuePage() {
  const { user } = useAuth()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [result, setResult] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const fetchQueue = useCallback(
    ({ page, pageSize }) =>
      getLabTechnicianQueue({
        search: searchTerm,
        ordering: 'ordered_at',
        page,
        pageSize,
      }),
    [searchTerm],
  )

  const {
    items: orders,
    page,
    setPage,
    pageSize,
    pagination,
    isLoading,
    errorMessage: loadError,
    loadItems,
  } = usePaginatedResource({
    fetchPage: fetchQueue,
    resetKey: searchTerm,
    pageSize: PAGE_SIZE,
    errorFallback: 'Không thể tải hàng đợi xét nghiệm.',
  })

  if (user?.role !== 'lab_technician') {
    return <Navigate to="/app" replace />
  }

  function handleSelectOrder(order) {
    setSelectedOrder(order)
    setResult(order.result || '')
    setErrorMessage('')
  }

  function handleCloseModal() {
    setSelectedOrder(null)
    setResult('')
    setErrorMessage('')
  }

  async function handleStart(order) {
    setIsSaving(true)
    setErrorMessage('')

    try {
      const updated = await updateLabTest(order.id, {
        status: 'processing',
      })

      setSelectedOrder(updated)

      await loadItems()
    } catch (error) {
      console.error(error)

      setErrorMessage(
        error?.message || 'Không thể tiếp nhận chỉ định.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleComplete() {
    if (!selectedOrder) {
      return
    }

    if (!result.trim()) {
      setErrorMessage(
        'Vui lòng nhập kết quả trước khi hoàn tất.',
      )
      return
    }

    setIsSaving(true)
    setErrorMessage('')

    try {
      await updateLabTest(selectedOrder.id, {
        status: 'completed',
        result: result.trim(),
      })

      handleCloseModal()

      await loadItems()
    } catch (error) {
      console.error(error)

      setErrorMessage(
        error?.message ||
          'Không thể lưu kết quả xét nghiệm.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="doctor-page technician-page">
      <header className="page-heading technician-page__heading">
        <div>
          <p className="page-heading__context">
            Nhân viên xét nghiệm
          </p>

          <h1>Hàng đợi xét nghiệm</h1>

          <p>
            Tiếp nhận chỉ định, nhập kết quả và trả về lượt khám
            cho bác sĩ.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={loadItems}
        >
          <RefreshCw size={16} />
          Tải lại
        </button>
      </header>

      <section className="technician-overview" aria-label="Tổng quan hàng đợi xét nghiệm">
        <article className="technician-stat-card">
          <span>Chờ tiếp nhận</span>
          <strong>{pagination.count || orders.length}</strong>
          <small>Chỉ định phù hợp đơn vị xét nghiệm của bạn</small>
        </article>

        <article className="technician-stat-card technician-stat-card--accent">
          <span>Quy trình</span>
          <strong>3 bước</strong>
          <small>Tiếp nhận, nhập kết quả, hoàn tất</small>
        </article>
      </section>

      <section className="users-toolbar technician-toolbar">
        <label className="users-toolbar__search technician-toolbar__search">
          <Search size={17} />

          <input
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            placeholder="Tìm mã lượt khám, bệnh nhân, tên xét nghiệm..."
          />
        </label>
      </section>

      {(loadError || errorMessage) && (
        <div className="users-page__error">
          <span>{loadError || errorMessage}</span>
        </div>
      )}

      <section className="technician-queue-panel">
        <div className="technician-queue-panel__header">
          <div>
            <h2>Danh sách chỉ định</h2>
            <p>Ưu tiên xử lý các chỉ định được gửi sớm nhất.</p>
          </div>

          <span>{pagination.count || orders.length} chỉ định</span>
        </div>

        <LabTechnicianQueueTable
          orders={orders}
          isLoading={isLoading}
          onSelectOrder={handleSelectOrder}
        />

        <PaginationFooter
          count={pagination.count}
          entityLabel="chỉ định"
          page={page}
          pageSize={pageSize}
          previous={pagination.previous}
          next={pagination.next}
          onPageChange={setPage}
        />
      </section>

      <LabTechnicianQueueModal
        order={selectedOrder}
        result={result}
        errorMessage={errorMessage}
        onResultChange={setResult}
        onClose={handleCloseModal}
        onStart={handleStart}
        onComplete={handleComplete}
        isSaving={isSaving}
      />
    </div>
  )
}
