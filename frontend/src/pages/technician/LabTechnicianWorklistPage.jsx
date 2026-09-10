import { useCallback, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { RefreshCw, Search } from 'lucide-react'

import { getLabTests, updateLabTest } from '../../api/labtests'
import { useAuth } from '../../auth/useAuth'
import { PaginationFooter } from '../../components/common/PaginationFooter'
import { LabTechnicianQueueModal } from '../../components/technician/LabTechnicianQueueModal'
import { LabTechnicianQueueTable } from '../../components/technician/LabTechnicianQueueTable'
import { usePaginatedResource } from '../../utils/usePaginatedResource'

const PAGE_SIZE = 8
const POLL_INTERVAL = 15_000

const WORKLIST_CONFIG = {
  ordered: {
    title: 'Chỉ định mới',
    description: 'Tiếp nhận các chỉ định xét nghiệm mới được bác sĩ gửi đến.',
    statLabel: 'Chờ tiếp nhận',
    statHint: 'Chỉ định phù hợp đơn vị xét nghiệm của bạn',
    panelTitle: 'Danh sách chỉ định mới',
    panelDescription: 'Ưu tiên tiếp nhận các chỉ định được gửi sớm nhất.',
    emptyTitle: 'Không có chỉ định đang chờ',
    emptyDescription: 'Danh sách sẽ tự cập nhật khi bác sĩ gửi chỉ định mới.',
    ordering: 'ordered_at',
    timeLabel: 'Thời điểm chỉ định',
    timeField: 'ordered_at',
  },
  processing: {
    title: 'Đang thực hiện',
    description: 'Nhập kết quả cho các xét nghiệm đã tiếp nhận.',
    statLabel: 'Đang thực hiện',
    statHint: 'Các chỉ định đã được tiếp nhận và chờ kết quả',
    panelTitle: 'Danh sách đang thực hiện',
    panelDescription: 'Mở từng chỉ định để nhập kết quả xét nghiệm.',
    emptyTitle: 'Không có xét nghiệm đang thực hiện',
    emptyDescription: 'Các chỉ định sau khi tiếp nhận sẽ xuất hiện tại đây.',
    ordering: 'ordered_at',
    timeLabel: 'Thời điểm tiếp nhận',
    timeField: 'updated_at',
  },
  completed: {
    title: 'Đã có kết quả',
    description: 'Tra cứu các xét nghiệm đã hoàn tất và trả kết quả cho bác sĩ.',
    statLabel: 'Đã có kết quả',
    statHint: 'Các xét nghiệm đã hoàn tất trong đơn vị của bạn',
    panelTitle: 'Danh sách đã có kết quả',
    panelDescription: 'Mở từng chỉ định để xem lại nội dung kết quả.',
    emptyTitle: 'Chưa có kết quả xét nghiệm',
    emptyDescription: 'Các xét nghiệm hoàn tất sẽ được lưu tại đây.',
    ordering: '-performed_at',
    timeLabel: 'Thời điểm hoàn tất',
    timeField: 'performed_at',
  },
}

export default function LabTechnicianWorklistPage({ status }) {
  const { user } = useAuth()
  const config = WORKLIST_CONFIG[status] || WORKLIST_CONFIG.ordered

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [result, setResult] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const fetchOrders = useCallback(
    ({ page, pageSize }) =>
      getLabTests({
        status,
        search: searchTerm,
        ordering: config.ordering,
        page,
        pageSize,
      }),
    [config.ordering, searchTerm, status],
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
    fetchPage: fetchOrders,
    resetKey: `${status}-${searchTerm}`,
    pageSize: PAGE_SIZE,
    pollInterval: POLL_INTERVAL,
    pollingEnabled: !selectedOrder && !isSaving,
    errorFallback: 'Không thể tải danh sách xét nghiệm.',
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
      setResult(updated.result || '')
      await loadItems()
    } catch (error) {
      setErrorMessage(error?.message || 'Không thể tiếp nhận chỉ định.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleComplete() {
    if (!selectedOrder) return

    if (!result.trim()) {
      setErrorMessage('Vui lòng nhập kết quả trước khi hoàn tất.')
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
      setErrorMessage(error?.message || 'Không thể lưu kết quả xét nghiệm.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="doctor-page technician-page">
      <header className="page-heading technician-page__heading">
        <div>
          <p className="page-heading__context">Nhân viên xét nghiệm</p>
          <h1>{config.title}</h1>
          <p>{config.description} Tự động cập nhật mỗi 15 giây.</p>
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

      <section className="technician-overview" aria-label="Tổng quan xét nghiệm">
        <article className="technician-stat-card">
          <span>{config.statLabel}</span>
          <strong>{pagination.count || orders.length}</strong>
          <small>{config.statHint}</small>
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
            onChange={(event) => setSearchTerm(event.target.value)}
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
            <h2>{config.panelTitle}</h2>
            <p>{config.panelDescription}</p>
          </div>

          <span>{pagination.count || orders.length} chỉ định</span>
        </div>

        <LabTechnicianQueueTable
          orders={orders}
          isLoading={isLoading}
          emptyTitle={config.emptyTitle}
          emptyDescription={config.emptyDescription}
          timeLabel={config.timeLabel}
          timeField={config.timeField}
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
