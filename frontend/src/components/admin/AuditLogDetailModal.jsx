import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { AUDIT_RESOURCES, auditActorName } from '../../config/auditLogOptions'
import { formatVietnamDateTime } from '../../utils/dateTime'
import { AuditActionBadge } from './AuditLogTable'

export function AuditLogDetailModal({ log, onClose }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    const previousFocus = document.activeElement
    dialog.showModal()
    return () => {
      dialog.close()
      previousFocus?.focus()
    }
  }, [])

  const fields = Array.isArray(log.changes?.submitted_fields)
    ? log.changes.submitted_fields.filter((field) => typeof field === 'string')
    : []

  return createPortal(
    <dialog className="user-modal audit-detail" ref={dialogRef} aria-labelledby="audit-detail-title"
      onCancel={(event) => { event.preventDefault(); onClose() }}>
      <header className="user-modal__header">
        <div>
          <h2 id="audit-detail-title">Chi tiết nhật ký #{log.id}</h2>
          <p>{formatVietnamDateTime(log.created_at)} · Giờ Việt Nam</p>
        </div>
        <button className="icon-button" type="button" aria-label="Đóng chi tiết" onClick={onClose}>
          <X size={20} aria-hidden="true" />
        </button>
      </header>
      <div className="audit-detail__summary">
        <AuditActionBadge log={log} />
        <p>{log.description || log.resource_repr || 'Không có mô tả'}</p>
      </div>
      <dl className="audit-detail__fields">
        <div><dt>Người thực hiện</dt><dd>{auditActorName(log)}{log.actor_detail?.username && ` (@${log.actor_detail.username})`}</dd></div>
        <div><dt>Thời gian</dt><dd>{formatVietnamDateTime(log.created_at)}</dd></div>
        <div><dt>Loại đối tượng</dt><dd>{AUDIT_RESOURCES[log.resource_type] || log.resource_type_display || log.resource_type}</dd></div>
        <div><dt>Mã đối tượng</dt><dd>{log.resource_id || '—'}</dd></div>
        <div><dt>Địa chỉ IP</dt><dd>{log.ip_address || 'Không ghi nhận'}</dd></div>
      </dl>
      <details className="audit-detail__technical">
        <summary>Thông tin kỹ thuật</summary>
        <dl className="audit-detail__fields">
        <div><dt>Phương thức</dt><dd>{log.request_method || '—'}</dd></div>
        <div className="audit-detail__wide"><dt>Đường dẫn thao tác</dt><dd><code>{log.request_path || '—'}</code></dd></div>
        <div className="audit-detail__wide">
          <dt>Các trường gửi trong thao tác</dt>
          <dd>{fields.length ? fields.join(', ') : 'Không ghi nhận danh sách trường.'}</dd>
        </div>
        </dl>
      </details>
      <footer className="user-modal__footer">
        <button className="secondary-button" type="button" onClick={onClose}>Đóng</button>
      </footer>
    </dialog>, document.body,
  )
}
