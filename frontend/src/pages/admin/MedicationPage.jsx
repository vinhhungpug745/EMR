import { useCallback, useState } from 'react'
import { Plus, RefreshCw, Search } from 'lucide-react'
import { Navigate } from 'react-router-dom'

import { createMedication, getMedications, updateMedication } from '../../api/medications'
import { useAuth } from '../../auth/useAuth'
import { MedicationFormModal } from '../../components/admin/MedicationFormModal'
import { MedicationTable } from '../../components/admin/MedicationTable'
import { PaginationFooter } from '../../components/common/PaginationFooter'
import { Snackbar } from '../../components/common/Snackbar'
import { usePaginatedResource } from '../../utils/usePaginatedResource'
import { useStatusToggle } from '../../utils/useStatusToggle'

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
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  const fetchMedications = useCallback(({ page, pageSize }) => getMedications({
    search,
    ordering: 'name',
    page,
    pageSize,
  }), [search])

  const {
    items: medications,
    setItems: setMedications,
    page,
    setPage,
    pageSize,
    pagination,
    isLoading,
    errorMessage,
    loadItems: loadMedications,
  } = usePaginatedResource({
    fetchPage: fetchMedications,
    resetKey: search,
    pageSize: PAGE_SIZE,
    errorFallback: 'Không thể tải danh mục thuốc.',
  })

  const {
    snackbar,
    showSnackbar,
    pendingStatusChange,
    updatingId,
    requestStatusChange,
    cancelStatusChange,
    confirmStatusChange,
  } = useStatusToggle({
    updateStatus: (medication, nextActive) => updateMedication(medication.id, { active: nextActive }),
    onSuccess: (medication, updatedMedication, nextActive) => {
      setMedications((items) => items.map((item) => (
        item.id === medication.id
          ? { ...item, active: updatedMedication.active ?? nextActive }
          : item
      )))
    },
    errorFallback: 'Không thể cập nhật trạng thái thuốc.',
  })

  if (user.role !== 'admin') return <Navigate to="/app" replace />

  async function handleCreateMedication(formData) {
    setIsSaving(true)
    setFormError(null)

    try {
      const createdMedication = await createMedication(formData)
      setIsCreateOpen(false)
      await loadMedications()
      showSnackbar({ type: 'success', message: `Đã thêm ${createdMedication.name}.` })
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
        <MedicationTable
          medications={medications}
          isLoading={isLoading}
          pendingStatusChange={pendingStatusChange}
          updatingId={updatingId}
          getRouteLabel={getRouteLabel}
          onStatusChange={requestStatusChange}
        />

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
            pageSize={pageSize}
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
          routeOptions={ROUTE_OPTIONS}
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

function getRouteLabel(route) {
  return ROUTE_OPTIONS.find((option) => option.value === route)?.label || route
}
