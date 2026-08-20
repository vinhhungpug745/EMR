import { useCallback, useEffect, useState } from 'react'
import {
  CheckCircle2,
  CircleSlash,
  FileText,
  Hash,
  Package,
  Pill,
  Plus,
  RefreshCw,
  Route,
  Search,
  X,
} from 'lucide-react'
import { Navigate } from 'react-router-dom'

import { createMedication, getMedications, updateMedication } from '../../api/medications'
import { useAuth } from '../../auth/useAuth'
import { PaginationFooter } from '../../utils/PaginationFooter'
import { Snackbar } from '../../utils/Snackbar'

const SEARCH_DELAY = 350
const PAGE_SIZE = 8
const ROUTE_OPTIONS = [
  { value: 'oral', label: 'Đường uống' },
  { value: 'topical', label: 'Dùng ngoài' },
  { value: 'inhalation', label: 'Đường hít' },
  { value: 'injection', label: 'Đường tiêm' },
  { value: 'other', label: 'Khác' },
]

export default function MedicationPage() {
  const { user } = useAuth()
  const [medications, setMedications] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [pendingStatusChange, setPendingStatusChange] = useState(null)
  const [snackbar, setSnackbar] = useState(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  const loadMedications = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const data = await getMedications({
        search,
        ordering: 'name',
        page,
        pageSize: PAGE_SIZE,
      })
      setMedications(data.results || [])
      setPagination({
        count: data.count || 0,
        next: data.next,
        previous: data.previous,
      })
    } catch (error) {
      setErrorMessage(error.message || 'Không thể tải danh mục thuốc.')
    } finally {
      setIsLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    setPage(1)
  }, [search])

  useEffect(() => {
    const timer = window.setTimeout(loadMedications, SEARCH_DELAY)
    return () => window.clearTimeout(timer)
  }, [loadMedications])

  useEffect(() => {
    if (!snackbar || snackbar.type === 'confirm') return undefined
    const timer = window.setTimeout(() => setSnackbar(null), 3000)
    return () => window.clearTimeout(timer)
  }, [snackbar])

  if (user.role !== 'admin') return <Navigate to="/app" replace />

  function requestStatusChange(medication) {
    const nextActive = !medication.active
    setPendingStatusChange({ medication, nextActive })
    setSnackbar({
      type: 'confirm',
      message: `Chuyển ${medication.name} sang ${nextActive ? 'đang hoạt động' : 'ngưng hoạt động'}?`,
    })
  }

  async function confirmStatusChange() {
    if (!pendingStatusChange) return
    const { medication, nextActive } = pendingStatusChange

    setUpdatingId(medication.id)
    setSnackbar(null)

    try {
      const updatedMedication = await updateMedication(medication.id, { active: nextActive })
      setMedications((items) => items.map((item) => (
        item.id === medication.id
          ? { ...item, active: updatedMedication.active ?? nextActive }
          : item
      )))
      setSnackbar({ type: 'success', message: `Đã cập nhật trạng thái ${medication.name}.` })
    } catch (error) {
      setSnackbar({ type: 'error', message: error.message || 'Không thể cập nhật trạng thái thuốc.' })
    } finally {
      setUpdatingId(null)
      setPendingStatusChange(null)
    }
  }

  function cancelStatusChange() {
    setPendingStatusChange(null)
    setSnackbar(null)
  }

  async function handleCreateMedication(formData) {
    setIsSaving(true)
    setFormError(null)

    try {
      const createdMedication = await createMedication(formData)
      setIsCreateOpen(false)
      await loadMedications()
      setSnackbar({ type: 'success', message: `Đã thêm ${createdMedication.name}.` })
    } catch (error) {
      setFormError(error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="users-page">
      <header className="users-page__header">
        <div>
          <h1>Danh mục thuốc</h1>
        </div>
        <button className="primary-button" type="button" onClick={() => setIsCreateOpen(true)}>
          <Plus size={18} aria-hidden="true" />
          Thêm thuốc
        </button>
      </header>

      <section className="users-toolbar">
        <label className="users-toolbar__search">
          <Search size={17} aria-hidden="true" />
          <input
            value={search}
            placeholder="Tìm theo mã, tên thuốc hoặc hoạt chất"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <button
          className="icon-button users-toolbar__refresh"
          type="button"
          disabled={isLoading}
          onClick={loadMedications}
        >
          <RefreshCw className={isLoading ? 'is-spinning' : ''} size={17} />
        </button>
      </section>

      {errorMessage && (
        <div className="users-page__error">
          <span>{errorMessage}</span>
          <button type="button" onClick={loadMedications}>Thử lại</button>
        </div>
      )}

      <section className="users-table-panel">
        <div className="users-table-scroll">
          <table className="users-table catalog-table medication-table">
            <thead>
              <tr>
                <th><Heading icon={Hash} label="Mã" /></th>
                <th><Heading icon={Pill} label="Tên thuốc" /></th>
                <th><Heading icon={FileText} label="Hoạt chất" /></th>
                <th><Heading icon={Package} label="Hàm lượng" /></th>
                <th><Heading icon={Route} label="Đường dùng" /></th>
                <th><Heading icon={CheckCircle2} label="Trạng thái" /></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan="6">Đang tải...</td>
                </tr>
              )}

              {!isLoading && medications.map((medication) => (
                <tr key={medication.id}>
                  <td><CodeText value={medication.code} /></td>
                  <td>
                    <span className="catalog-table__title">
                      <Pill size={17} aria-hidden="true" />
                      <strong>{medication.name}</strong>
                    </span>
                  </td>
                  <td>
                    <span className="catalog-table__description" title={medication.active_ingredient}>
                      {medication.active_ingredient}
                    </span>
                  </td>
                  <td>{medication.strength} / {medication.unit}</td>
                  <td>{getRouteLabel(medication.route)}</td>
                  <td>
                    <StatusButton
                      active={medication.active}
                      disabled={updatingId === medication.id || pendingStatusChange?.medication.id === medication.id}
                      onClick={() => requestStatusChange(medication)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isLoading && pagination.count === 0 && (
          <div className="users-table__empty">
            <strong>Không có dữ liệu</strong>
            <span>Chưa tìm thấy thuốc nào trong database.</span>
          </div>
        )}

        {!isLoading && (
          <PaginationFooter
            count={pagination.count}
            entityLabel="thuốc"
            page={page}
            pageSize={PAGE_SIZE}
            previous={pagination.previous}
            next={pagination.next}
            onPageChange={setPage}
          />
        )}
      </section>

      <Snackbar snackbar={snackbar} onCancel={cancelStatusChange} onConfirm={confirmStatusChange} />

      {isCreateOpen && (
        <MedicationFormModal
          error={formError}
          isSaving={isSaving}
          onClose={() => {
            if (!isSaving) {
              setFormError(null)
              setIsCreateOpen(false)
            }
          }}
          onSubmit={handleCreateMedication}
        />
      )}

      <button
        className="users-page__mobile-create"
        type="button"
        title="Thêm thuốc"
        aria-label="Thêm thuốc"
        onClick={() => setIsCreateOpen(true)}
      >
        <Plus size={24} aria-hidden="true" />
      </button>
    </div>
  )
}

function MedicationFormModal({ error, isSaving, onClose, onSubmit }) {
  const [form, setForm] = useState({
    code: '',
    name: '',
    active_ingredient: '',
    strength: '',
    dosage_form: '',
    unit: '',
    route: 'oral',
    active: true,
  })

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSaving) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSaving, onClose])

  function updateField(event) {
    const { name, value, checked, type } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit({
      code: form.code.trim(),
      name: form.name.trim(),
      active_ingredient: form.active_ingredient.trim(),
      strength: form.strength.trim(),
      dosage_form: form.dosage_form.trim(),
      unit: form.unit.trim(),
      route: form.route,
      active: form.active,
    })
  }

  return (
    <CatalogModal title="Thêm thuốc mới" description="Nhập thông tin thuốc dùng khi kê đơn." isSaving={isSaving} onClose={onClose}>
      <form className="user-form" onSubmit={handleSubmit}>
        {error && <FormError error={error} fallback="Không thể lưu thuốc." />}
        <div className="user-form__grid">
          <FormField label="Mã thuốc" error={getFieldError(error, 'code')}>
            <input name="code" value={form.code} required autoFocus onChange={updateField} />
          </FormField>
          <FormField label="Tên thuốc" error={getFieldError(error, 'name')}>
            <input name="name" value={form.name} required onChange={updateField} />
          </FormField>
          <FormField label="Hoạt chất" error={getFieldError(error, 'active_ingredient')}>
            <input name="active_ingredient" value={form.active_ingredient} required onChange={updateField} />
          </FormField>
          <FormField label="Hàm lượng" error={getFieldError(error, 'strength')}>
            <input name="strength" value={form.strength} required placeholder="500mg" onChange={updateField} />
          </FormField>
          <FormField label="Dạng bào chế" error={getFieldError(error, 'dosage_form')}>
            <input name="dosage_form" value={form.dosage_form} required placeholder="Viên nén" onChange={updateField} />
          </FormField>
          <FormField label="Đơn vị" error={getFieldError(error, 'unit')}>
            <input name="unit" value={form.unit} required placeholder="viên" onChange={updateField} />
          </FormField>
          <FormField label="Đường dùng" error={getFieldError(error, 'route')}>
            <select name="route" value={form.route} onChange={updateField}>
              {ROUTE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </FormField>
          <StatusField checked={form.active} name="active" title="Thuốc hoạt động" hint="Cho phép chọn thuốc này khi kê đơn" onChange={updateField} />
        </div>
        <ModalFooter isSaving={isSaving} saveLabel="Tạo thuốc" onClose={onClose} />
      </form>
    </CatalogModal>
  )
}

function Heading({ icon: Icon, label }) {
  return <span className="catalog-table__heading"><Icon size={14} aria-hidden="true" />{label}</span>
}

function CodeText({ value }) {
  return <span className="catalog-table__code"><Hash size={15} aria-hidden="true" />{value}</span>
}

function StatusButton({ active, disabled, onClick }) {
  const Icon = active ? CheckCircle2 : CircleSlash
  return (
    <button
      className={`catalog-status catalog-status--${active ? 'active' : 'inactive'}`}
      type="button"
      disabled={disabled}
      title={active ? 'Bấm để ngưng hoạt động' : 'Bấm để kích hoạt'}
      onClick={onClick}
    >
      <Icon size={15} aria-hidden="true" />
      {disabled ? 'Đang cập nhật' : active ? 'Đang hoạt động' : 'Ngưng hoạt động'}
    </button>
  )
}

function CatalogModal({ title, description, children, onClose }) {
  return (
    <div className="user-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="user-modal department-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <header className="user-modal__header">
          <div>
            <h2>{title}</h2>
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

function FormField({ label, error, children }) {
  return (
    <label className="user-form__field">
      <span>{label}</span>
      {children}
      {error && <small className="user-form__field-error">{error}</small>}
    </label>
  )
}

function StatusField({ checked, name, title, hint, onChange }) {
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

function ModalFooter({ isSaving, saveLabel, onClose }) {
  return (
    <footer className="user-modal__footer">
      <button className="secondary-button" type="button" disabled={isSaving} onClick={onClose}>Hủy</button>
      <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Đang lưu...' : saveLabel}</button>
    </footer>
  )
}

function FormError({ error, fallback }) {
  return <div className="user-form__error" role="alert">{error?.data?.detail || error?.message || fallback}</div>
}

function getFieldError(error, ...path) {
  let value = error?.data
  for (const key of path) value = value?.[key]
  return Array.isArray(value) ? value[0] : value || ''
}

function getRouteLabel(route) {
  return ROUTE_OPTIONS.find((option) => option.value === route)?.label || route
}
