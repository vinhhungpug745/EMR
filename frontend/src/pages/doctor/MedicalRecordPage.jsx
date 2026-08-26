import { useCallback, useState } from 'react'
import {
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
  Search,
  UsersRound,
} from 'lucide-react'
import { Navigate } from 'react-router-dom'

import {
  getMedicalRecord,
  getMedicalRecords,
  updateMedicalRecord,
} from '../../api/medicalRecords'
import { useAuth } from '../../auth/useAuth'
import { PaginationFooter } from '../../components/common/PaginationFooter'
import { Snackbar } from '../../components/common/Snackbar'
import { MedicalRecordDetail } from '../../components/doctor/MedicalRecordDetail'
import { MedicalRecordModal } from '../../components/doctor/MedicalRecordModal'
import { MedicalRecordTable } from '../../components/doctor/MedicalRecordTable'
import { usePaginatedResource } from '../../utils/usePaginatedResource'
import { useSnackbar } from '../../utils/useSnackbar'

const PAGE_SIZE = 8
const ALLOWED_ROLES = ['admin', 'doctor', 'receptionist']

export default function MedicalRecordPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [editingRecord, setEditingRecord] = useState(null)
  const [loadingRecordId, setLoadingRecordId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const { snackbar, showSnackbar } = useSnackbar()

  const fetchMedicalRecords = useCallback(({ page, pageSize }) => getMedicalRecords({
    search,
    ordering: 'record_number',
    page,
    pageSize,
  }), [search])

  const {
    items: medicalRecords,
    page,
    setPage,
    pageSize,
    pagination,
    isLoading,
    errorMessage,
    loadItems: loadMedicalRecords,
  } = usePaginatedResource({
    fetchPage: fetchMedicalRecords,
    resetKey: search,
    pageSize: PAGE_SIZE,
    errorFallback: 'Không thể tải danh sách hồ sơ bệnh án.',
  })

  if (!ALLOWED_ROLES.includes(user.role)) {
    return <Navigate to="/app" replace />
  }

  async function openDetail(record) {
    setFormError(null)
    setLoadingRecordId(record.id)

    try {
      const detail = await getMedicalRecord(record.id)
      setSelectedRecord(detail)
    } catch (error) {
      showSnackbar({
        type: 'error',
        message: error.message || 'Không thể tải chi tiết hồ sơ bệnh án.',
      })
    } finally {
      setLoadingRecordId(null)
    }
  }

  function openEditForm() {
    setFormError(null)
    setEditingRecord(selectedRecord)
  }

  function closeForm() {
    if (isSaving) return
    setFormError(null)
    setEditingRecord(null)
  }

  async function handleUpdateMedicalRecord(formData) {
    setIsSaving(true)
    setFormError(null)

    try {
      const updatedRecord = await updateMedicalRecord(editingRecord.id, formData)
      const detail = await getMedicalRecord(updatedRecord.id)
      setSelectedRecord(detail)
      setEditingRecord(null)
      await loadMedicalRecords()
      showSnackbar({
        type: 'success',
        message: `Đã cập nhật ${updatedRecord.record_number}.`,
      })
    } catch (error) {
      setFormError(error)
    } finally {
      setIsSaving(false)
    }
  }

  if (selectedRecord) {
    return (
      <div className="users-page">
        <MedicalRecordDetail
          medicalRecord={selectedRecord}
          onBack={() => {
            setSelectedRecord(null)
            setEditingRecord(null)
            setFormError(null)
          }}
          onEdit={openEditForm}
        />

        <Snackbar snackbar={snackbar} />

        {editingRecord && (
          <MedicalRecordModal
            error={formError}
            isSaving={isSaving}
            medicalRecord={editingRecord}
            onClose={closeForm}
            onSubmit={handleUpdateMedicalRecord}
          />
        )}
      </div>
    )
  }

  const recordsWithVisits = medicalRecords.filter((record) => record.latest_visit).length
  const activeRecords = medicalRecords.filter((record) => record.active).length

  return (
    <div className="users-page">
      <header className="users-page__header">
        <div>
          <h1>Hồ sơ bệnh án</h1>
          <p>Theo dõi hồ sơ nền, lần đến khám gần nhất và diễn tiến bệnh án.</p>
        </div>

        <div className="nurse-page__summary">
          <FileText size={20} />

          <div>
            <strong>{pagination.count}</strong>
            <span>Hồ sơ</span>
          </div>
        </div>
      </header>


      <section className="users-toolbar patients-toolbar">
        <label className="users-toolbar__search">
          <Search size={17} aria-hidden="true" />
          <input
            value={search}
            placeholder="Tìm mã hồ sơ, tên bệnh nhân, SĐT, CCCD hoặc BHYT"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <button
          className="icon-button users-toolbar__refresh"
          type="button"
          disabled={isLoading}
          onClick={loadMedicalRecords}
        >
          <RefreshCw className={isLoading ? 'is-spinning' : ''} size={17} />
        </button>
      </section>

      {errorMessage && (
        <div className="users-page__error">
          <span>{errorMessage}</span>
          <button type="button" onClick={loadMedicalRecords}>Thử lại</button>
        </div>
      )}

      <section className="users-table-panel">
        <MedicalRecordTable
          medicalRecords={medicalRecords}
          isLoading={isLoading}
          loadingRecordId={loadingRecordId}
          onEdit={openDetail}
        />

        {!isLoading && pagination.count === 0 && (
          <div className="users-table__empty">
            <FileText size={28} aria-hidden="true" />
            <strong>Không có hồ sơ bệnh án</strong>
            <span>Thử thay đổi từ khóa tìm kiếm hoặc tạo bệnh nhân mới.</span>
          </div>
        )}

        {!isLoading && (
          <PaginationFooter
            count={pagination.count}
            entityLabel="hồ sơ"
            page={page}
            pageSize={pageSize}
            previous={pagination.previous}
            next={pagination.next}
            onPageChange={setPage}
          />
        )}
      </section>

      <Snackbar snackbar={snackbar} />

      {editingRecord && (
        <MedicalRecordModal
          error={formError}
          isSaving={isSaving}
          medicalRecord={editingRecord}
          onClose={closeForm}
          onSubmit={handleUpdateMedicalRecord}
        />
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  tone,
  value,
}) {
  return (
    <article className="medical-record-stat">
      <span className={`medical-record-stat__icon medical-record-stat__icon--${tone}`}>
        {icon}
      </span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  )
}
