import { useCallback, useState } from 'react'
import { Activity, RefreshCw, Search } from 'lucide-react'

import { getVitalSigns, updateVitalSign } from '../../api/vitalsigns'
import { PaginationFooter } from '../../components/common/PaginationFooter'
import VitalSignModal from '../../components/nurse/VitalSignModal'
import VitalSignTable from '../../components/nurse/VitalSignTable'
import { usePaginatedResource } from '../../utils/usePaginatedResource'

import '../../styles/nurse.css'

const PAGE_SIZE = 8

export default function VitalSignsPage() {
  const [search, setSearch] = useState('')
  const [selectedVitalSign, setSelectedVitalSign] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchVitalSigns = useCallback(({ page, pageSize }) => getVitalSigns({
    search,
    ordering: '-created_at',
    page,
    pageSize,
  }), [search])

  const {
    items: vitalSigns,
    setItems: setVitalSigns,
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

  async function handleUpdateVitalSign(payload) {
    setIsSubmitting(true)
    setFormError('')

    try {
      const updated = await updateVitalSign(selectedVitalSign.id, payload)

      setVitalSigns((items) => items.map((item) => (
        item.id === selectedVitalSign.id
          ? { ...item, ...updated }
          : item
      )))

      setSelectedVitalSign(null)
    } catch (requestError) {
      setFormError(
        requestError?.message ||
        'Không thể cập nhật sinh hiệu.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="users-page">
      <header className="users-page__header">
        <div>
          <h1>Sinh hiệu</h1>
          <p>Tra cứu và chỉnh sửa các lần đo sinh hiệu đã ghi nhận.</p>
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
        onEdit={setSelectedVitalSign}
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

      <VitalSignModal
        vitalSign={selectedVitalSign}
        isSubmitting={isSubmitting}
        error={formError}
        onClose={() => {
          if (!isSubmitting) {
            setSelectedVitalSign(null)
            setFormError('')
          }
        }}
        onSubmit={handleUpdateVitalSign}
      />
    </div>
  )
}