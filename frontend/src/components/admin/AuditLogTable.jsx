import { ArrowRight, Eye, FilePlus2, LogIn, LogOut, Pencil, Trash2, UserRound, ShieldAlert } from 'lucide-react'
import { AUDIT_ACTIONS, AUDIT_RESOURCES, auditActorName } from '../../config/auditLogOptions'
import { formatVietnamDate } from '../../utils/dateTime'

const ACTION_ICONS = { create: FilePlus2, view: Eye, update: Pencil, delete: Trash2, login: LogIn, logout: LogOut, login_failed: ShieldAlert }
const timeFormat = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Ho_Chi_Minh',
})

export function AuditActionBadge({ log }) {
  const Icon = ACTION_ICONS[log.action] || Eye
  return (
    <span className={`audit-action audit-action--${log.action}`}>
      <Icon size={13} aria-hidden="true" />
      {AUDIT_ACTIONS[log.action] || log.action_display || log.action}
    </span>
  )
}

export function AuditLogTable({ logs, onSelect }) {
  return (
    <div className="audit-table-scroll">
      <table className="audit-table">
        <thead>
          <tr>
            <th scope="col">Thời gian</th>
            <th scope="col">Người thực hiện</th>
            <th scope="col">Hoạt động</th>
            <th scope="col">Đối tượng</th>
            <th scope="col">Chi tiết</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td data-label="Thời gian" className="audit-table__time">
                <time dateTime={log.created_at}>
                  <strong>{log.created_at ? timeFormat.format(new Date(log.created_at)) : '—'}</strong>
                  <small>{formatVietnamDate(log.created_at, 'Chưa ghi nhận')}</small>
                </time>
              </td>
              <td data-label="Người thực hiện">
                <div className="audit-person">
                  <span className="audit-person__avatar" aria-hidden="true">
                    {log.actor_detail ? auditActorName(log).trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase() : <UserRound size={17} />}
                  </span>
                  <div><strong>{auditActorName(log)}</strong>
                    <small>{log.actor_detail?.username ? `@${log.actor_detail.username}` : 'Chưa xác định tài khoản'}</small>
                  </div>
                </div>
              </td>
              <td data-label="Hoạt động">
                <AuditActionBadge log={log} />
                {log.description && <small className="audit-table__description" title={log.description}>{log.description}</small>}
              </td>
              <td data-label="Đối tượng">
                <strong>{AUDIT_RESOURCES[log.resource_type] || log.resource_type_display || log.resource_type}</strong>
                <small>{log.resource_id ? `#${log.resource_id}` : '—'}</small>
              </td>
              <td className="audit-table__open">
                <button className="audit-detail-link" type="button" aria-label={`Xem nhật ký #${log.id}`} onClick={() => onSelect(log)}>
                  Xem <ArrowRight size={15} aria-hidden="true" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
