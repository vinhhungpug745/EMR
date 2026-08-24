import { useCallback, useState } from 'react'
import { Plus, RefreshCw, Search } from 'lucide-react'
import { Navigate } from 'react-router-dom'

import { createPatient, getPatient, getPatients, updatePatient } from '../../api/patients'
import { useAuth } from '../../auth/useAuth'
import { PatientFormModal } from '../../components/receptionist/PatientFormModal'
import { PatientTable } from '../../components/receptionist/PatientTable'
import { PaginationFooter } from '../../components/common/PaginationFooter'
import { Snackbar } from '../../components/common/Snackbar'
import { usePaginatedResource } from '../../utils/usePaginatedResource'
import { useSnackbar } from '../../utils/useSnackbar'

const PAGE_SIZE = 8

export default function PatientPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState(null)
  const [loadingPatientId, setLoadingPatientId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const { snackbar, showSnackbar } = useSnackbar()

  const fetchPatients = useCallback(({ page, pageSize }) => getPatients({
    search,
    ordering: 'full_name',
    page,
    pageSize,
  }), [search])

  const {
    items: patients,
    page,
    setPage,
    pageSize,
    pagination,
    isLoading,
    errorMessage,
    loadItems: loadPatients,
  } = usePaginatedResource({
    fetchPage: fetchPatients,
    resetKey: search,
    pageSize: PAGE_SIZE,
    errorFallback: 'Không thể tải danh sách bệnh nhân.',
  })

  if (user.role !== 'receptionist') {
    return <Navigate to="/app" replace />
  }

  function openCreateForm() {
    setFormError(null)
    setIsCreateOpen(true)
  }

  function closeForm() {
    if (isSaving) return
    setFormError(null)
    setIsCreateOpen(false)
    setEditingPatient(null)
  }

  async function openEditForm(patient) {
    setFormError(null)
    setLoadingPatientId(patient.id)

    try {
      const detail = await getPatient(patient.id)
      setEditingPatient(detail)
    } catch (error) {
      showSnackbar({
        type: 'error',
        message: error.message || 'Không thể tải chi tiết bệnh nhân.',
      })
    } finally {
      setLoadingPatientId(null)
    }
  }

  async function handleCreatePatient(formData) {
    setIsSaving(true)
    setFormError(null)

    try {
      const createdPatient = await createPatient(formData)
      setIsCreateOpen(false)
      await loadPatients()
      showSnackbar({ type: 'success', message: `Đã thêm ${createdPatient.full_name}.` })
    } catch (error) {
      setFormError(error)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUpdatePatient(formData) {
    setIsSaving(true)
    setFormError(null)

    try {
      const updatedPatient = await updatePatient(editingPatient.id, formData)
      setEditingPatient(null)
      await loadPatients()
      showSnackbar({ type: 'success', message: `Đã cập nhật ${updatedPatient.full_name}.` })
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
          <h1>Quản lý bệnh nhân</h1>
          <p>Tra cứu, tạo mới và cập nhật thông tin hành chính của bệnh nhân.</p>
        </div>
        <button className="primary-button" type="button" onClick={openCreateForm}>
          <Plus size={18} aria-hidden="true" />
          Thêm bệnh nhân
        </button>
      </header>

      <section className="users-toolbar patients-toolbar">
        <label className="users-toolbar__search">
          <Search size={17} aria-hidden="true" />
          <input
            value={search}
            placeholder="Tìm theo tên hoặc số điện thoại"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <button
          className="icon-button users-toolbar__refresh"
          type="button"
          disabled={isLoading}
          onClick={loadPatients}
        >
          <RefreshCw className={isLoading ? 'is-spinning' : ''} size={17} />
        </button>
      </section>

      {errorMessage && (
        <div className="users-page__error">
          <span>{errorMessage}</span>
          <button type="button" onClick={loadPatients}>Thử lại</button>
        </div>
      )}

      <section className="users-table-panel">
        <PatientTable
          patients={patients}
          isLoading={isLoading}
          loadingPatientId={loadingPatientId}
          onEdit={openEditForm}
        />

        {!isLoading && pagination.count === 0 && (
          <div className="users-table__empty">
            <strong>Không có dữ liệu</strong>
            <span>Chưa tìm thấy bệnh nhân nào trong database.</span>
          </div>
        )}

        {!isLoading && (
          <PaginationFooter
            count={pagination.count}
            entityLabel="bệnh nhân"
            page={page}
            pageSize={pageSize}
            previous={pagination.previous}
            next={pagination.next}
            onPageChange={setPage}
          />
        )}
      </section>

      <Snackbar snackbar={snackbar} />

      {isCreateOpen && (
        <PatientFormModal
          error={formError}
          isSaving={isSaving}
          onClose={closeForm}
          onSubmit={handleCreatePatient}
        />
      )}

      {editingPatient && (
        <PatientFormModal
          error={formError}
          initialPatient={editingPatient}
          isSaving={isSaving}
          mode="edit"
          onClose={closeForm}
          onSubmit={handleUpdatePatient}
        />
      )}

      <button
        className="users-page__mobile-create"
        type="button"
        title="Thêm bệnh nhân"
        aria-label="Thêm bệnh nhân"
        onClick={openCreateForm}
      >
        <Plus size={24} aria-hidden="true" />
      </button>
    </div>
  )
}
