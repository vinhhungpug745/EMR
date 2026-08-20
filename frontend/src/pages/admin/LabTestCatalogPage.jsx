import { useCallback, useEffect, useState } from 'react'
import {
  Beaker,
  CheckCircle2,
  CircleSlash,
  FileText,
  FlaskConical,
  Hash,
  Plus,
  RefreshCw,
  Search,
  TestTube2,
  X,
} from 'lucide-react'
import { Navigate } from 'react-router-dom'

import {
  createLabTestCatalog,
  getLabTestCatalogs,
  updateLabTestCatalog,
} from '../../api/labTestCatalogs'
import { useAuth } from '../../auth/useAuth'
import { PaginationFooter } from '../../utils/PaginationFooter'
import { Snackbar } from '../../utils/Snackbar'

const SEARCH_DELAY = 350
const PAGE_SIZE = 8

export default function LabTestCatalogPage() {
  const { user } = useAuth()
  const [labTests, setLabTests] = useState([])
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

  const loadLabTests = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const data = await getLabTestCatalogs({
        search,
        ordering: 'name',
        page,
        pageSize: PAGE_SIZE,
      })
      setLabTests(data.results || [])
      setPagination({
        count: data.count || 0,
        next: data.next,
        previous: data.previous,
      })
    } catch (error) {
      setErrorMessage(error.message || 'Không thể tải danh mục xét nghiệm.')
    } finally {
      setIsLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    setPage(1)
  }, [search])

  useEffect(() => {
    const timer = window.setTimeout(loadLabTests, SEARCH_DELAY)
    return () => window.clearTimeout(timer)
  }, [loadLabTests])

  useEffect(() => {
    if (!snackbar || snackbar.type === 'confirm') return undefined
    const timer = window.setTimeout(() => setSnackbar(null), 3000)
    return () => window.clearTimeout(timer)
  }, [snackbar])

  if (user.role !== 'admin') return <Navigate to="/app" replace />

  function requestStatusChange(test) {
    const nextActive = !test.active
    setPendingStatusChange({ test, nextActive })
    setSnackbar({
      type: 'confirm',
      message: `Chuyển ${test.name} sang ${nextActive ? 'đang hoạt động' : 'ngưng hoạt động'}?`,
    })
  }

  async function confirmStatusChange() {
    if (!pendingStatusChange) return
    const { test, nextActive } = pendingStatusChange

    setUpdatingId(test.id)
    setSnackbar(null)

    try {
      const updatedTest = await updateLabTestCatalog(test.id, { active: nextActive })
      setLabTests((items) => items.map((item) => (
        item.id === test.id ? { ...item, active: updatedTest.active ?? nextActive } : item
      )))
      setSnackbar({ type: 'success', message: `Đã cập nhật trạng thái ${test.name}.` })
    } catch (error) {
      setSnackbar({ type: 'error', message: error.message || 'Không thể cập nhật trạng thái xét nghiệm.' })
    } finally {
      setUpdatingId(null)
      setPendingStatusChange(null)
    }
  }

  async function handleCreateLabTest(formData) {
    setIsSaving(true)
    setFormError(null)

    try {
      const createdTest = await createLabTestCatalog(formData)
      setIsCreateOpen(false)
      await loadLabTests()
      setSnackbar({ type: 'success', message: `Đã thêm ${createdTest.name}.` })
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
          <h1>Danh mục xét nghiệm</h1>
        </div>
        <button className="primary-button" type="button" onClick={() => setIsCreateOpen(true)}>
          <Plus size={18} aria-hidden="true" />
          Thêm xét nghiệm
        </button>
      </header>

      <section className="users-toolbar">
        <label className="users-toolbar__search">
          <Search size={17} aria-hidden="true" />
          <input
            value={search}
            placeholder="Tìm theo mã, tên, nhóm hoặc loại mẫu"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <button className="icon-button users-toolbar__refresh" type="button" disabled={isLoading} onClick={loadLabTests}>
          <RefreshCw className={isLoading ? 'is-spinning' : ''} size={17} />
        </button>
      </section>

      {errorMessage && (
        <div className="users-page__error">
          <span>{errorMessage}</span>
          <button type="button" onClick={loadLabTests}>Thử lại</button>
        </div>
      )}

      <section className="users-table-panel">
        <div className="users-table-scroll">
          <table className="users-table catalog-table lab-catalog-table">
            <thead>
              <tr>
                <th><Heading icon={Hash} label="Mã" /></th>
                <th><Heading icon={FlaskConical} label="Tên xét nghiệm" /></th>
                <th><Heading icon={Beaker} label="Nhóm" /></th>
                <th><Heading icon={TestTube2} label="Mẫu bệnh phẩm" /></th>
                <th><Heading icon={FileText} label="Mô tả" /></th>
                <th><Heading icon={CheckCircle2} label="Trạng thái" /></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan="6">Đang tải...</td>
                </tr>
              )}

              {!isLoading && labTests.map((test) => (
                <tr key={test.id}>
                  <td><CodeText value={test.code} /></td>
                  <td>
                    <span className="catalog-table__title">
                      <FlaskConical size={17} aria-hidden="true" />
                      <strong>{test.name}</strong>
                    </span>
                  </td>
                  <td>{test.category || 'Chưa phân loại'}</td>
                  <td>{test.specimen_type || 'Chưa cập nhật'}</td>
                  <td>
                    <span className="catalog-table__description" title={test.description || 'Chưa cập nhật'}>
                      {test.description || 'Chưa cập nhật'}
                    </span>
                  </td>
                  <td>
                    <StatusButton
                      active={test.active}
                      disabled={updatingId === test.id || pendingStatusChange?.test.id === test.id}
                      onClick={() => requestStatusChange(test)}
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
            <span>Chưa tìm thấy xét nghiệm nào trong database.</span>
          </div>
        )}

        {!isLoading && (
          <PaginationFooter
            count={pagination.count}
            entityLabel="xét nghiệm"
            page={page}
            pageSize={PAGE_SIZE}
            previous={pagination.previous}
            next={pagination.next}
            onPageChange={setPage}
          />
        )}
      </section>

      <Snackbar
        snackbar={snackbar}
        onCancel={() => {
          setPendingStatusChange(null)
          setSnackbar(null)
        }}
        onConfirm={confirmStatusChange}
      />

      {isCreateOpen && (
        <LabTestFormModal
          error={formError}
          isSaving={isSaving}
          onClose={() => {
            if (!isSaving) {
              setFormError(null)
              setIsCreateOpen(false)
            }
          }}
          onSubmit={handleCreateLabTest}
        />
      )}

      <button className="users-page__mobile-create" type="button" title="Thêm xét nghiệm" aria-label="Thêm xét nghiệm" onClick={() => setIsCreateOpen(true)}>
        <Plus size={24} aria-hidden="true" />
      </button>
    </div>
  )
}

function LabTestFormModal({ error, isSaving, onClose, onSubmit }) {
  const [form, setForm] = useState({
    code: '',
    name: '',
    category: '',
    specimen_type: '',
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
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit({
      code: form.code.trim(),
      name: form.name.trim(),
      category: form.category.trim() || null,
      specimen_type: form.specimen_type.trim() || null,
      description: form.description.trim() || null,
      active: form.active,
    })
  }

  return (
    <CatalogModal title="Thêm xét nghiệm mới" description="Nhập thông tin xét nghiệm dùng khi bác sĩ chỉ định." onClose={onClose}>
      <form className="user-form" onSubmit={handleSubmit}>
        {error && <FormError error={error} fallback="Không thể lưu xét nghiệm." />}
        <div className="user-form__grid">
          <FormField label="Mã xét nghiệm" error={getFieldError(error, 'code')}>
            <input name="code" value={form.code} required autoFocus onChange={updateField} />
          </FormField>
          <FormField label="Tên xét nghiệm" error={getFieldError(error, 'name')}>
            <input name="name" value={form.name} required onChange={updateField} />
          </FormField>
          <FormField label="Nhóm xét nghiệm" error={getFieldError(error, 'category')}>
            <input name="category" value={form.category} placeholder="Huyết học" onChange={updateField} />
          </FormField>
          <FormField label="Mẫu bệnh phẩm" error={getFieldError(error, 'specimen_type')}>
            <input name="specimen_type" value={form.specimen_type} placeholder="Máu" onChange={updateField} />
          </FormField>
          <StatusField checked={form.active} name="active" title="Xét nghiệm hoạt động" hint="Cho phép chọn xét nghiệm này khi chỉ định" onChange={updateField} />
          <FormField label="Mô tả" error={getFieldError(error, 'description')} wide>
            <textarea name="description" value={form.description} rows={4} onChange={updateField} />
          </FormField>
        </div>
        <ModalFooter isSaving={isSaving} saveLabel="Tạo xét nghiệm" onClose={onClose} />
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
    <button className={`catalog-status catalog-status--${active ? 'active' : 'inactive'}`} type="button" disabled={disabled} onClick={onClick}>
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

function FormField({ label, error, children, wide = false }) {
  return (
    <label className={`user-form__field ${wide ? 'user-form__field--wide' : ''}`}>
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
