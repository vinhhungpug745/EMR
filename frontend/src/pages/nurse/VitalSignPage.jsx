import { useCallback, useState } from 'react'
import { Activity, RefreshCw, Search } from 'lucide-react'

import { getVitalSign, getVitalSigns, updateVitalSign } from '../../api/vitalsigns'
import { PaginationFooter } from '../../components/common/PaginationFooter'
import { Snackbar } from '../../components/common/Snackbar'
import VitalSignModal from '../../components/nurse/VitalSignModal'
import VitalSignTable from '../../components/nurse/VitalSignTable'
import { usePaginatedResource } from '../../utils/usePaginatedResource'
import { useSnackbar } from '../../utils/useSnackbar'


const PAGE_SIZE = 8

export default function VitalSignsPage() {
  const [search, setSearch] = useState('')
  const [editingVitalSign, setEditingVitalSign] = useState(null)
  const [loadingVitalSignId, setLoadingVitalSignId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const { snackbar, showSnackbar } = useSnackbar()

  const fetchVitalSigns = useCallback(({ page, pageSize }) => getVitalSigns({
    search,
    ordering: '-created_at',
    page,
    pageSize,
  }), [search])

  const {
    items: vitalSigns,
    page,
    setPage,
    pageSize,
    pagination,
    isLoading,
    errorMessage,
    loadItems: loadVitalSigns,
  } = usePaginatedResource({
    fetchPage: fetchVitalSigns,
    resetKey: search,
    pageSize: PAGE_SIZE,
    errorFallback: 'Không thể tải danh sách sinh hiệu.',
  })

  async function openEditForm(item) {
    if (loadingVitalSignId !== null) return
    setLoadingVitalSignId(item.id)
    setFormError(null)

    try {
      setEditingVitalSign(await getVitalSign(item.id))
    } catch (error) {
      showSnackbar({
        type: 'error',
        message: error?.message || 'Không thể tải chi tiết sinh hiệu.',
      })
    } finally {
      setLoadingVitalSignId(null)
    }
  }

  function closeEditForm() {
    if (isSaving) return
    setEditingVitalSign(null)
    setFormError(null)
  }

  async function handleUpdateVitalSign(payload) {
    setIsSaving(true)
    setFormError(null)

    try {
      await updateVitalSign(editingVitalSign.id, payload)
      setEditingVitalSign(null)
      await loadVitalSigns()
      showSnackbar({ type: 'success', message: 'Đã cập nhật sinh hiệu bệnh nhân.' })
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
          <h1>Sinh hiệu</h1>
          <p>Tra cứu các lần đo sinh hiệu và bấm vào từng bản ghi để chỉnh sửa.</p>
        </div>

        <div className="nurse-page__summary">
          <Activity size={20} />

          <div>
            <strong>{pagination.count}</strong>
            <span>Bản ghi</span>
          </div>
        </div>
      </header>

      <section className="users-toolbar">
        <label className="users-toolbar__search">
          <Search size={17} aria-hidden="true" />
          <input
            value={search}
            placeholder="Tìm theo tên bệnh nhân, SĐT hoặc mã lượt khám"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <button
          className="icon-button users-toolbar__refresh"
          type="button"
          disabled={isLoading}
          onClick={loadVitalSigns}
        >
          <RefreshCw className={isLoading ? 'is-spinning' : ''} size={17} />
        </button>
      </section>

      {errorMessage && (
        <div className="users-page__error">
          <span>{errorMessage}</span>
          <button type="button" onClick={loadVitalSigns}>Thử lại</button>
        </div>
      )}

      <VitalSignTable
        vitalSigns={vitalSigns}
        isLoading={isLoading}
        loadingVitalSignId={loadingVitalSignId}
        onEdit={openEditForm}
      />

      {!isLoading && (
        <PaginationFooter
          count={pagination.count}
          entityLabel="bản ghi"
          page={page}
          pageSize={pageSize}
          previous={pagination.previous}
          next={pagination.next}
          onPageChange={setPage}
        />
      )}

      <Snackbar snackbar={snackbar} />

      {editingVitalSign && (
        <VitalSignModal
          key={editingVitalSign.id}
          initialVitalSign={editingVitalSign}
          isSubmitting={isSaving}
          error={formError}
          mode="edit"
          onClose={closeEditForm}
          onSubmit={handleUpdateVitalSign}
        />
      )}
    </div>
  )
}
