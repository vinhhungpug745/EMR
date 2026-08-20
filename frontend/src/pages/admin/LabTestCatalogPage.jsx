import { useCallback, useState } from 'react'
import { Plus, RefreshCw, Search } from 'lucide-react'
import { Navigate } from 'react-router-dom'

import {
  createLabTestCatalog,
  getLabTestCatalogs,
  updateLabTestCatalog,
} from '../../api/labTestCatalogs'
import { useAuth } from '../../auth/useAuth'
import { LabTestFormModal } from '../../components/admin/LabTestFormModal'
import { LabTestTable } from '../../components/admin/LabTestTable'
import { PaginationFooter } from '../../components/common/PaginationFooter'
import { Snackbar } from '../../components/common/Snackbar'
import { usePaginatedResource } from '../../utils/usePaginatedResource'
import { useStatusToggle } from '../../utils/useStatusToggle'

const PAGE_SIZE = 8

export default function LabTestCatalogPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  const fetchLabTests = useCallback(({ page, pageSize }) => getLabTestCatalogs({
    search,
    ordering: 'name',
    page,
    pageSize,
  }), [search])

  const {
    items: labTests,
    setItems: setLabTests,
    page,
    setPage,
    pageSize,
    pagination,
    isLoading,
    errorMessage,
    loadItems: loadLabTests,
  } = usePaginatedResource({
    fetchPage: fetchLabTests,
    resetKey: search,
    pageSize: PAGE_SIZE,
    errorFallback: 'Không thể tải danh mục xét nghiệm.',
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
    updateStatus: (test, nextActive) => updateLabTestCatalog(test.id, { active: nextActive }),
    onSuccess: (test, updatedTest, nextActive) => {
      setLabTests((items) => items.map((item) => (
        item.id === test.id ? { ...item, active: updatedTest.active ?? nextActive } : item
      )))
    },
    errorFallback: 'Không thể cập nhật trạng thái xét nghiệm.',
  })

  if (user.role !== 'admin') return <Navigate to="/app" replace />

  async function handleCreateLabTest(formData) {
    setIsSaving(true)
    setFormError(null)

    try {
      const createdTest = await createLabTestCatalog(formData)
      setIsCreateOpen(false)
      await loadLabTests()
      showSnackbar({ type: 'success', message: `Đã thêm ${createdTest.name}.` })
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
        <LabTestTable
          labTests={labTests}
          isLoading={isLoading}
          pendingStatusChange={pendingStatusChange}
          updatingId={updatingId}
          onStatusChange={requestStatusChange}
        />

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
            pageSize={pageSize}
            previous={pagination.previous}
            next={pagination.next}
            onPageChange={setPage}
          />
        )}
      </section>

      <Snackbar
        snackbar={snackbar}
        onCancel={cancelStatusChange}
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
