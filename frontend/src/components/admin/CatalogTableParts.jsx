import { CheckCircle2, CircleSlash, Hash, X } from 'lucide-react'

export function CatalogHeading({ icon: Icon, label }) {
  return (
    <span className="catalog-table__heading">
      <Icon size={14} aria-hidden="true" />
      {label}
    </span>
  )
}

export function CatalogCode({ value }) {
  return (
    <span className="catalog-table__code">
      <Hash size={15} aria-hidden="true" />
      {value}
    </span>
  )
}

export function CatalogStatusButton({ active, disabled, onClick, activeTitle, inactiveTitle }) {
  const Icon = active ? CheckCircle2 : CircleSlash

  return (
    <button
      className={`catalog-status catalog-status--${active ? 'active' : 'inactive'}`}
      type="button"
      disabled={disabled}
      title={active ? activeTitle : inactiveTitle}
      onClick={onClick}
    >
      <Icon size={15} aria-hidden="true" />
      {disabled ? 'Đang cập nhật' : active ? 'Đang hoạt động' : 'Ngưng hoạt động'}
    </button>
  )
}

export function CatalogModal({ title, description, labelledBy, children, onClose }) {
  return (
    <div className="user-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="user-modal department-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="user-modal__header">
          <div>
            <h2 id={labelledBy}>{title}</h2>
            <p>{description}</p>
          </div>
          <button className="icon-button" type="button" aria-label="Đóng" onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  )
}

export function FormField({ label, error, children, wide = false }) {
  return (
    <label className={`user-form__field ${wide ? 'user-form__field--wide' : ''}`}>
      <span>{label}</span>
      {children}
      {error && <small className="user-form__field-error">{error}</small>}
    </label>
  )
}

export function StatusField({ checked, name, title, hint, onChange }) {
  return (
    <label className="user-form__status professional-modal__status">
      <input name={name} type="checkbox" checked={checked} onChange={onChange} />
      <span>
        <strong>{title}</strong>
        <small>{hint}</small>
      </span>
    </label>
  )
}

export function ModalFooter({ isSaving, saveLabel, onClose }) {
  return (
    <footer className="user-modal__footer">
      <button className="secondary-button" type="button" disabled={isSaving} onClick={onClose}>
        Hủy
      </button>
      <button className="primary-button" type="submit" disabled={isSaving}>
        {isSaving ? 'Đang lưu...' : saveLabel}
      </button>
    </footer>
  )
}

export function FormError({ error, fallback }) {
  return (
    <div className="user-form__error" role="alert">
      {error?.data?.detail || error?.message || fallback}
    </div>
  )
}
