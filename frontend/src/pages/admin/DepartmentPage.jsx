import { useCallback, useState } from 'react'
import { Plus, RefreshCw, Search } from 'lucide-react'
import { Navigate } from 'react-router-dom'

import { createDepartment, getDepartments, updateDepartment } from '../../api/departments'
import { useAuth } from '../../auth/useAuth'
import { DepartmentFormModal } from '../../components/admin/DepartmentFormModal'
import { DepartmentTable } from '../../components/admin/DepartmentTable'
import { PaginationFooter } from '../../components/common/PaginationFooter'
import { Snackbar } from '../../components/common/Snackbar'
import { usePaginatedResource } from '../../utils/usePaginatedResource'
import { useStatusToggle } from '../../utils/useStatusToggle'

const PAGE_SIZE = 8

export default function DepartmentListPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSavingDepartment, setIsSavingDepartment] = useState(false)
  const [formError, setFormError] = useState(null)

  const fetchDepartments = useCallback(({ page, pageSize }) => getDepartments({
    search,
    ordering: 'name',
    page,
    pageSize,
  }), [search])

  const {
    items: departments,
    setItems: setDepartments,
    page,
    setPage,
    pageSize,
    pagination,
    isLoading,
    errorMessage,
    loadItems: loadDepartments,
  } = usePaginatedResource({
    fetchPage: fetchDepartments,
    resetKey: search,
    pageSize: PAGE_SIZE,
    errorFallback: 'Không thể tải danh sách khoa.',
  })

  const {
    snackbar,
    showSnackbar,
    pendingStatusChange,
    updatingId: updatingDepartmentId,
    requestStatusChange,
    cancelStatusChange,
    confirmStatusChange,
  } = useStatusToggle({
    updateStatus: (department, nextActive) => updateDepartment(department.id, { active: nextActive }),
    onSuccess: (department, updatedDepartment, nextActive) => {
      setDepartments((currentDepartments) => currentDepartments.map((item) => (
        item.id === department.id
          ? { ...item, active: updatedDepartment.active ?? nextActive }
          : item
      )))
    },
    errorFallback: 'Không thể cập nhật trạng thái khoa.',
  })

  if (user.role !== 'admin') {
    return <Navigate to="/app" replace />
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
      setIsCreateOpen(false)
      await loadDepartments()
      showSnackbar({
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
        <DepartmentTable
          departments={departments}
          isLoading={isLoading}
          pendingStatusChange={pendingStatusChange}
          updatingDepartmentId={updatingDepartmentId}
          onStatusChange={requestStatusChange}
        />

        {!isLoading && pagination.count === 0 && (
          <div className="users-table__empty">
            <strong>Không có dữ liệu</strong>
            <span>Chưa tìm thấy khoa nào trong database.</span>
          </div>
        )}

        {!isLoading && (
          <PaginationFooter
            count={pagination.count}
            entityLabel="khoa"
            page={page}
            pageSize={pageSize}
            previous={pagination.previous}
            next={pagination.next}
            onPageChange={setPage}
          />
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
