import { useCallback, useMemo, useState } from 'react'
import {
  Beaker,
  CheckCircle2,
  RefreshCw,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react'

import { createLabTest } from '../../api/labtests'
import { getLabTestCatalogs } from '../../api/labTestCatalogs'
import { PaginationFooter } from '../common/PaginationFooter'
import { usePaginatedResource } from '../../utils/usePaginatedResource'

const ALL_UNITS = 'Tất cả'
const PAGE_SIZE = 8

export default function LabOrderModal({
  patientName,
  visitNumber,
  departmentName,
  encounterId,
  orderedLabTests,
  onClose,
  onSubmitted,
}) {
  const [activeUnit, setActiveUnit] = useState(ALL_UNITS)
  const [searchTerm, setSearchTerm] = useState('')
  const [pendingTests, setPendingTests] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitErrorMessage, setSubmitErrorMessage] = useState('')

  const fetchLabTests = useCallback(
    ({ page, pageSize }) =>
      getLabTestCatalogs({
        activeOnly: true,
        search: searchTerm,
        ordering: 'category,name',
        page,
        pageSize,
      }),
    [searchTerm],
  )

  const {
    items: labTests,
    page,
    setPage,
    pageSize,
    pagination,
    isLoading,
    errorMessage,
    loadItems: loadLabTests,
  } = usePaginatedResource({
    fetchPage: fetchLabTests,
    resetKey: searchTerm,
    pageSize: PAGE_SIZE,
    errorFallback: 'Không thể tải danh mục xét nghiệm.',
  })

  const units = useMemo(() => {
    const categories = labTests
      .map((test) => test.category || 'Chưa phân loại')
      .filter((category, index, list) => list.indexOf(category) === index)

    return [ALL_UNITS, ...categories]
  }, [labTests])

  const filteredTests = useMemo(() => {
    return labTests.filter((test) => {
      const category = test.category || 'Chưa phân loại'
      const matchesUnit = activeUnit === ALL_UNITS || category === activeUnit

      return matchesUnit
    })
  }, [activeUnit, labTests])

  function handleSearchChange(event) {
    setSearchTerm(event.target.value)
  }

  function handleToggleTest(test) {
    if (orderedLabTests.some((item) => item.test_catalog === test.id)) {
      return
    }

    setPendingTests((current) => (
      current.some((item) => item.id === test.id)
        ? current.filter((item) => item.id !== test.id)
        : [...current, test]
    ))
  }

  async function handleSubmitLabOrder() {
    if (!pendingTests.length) return

    setIsSubmitting(true)
    setSubmitErrorMessage('')

    try {
      const createdTests = await Promise.all(
        pendingTests.map((test) =>
          createLabTest({
            encounter: encounterId,
            test_catalog: test.id,
          }),
        ),
      )

      setPendingTests([])
      onSubmitted(createdTests)
    } catch (error) {
      console.error(error)
      setSubmitErrorMessage(
        error?.message || 'Không thể gửi chỉ định xét nghiệm.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedIds = [
    ...orderedLabTests.map((item) => item.test_catalog),
    ...pendingTests.map((item) => item.id),
  ]

  const displayedTests = [
    ...orderedLabTests.map((item) => ({
      id: item.test_catalog,
      name: item.test_catalog_detail?.name,
      category: item.test_catalog_detail?.category,
      specimen_type: item.test_catalog_detail?.specimen_type,
      code: item.test_catalog_detail?.code,
      ordered: true,
      labTestId: item.id,
      status: item.status,
      status_display: item.status_display,
    })),

    ...pendingTests.filter(
      (selected) =>
        !orderedLabTests.some(
          (ordered) => ordered.test_catalog === selected.id,
        ),
    ),
  ]

  return (
    <div className="lab-order-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="lab-order-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lab-order-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="lab-order-modal__header">
          <div>
            <span className="doctor-page__eyebrow">
              <Beaker size={15} />
              Phiếu chỉ định xét nghiệm
            </span>
            <h2 id="lab-order-title">Chỉ định xét nghiệm</h2>
          </div>

          <div className="lab-order-patient-strip">
            <strong>{patientName}</strong>
            <span>{visitNumber}</span>
            <span>{departmentName}</span>
          </div>

          <button type="button" className="lab-order-modal__close" aria-label="Đóng" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="lab-order-modal__body">
          <div className="lab-test-picker lab-order-card">
            <div className="lab-order-catalog-tools">
              <label className="lab-order-search">
                <Search size={17} />
                <input
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Tìm theo tên, mã, mẫu bệnh phẩm..."
                />
              </label>

              <div className="lab-order-filter">
                <span>Nhóm xét nghiệm</span>
                <div className="lab-order-tabs" aria-label="Nhóm xét nghiệm">
                  {units.map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      className={activeUnit === unit ? 'is-active' : ''}
                      onClick={() => setActiveUnit(unit)}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lab-test-list">
              {isLoading && (
                <div className="lab-order-state">Đang tải danh mục xét nghiệm...</div>
              )}

              {!isLoading && errorMessage && (
                <div className="lab-order-state lab-order-state--error">
                  <span>{errorMessage}</span>
                  <button type="button" onClick={loadLabTests}>
                    <RefreshCw size={15} />
                    Tải lại
                  </button>
                </div>
              )}

              {!isLoading && !errorMessage && !filteredTests.length && (
                <div className="lab-order-state">Không có xét nghiệm phù hợp.</div>
              )}

              {!isLoading && !errorMessage && filteredTests.map((test) => {
                const category = test.category || 'Chưa phân loại'
                const isSelected = selectedIds.includes(test.id)

                return (
                  <button
                    key={test.id}
                    type="button"
                    className={`lab-test-option${isSelected ? ' is-selected' : ''}`}
                    onClick={() => handleToggleTest(test)}
                  >
                    <span className="lab-test-option__check">
                      {isSelected && <CheckCircle2 size={15} />}
                    </span>

                    <span className="lab-test-option__content">
                      <strong>{test.name}</strong>
                      <small>{category} · {test.specimen_type || 'Chưa cập nhật mẫu'} · {test.code}</small>
                      <em>{test.description || 'Chưa có mô tả chi tiết.'}</em>
                    </span>
                  </button>
                )
              })}
            </div>

            <PaginationFooter
              count={pagination.count}
              entityLabel="xét nghiệm"
              page={page}
              pageSize={pageSize}
              previous={pagination.previous}
              next={pagination.next}
              onPageChange={setPage}
            />
          </div>

          <aside className="lab-order-slip lab-order-card">
            <div className="lab-order-card__header lab-order-card__header--slip">
              <div>
                <strong>Phiếu chỉ định</strong>
                <span>{pendingTests.length ? `${pendingTests.length} xét nghiệm đã chọn` : 'Chưa chọn xét nghiệm'}</span>
              </div>
            </div>

            {displayedTests.length > 0 ? (
              <div className="lab-order-slip__list">
                {displayedTests.map((test) => {
                  const category =
                    test.category || 'Chưa phân loại'

                  return (
                    <article
                      className="lab-order-slip__item"
                      key={`${test.ordered ? 'ordered' : 'new'}-${test.id}`}
                    >
                      <div>
                        <strong>{test.name}</strong>

                        <span>
                          Đơn vị: {category}
                        </span>

                        <span>
                          Mẫu: {test.specimen_type || 'Chưa cập nhật'}
                        </span>

                        {test.ordered && (
                          <span>
                            Trạng thái: {test.status_display || 'Đã chỉ định'}
                          </span>
                        )}
                      </div>

                      {!test.ordered && (
                        <button
                          type="button"
                          aria-label={`Bỏ ${test.name}`}
                          onClick={() => handleToggleTest(test)}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="lab-order-empty">
                <strong>Chưa có xét nghiệm</strong>
                <span>
                  Chọn xét nghiệm ở danh mục bên trái để thêm vào lượt khám.
                </span>
              </div>
            )}

          </aside>
        </div>

        <footer className="lab-order-modal__footer">
          {submitErrorMessage && (
            <div className="lab-order-submit-error">
              {submitErrorMessage}
            </div>
          )}

          <button type="button" className="exam-save-button" onClick={onClose}>
            Hủy
          </button>
          <button
              type="button"
              className="exam-complete-button"
              onClick={handleSubmitLabOrder}
              disabled={
                !pendingTests.length ||
                isSubmitting
              }
            >
              <Send size={16} />

              {isSubmitting
                ? 'Đang gửi...'
                : 'Gửi chỉ định'}
          </button>
        </footer>
      </section>
    </div>
  )
}
