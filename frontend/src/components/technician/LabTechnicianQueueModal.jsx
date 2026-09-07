import { Beaker, CheckCircle2, Clock3, FileText, UserRound, X } from 'lucide-react'

import { formatVietnamDateTime } from '../../utils/dateTime'

export function LabTechnicianQueueModal({
  order,
  result,
  errorMessage,
  onResultChange,
  onClose,
  onStart,
  onComplete,
  isSaving,
}) {
  if (!order) {
    return null
  }

  const isOrdered = order.status === 'ordered'
  const isProcessing = order.status === 'processing'
  const isCompleted = order.status === 'completed'

  return (
    <section
      className="lab-order-backdrop technician-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        className="lab-order-modal technician-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lab-technician-order-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="lab-order-modal__header">
          <div>
            <span className="doctor-page__eyebrow">
              <Beaker size={15} />
              Chi tiết chỉ định
            </span>

            <h2 id="lab-technician-order-title">
              {order.test_catalog_detail?.name}
            </h2>
          </div>

          <button
            type="button"
            className="lab-order-modal__close"
            aria-label="Đóng"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>

        <div className="technician-modal__body">
          <section className="technician-order-summary">
            <article>
              <span>
                <UserRound size={15} />
                Bệnh nhân
              </span>
              <strong>{order.encounter_detail?.patient_name || 'Chưa rõ'}</strong>
              <small>{order.encounter_detail?.visit_number || 'Chưa có mã lượt khám'}</small>
            </article>

            <article>
              <span>
                <Beaker size={15} />
                Xét nghiệm
              </span>
              <strong>{order.test_catalog_detail?.category || 'Chưa phân loại'}</strong>
              <small>{order.test_catalog_detail?.code || 'Chưa có mã xét nghiệm'}</small>
            </article>

            <article>
              <span>
                <Clock3 size={15} />
                Thời điểm chỉ định
              </span>
              <strong>{formatVietnamDateTime(order.ordered_at)}</strong>
              <small>{order.status_display || order.status}</small>
            </article>
          </section>

          <section className="technician-result-card">
            <div className="technician-result-card__header">
              <div>
                <span className="doctor-page__eyebrow">
                  <FileText size={15} />
                  {isCompleted ? 'Kết quả đã trả' : isProcessing ? 'Nhập kết quả' : 'Chưa tiếp nhận'}
                </span>

                <h3>{isOrdered ? 'Chờ tiếp nhận chỉ định' : 'Kết quả xét nghiệm'}</h3>
              </div>

              <span className={`technician-status-pill technician-status-pill--${order.status}`}>
                {order.status_display || order.status}
              </span>
            </div>

            {isOrdered && (
              <div className="technician-result-note">
                Tiếp nhận chỉ định trước khi nhập kết quả xét nghiệm.
              </div>
            )}

            {!isOrdered && (
              <label className="technician-result-field">
                <span>Nội dung kết quả</span>

                <textarea
                  rows={8}
                  value={result}
                  readOnly={isCompleted}
                  onChange={(event) =>
                    onResultChange(event.target.value)
                  }
                  placeholder="Nhập kết quả xét nghiệm..."
                />
              </label>
            )}

            {errorMessage && (
              <div className="lab-order-submit-error technician-modal__error">
                {errorMessage}
              </div>
            )}
          </section>
        </div>

        <footer className="lab-order-modal__footer">
          <button type="button" className="exam-save-button" onClick={onClose}>
            Đóng
          </button>

          {order.status === 'ordered' && (
            <button
              type="button"
              className="exam-save-button"
              disabled={isSaving}
              onClick={() => onStart(order)}
            >
              Tiếp nhận
            </button>
          )}

          {isProcessing && (
            <button
              type="button"
              className="exam-complete-button"
              disabled={isSaving}
              onClick={onComplete}
            >
              <CheckCircle2 size={16} />
              Hoàn tất
            </button>
          )}
        </footer>
      </div>
    </section>
  )
}
