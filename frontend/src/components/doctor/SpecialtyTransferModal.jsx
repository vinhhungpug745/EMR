import { useCallback, useMemo, useState } from 'react'
import { Building2, RefreshCw, Send, X } from 'lucide-react'

import { getDepartments } from '../../api/departments'
import { usePaginatedResource } from '../../utils/usePaginatedResource'

const PAGE_SIZE = 100

export default function SpecialtyTransferModal({
  currentDepartmentId,
  currentDepartmentName,
  errorMessage,
  isSubmitting,
  onClose,
  onSubmit,
  patientName,
  visitNumber,
}) {
  const [department, setDepartment] = useState('')
  const [reason, setReason] = useState('')

  const fetchDepartments = useCallback(
    ({ page, pageSize }) =>
      getDepartments({
        ordering: 'name',
        page,
        pageSize,
      }),
    [],
  )

  const {
    items: departments,
    isLoading,
    errorMessage: loadError,
    loadItems,
  } = usePaginatedResource({
    fetchPage: fetchDepartments,
    pageSize: PAGE_SIZE,
    delay: 0,
    errorFallback: 'Không thể tải danh sách khoa.',
  })

  const availableDepartments = useMemo(() => (
    departments.filter((item) => item.active && item.id !== currentDepartmentId)
  ), [currentDepartmentId, departments])

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit({
      department,
      reason,
    })
  }

  return (
    <div className="lab-order-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="lab-order-modal specialty-transfer-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="specialty-transfer-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="lab-order-modal__header">
          <div>
            <span className="doctor-page__eyebrow">
              <Building2 size={15} />
              Chuyển khám chuyên khoa
            </span>
            <h2 id="specialty-transfer-title">Chuyển chuyên khoa</h2>
          </div>

          <div className="lab-order-patient-strip">
            <strong>{patientName}</strong>
            <span>{visitNumber}</span>
            <span>{currentDepartmentName}</span>
          </div>

          <button type="button" className="lab-order-modal__close" aria-label="Đóng" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <form className="specialty-transfer-form" onSubmit={handleSubmit}>
          <section className="specialty-transfer-card">
            <label className="specialty-transfer-field">
              <span>Khoa tiếp nhận</span>
              <select
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                disabled={isLoading || isSubmitting}
              >
                <option value="">Chọn khoa chuyên khoa</option>
                {availableDepartments.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            {loadError && (
              <div className="lab-order-state lab-order-state--error">
                <span>{loadError}</span>
                <button type="button" onClick={loadItems}>
                  <RefreshCw size={15} />
                  Tải lại
                </button>
              </div>
            )}

            <label className="specialty-transfer-field">
              <span>Lý do chuyển khoa</span>
              <textarea
                rows={7}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={isSubmitting}
                placeholder="Nhập nhận định và lý do cần đánh giá chuyên khoa..."
              />
            </label>
          </section>

          <footer className="lab-order-modal__footer">
            {errorMessage && (
              <div className="lab-order-submit-error">
                {errorMessage}
              </div>
            )}

            <button type="button" className="exam-save-button" disabled={isSubmitting} onClick={onClose}>
              Hủy
            </button>
            <button
              type="submit"
              className="exam-complete-button"
              disabled={isSubmitting || !department || !reason.trim()}
            >
              <Send size={16} />
              {isSubmitting ? 'Đang chuyển...' : 'Xác nhận chuyển khoa'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
