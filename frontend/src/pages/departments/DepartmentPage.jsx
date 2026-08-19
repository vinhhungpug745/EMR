import { useCallback, useEffect, useState } from 'react'
import {
  Building2,
  CheckCircle2,
  CircleSlash,
  FileText,
  Hash,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'
import { Navigate } from 'react-router-dom'

import { createDepartment, getDepartments, updateDepartment } from '../../api/departments'
import { useAuth } from '../../auth/useAuth'
import { Snackbar } from '../../utils/Snackbar'

const SEARCH_DELAY = 350

export default function DepartmentListPage() {
  const { user } = useAuth()
  const [departments, setDepartments] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [updatingDepartmentId, setUpdatingDepartmentId] = useState(null)
  const [pendingStatusChange, setPendingStatusChange] = useState(null)
  const [snackbar, setSnackbar] = useState(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSavingDepartment, setIsSavingDepartment] = useState(false)
  const [formError, setFormError] = useState(null)

  const loadDepartments = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const data = await getDepartments({ search, ordering: 'name' })
      setDepartments(Array.isArray(data) ? data : data.results || [])
    } catch (error) {
      setErrorMessage(error.message || 'Không thể tải danh sách khoa.')
    } finally {
      setIsLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timer = window.setTimeout(loadDepartments, SEARCH_DELAY)
    return () => window.clearTimeout(timer)
  }, [loadDepartments])

  useEffect(() => {
    if (!snackbar || snackbar.type === 'confirm') return undefined

    const timer = window.setTimeout(() => {
      setSnackbar(null)
    }, 3000)

    return () => window.clearTimeout(timer)
  }, [snackbar])

  if (user.role !== 'admin') {
    return <Navigate to="/app" replace />
  }

  async function handleStatusChange(department) {
    const nextActive = !department.active

    setPendingStatusChange({ department, nextActive })
    setSnackbar({
      type: 'confirm',
      message: `Chuyển ${department.name} sang ${nextActive ? 'đang hoạt động' : 'ngưng hoạt động'}?`,
    })
  }

  async function confirmStatusChange() {
    if (!pendingStatusChange) return

    const { department, nextActive } = pendingStatusChange

    setUpdatingDepartmentId(department.id)
    setErrorMessage('')
    setSnackbar(null)

    try {
      const updatedDepartment = await updateDepartment(department.id, {
        active: nextActive,
      })

      setDepartments((currentDepartments) => currentDepartments.map((item) => (
        item.id === department.id
          ? { ...item, active: updatedDepartment.active ?? nextActive }
          : item
      )))
      setSnackbar({
        type: 'success',
        message: `Đã cập nhật trạng thái ${department.name}.`,
      })
    } catch (error) {
      setSnackbar({
        type: 'error',
        message: error.message || 'Không thể cập nhật trạng thái khoa.',
      })
    } finally {
      setUpdatingDepartmentId(null)
      setPendingStatusChange(null)
    }
  }

  function cancelStatusChange() {
    setPendingStatusChange(null)
    setSnackbar(null)
  }

  function openCreateForm() {
    setFormError(null)
    setIsCreateOpen(true)
  }

  function closeCreateForm() {
    if (isSavingDepartment) return
    setFormError(null)
    setIsCreateOpen(false)
  }

  async function handleCreateDepartment(formData) {
    setIsSavingDepartment(true)
    setFormError(null)

    try {
      const createdDepartment = await createDepartment(formData)
      setDepartments((currentDepartments) => (
        [...currentDepartments, createdDepartment].sort((first, second) => (
          first.name.localeCompare(second.name, 'vi')
        ))
      ))
      setIsCreateOpen(false)
      setSnackbar({
        type: 'success',
        message: `Đã thêm ${createdDepartment.name}.`,
      })
    } catch (error) {
      setFormError(error)
    } finally {
      setIsSavingDepartment(false)
    }
  }

  return (
    <div className="users-page">
      <header className="users-page__header">
        <div>
          <h1>Danh sách khoa</h1>
        </div>
        <button className="primary-button" type="button" onClick={openCreateForm}>
          <Plus size={18} aria-hidden="true" />
          Thêm khoa
        </button>
      </header>

      <section className="users-toolbar">
        <label className="users-toolbar__search">
          <Search size={17} />
          <input
            value={search}
            placeholder="Tìm theo tên khoa"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <button
          className="icon-button users-toolbar__refresh"
          type="button"
          disabled={isLoading}
          onClick={loadDepartments}
        >
          <RefreshCw className={isLoading ? 'is-spinning' : ''} size={17} />
        </button>
      </section>

      {errorMessage && (
        <div className="users-page__error">
          <span>{errorMessage}</span>
          <button type="button" onClick={loadDepartments}>Thử lại</button>
        </div>
      )}

      <section className="users-table-panel">
        <div className="users-table-scroll">
          <table className="users-table catalog-table department-table">
            <thead>
              <tr>
                <th>
                  <span className="catalog-table__heading">
                    <Hash size={14} aria-hidden="true" />
                    Mã
                  </span>
                </th>
                <th>
                  <span className="catalog-table__heading">
                    <Building2 size={14} aria-hidden="true" />
                    Tên khoa
                  </span>
                </th>
                <th>
                  <span className="catalog-table__heading">
                    <FileText size={14} aria-hidden="true" />
                    Mô tả
                  </span>
                </th>
                <th>
                  <span className="catalog-table__heading">
                    <CheckCircle2 size={14} aria-hidden="true" />
                    Trạng thái
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan="4">Đang tải...</td>
                </tr>
              )}

              {!isLoading && departments.map((department) => (
                <tr key={department.id}>
                  <td>
                    <span className="catalog-table__code">
                      <Hash size={15} aria-hidden="true" />
                      {department.id}
                    </span>
                  </td>
                  <td>
                    <span className="catalog-table__title">
                      <Building2 size={17} aria-hidden="true" />
                      <strong>{department.name}</strong>
                    </span>
                  </td>
                  <td>
                    <span
                      className="catalog-table__description"
                      title={department.description || 'Chưa cập nhật'}
                    >
                      {department.description || 'Chưa cập nhật'}
                    </span>
                  </td>
                  <td>
                    <StatusButton
                      active={department.active}
                      disabled={
                        updatingDepartmentId === department.id
                        || pendingStatusChange?.department.id === department.id
                      }
                      onClick={() => handleStatusChange(department)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isLoading && departments.length === 0 && (
          <div className="users-table__empty">
            <strong>Không có dữ liệu</strong>
            <span>Chưa tìm thấy khoa nào trong database.</span>
          </div>
        )}
      </section>

      {snackbar && (
        <Snackbar
          snackbar={snackbar}
          onCancel={cancelStatusChange}
          onConfirm={confirmStatusChange}
        />
      )}

      {isCreateOpen && (
        <DepartmentFormModal
          error={formError}
          isSaving={isSavingDepartment}
          onClose={closeCreateForm}
          onSubmit={handleCreateDepartment}
        />
      )}

      <button
        className="users-page__mobile-create"
        type="button"
        title="Thêm khoa"
        aria-label="Thêm khoa"
        onClick={openCreateForm}
      >
        <Plus size={24} aria-hidden="true" />
      </button>
    </div>
  )
}

function StatusButton({ active, disabled, onClick }) {
  const Icon = active ? CheckCircle2 : CircleSlash

  return (
    <button
      className={`catalog-status catalog-status--${active ? 'active' : 'inactive'}`}
      type="button"
      disabled={disabled}
      title={active ? 'Bấm để ngưng hoạt động khoa' : 'Bấm để kích hoạt khoa'}
      onClick={onClick}
    >
      <Icon size={15} aria-hidden="true" />
      {disabled ? 'Đang cập nhật' : active ? 'Đang hoạt động' : 'Ngưng hoạt động'}
    </button>
  )
}

function DepartmentFormModal({ error, isSaving, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
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
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    onSubmit({
      name: form.name.trim(),
      description: form.description.trim() || null,
      active: form.active,
    })
  }

  return (
    <div className="user-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="user-modal department-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="department-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="user-modal__header">
          <div>
            <h2 id="department-modal-title">Thêm khoa mới</h2>
            <p>Nhập thông tin khoa dùng trong hồ sơ nhân viên và lượt khám.</p>
          </div>
          <button className="icon-button" type="button" aria-label="Đóng" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <form className="user-form" onSubmit={handleSubmit}>
          {error && (
            <div className="user-form__error" role="alert">
              {getGeneralError(error)}
            </div>
          )}

          <div className="user-form__grid">
            <FormField label="Tên khoa" error={getFieldError(error, 'name')}>
              <input
                name="name"
                value={form.name}
                required
                autoFocus
                onChange={updateField}
              />
            </FormField>

            <label className="user-form__status professional-modal__status">
              <input
                name="active"
                type="checkbox"
                checked={form.active}
                onChange={updateField}
              />
              <span>
                <strong>Khoa hoạt động</strong>
                <small>Cho phép chọn khoa này trong các nghiệp vụ</small>
              </span>
            </label>

            <FormField
              label="Mô tả"
              error={getFieldError(error, 'description')}
              wide
            >
              <textarea
                name="description"
                value={form.description}
                rows={4}
                placeholder="Ví dụ: Tiếp nhận và điều trị các ca cấp cứu trong bệnh viện"
                onChange={updateField}
              />
            </FormField>
          </div>

          <footer className="user-modal__footer">
            <button className="secondary-button" type="button" disabled={isSaving} onClick={onClose}>
              Hủy
            </button>
            <button className="primary-button" type="submit" disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : 'Tạo khoa'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

function FormField({ label, error, children, wide = false }) {
  return (
    <label className={`user-form__field ${wide ? 'user-form__field--wide' : ''}`}>
      <span>{label}</span>
      {children}
      {error && <small className="user-form__field-error">{error}</small>}
    </label>
  )
}

function getFieldError(error, ...path) {
  let value = error?.data
  for (const key of path) value = value?.[key]
  return Array.isArray(value) ? value[0] : value || ''
}

function getGeneralError(error) {
  return error?.data?.detail || error?.message || 'Không thể lưu khoa.'
}
