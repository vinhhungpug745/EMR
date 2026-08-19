import { CheckCircle2, CircleSlash } from 'lucide-react'

export function Snackbar({ snackbar, onCancel, onConfirm }) {
  if (!snackbar) return null

  const isConfirm = snackbar.type === 'confirm'
  const Icon = snackbar.type === 'success' ? CheckCircle2 : CircleSlash

  return (
    <div className={`app-snackbar app-snackbar--${snackbar.type}`} role="status">
      <span className="app-snackbar__message">
        {!isConfirm && <Icon size={17} aria-hidden="true" />}
        {snackbar.message}
      </span>

      {isConfirm && (
        <span className="app-snackbar__actions">
          <button type="button" onClick={onCancel}>Hủy</button>
          <button type="button" onClick={onConfirm}>Xác nhận</button>
        </span>
      )}
    </div>
  )
}
