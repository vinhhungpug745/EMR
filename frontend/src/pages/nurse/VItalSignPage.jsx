import { useCallback, useState } from 'react'
import { Activity, RefreshCw, Search } from 'lucide-react'

import { getVitalSign, getVitalSigns } from '../../api/vitalsigns'
import { PaginationFooter } from '../../components/common/PaginationFooter'
import VitalSignDetailModal from '../../components/nurse/VitalSignDetailModal'
import VitalSignTable from '../../components/nurse/VitalSignTable'
import { usePaginatedResource } from '../../utils/usePaginatedResource'

import '../../styles/nurse.css'

const PAGE_SIZE = 8

export default function VitalSignsPage() {
  const [search, setSearch] = useState('')
  const [selectedVitalSign, setSelectedVitalSign] = useState(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

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

  async function handleViewVitalSign(item) {
    setSelectedVitalSign(item)
    setIsDetailLoading(true)
    setDetailError('')

    try {
      const detail = await getVitalSign(item.id)
      setSelectedVitalSign(detail)
    } catch (requestError) {
      setDetailError(
        requestError?.message ||
        'Không thể tải chi tiết sinh hiệu.',
      )
    } finally {
      setIsDetailLoading(false)
    }
  }

  return (
    <div className="users-page">
      <header className="users-page__header">
        <div>
          <h1>Sinh hiệu</h1>
          <p>Tra cứu các lần đo sinh hiệu và bấm vào từng bản ghi để xem chi tiết.</p>
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
        onView={handleViewVitalSign}
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

      <VitalSignDetailModal
        vitalSign={selectedVitalSign}
        isLoading={isDetailLoading}
        error={detailError}
        onClose={() => {
          if (!isDetailLoading) {
            setSelectedVitalSign(null)
            setDetailError('')
          }
        }}
      />
    </div>
  )
}
