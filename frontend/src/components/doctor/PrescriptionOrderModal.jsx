import { useCallback, useState } from 'react'
import {
  CheckCircle2,
  Pencil,
  Pill,
  RefreshCw,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react'

import { getMedications } from '../../api/medications'
import { createPrescription, updatePrescription } from '../../api/prescriptions'
import { PaginationFooter } from '../common/PaginationFooter'
import { usePaginatedResource } from '../../utils/usePaginatedResource'

const PAGE_SIZE = 8

const DEFAULT_ITEM = {
  dosage: '',
  frequency: '',
  duration: '',
  quantity: '1',
  instruction: '',
}

function getRouteLabel(route) {
  const routeLabels = {
    oral: 'Đường uống',
    topical: 'Dùng ngoài',
    inhalation: 'Đường hít',
    injection: 'Đường tiêm',
    other: 'Khác',
  }

  return routeLabels[route] || route || 'Chưa cập nhật'
}

function getMedicationLabel(medication) {
  if (!medication) {
    return {
      name: 'Thuốc chưa rõ',
      meta: 'Chưa cập nhật',
      detail: 'Chưa cập nhật',
    }
  }

  return {
    name: medication.name || 'Thuốc chưa rõ',
    meta: [
      medication.active_ingredient,
      medication.strength,
      getRouteLabel(medication.route),
    ].filter(Boolean).join(' · ') || 'Chưa cập nhật',
    detail: [
      medication.dosage_form,
      medication.unit ? `Đơn vị: ${medication.unit}` : '',
    ].filter(Boolean).join(' · ') || 'Chưa cập nhật',
  }
}

function getMedicationId(medication) {
  return typeof medication === 'object' && medication !== null
    ? medication.id
    : medication
}

export default function PrescriptionOrderModal({
  patientName,
  visitNumber,
  departmentName,
  encounterId,
  existingPrescriptions = [],
  onClose,
  onCancelError,
  onCancelled,
  onSubmitted,
  onUpdated,
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [items, setItems] = useState([])
  const [note, setNote] = useState('')
  const [editingPrescriptionId, setEditingPrescriptionId] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCancellingPrescriptions, setIsCancellingPrescriptions] = useState(false)
  const [submitErrorMessage, setSubmitErrorMessage] = useState('')

  const activePrescriptions = existingPrescriptions.filter(
    (prescription) => prescription.status !== 'cancelled',
  )

  const fetchMedications = useCallback(
    ({ page, pageSize }) =>
      getMedications({
        activeOnly: true,
        search: searchTerm,
        ordering: 'name,strength',
        page,
        pageSize,
      }),
    [searchTerm],
  )

  const {
    items: medications,
    page,
    setPage,
    pageSize,
    pagination,
    isLoading,
    errorMessage,
    loadItems,
  } = usePaginatedResource({
    fetchPage: fetchMedications,
    resetKey: searchTerm,
    pageSize: PAGE_SIZE,
    errorFallback: 'Không thể tải danh mục thuốc.',
  })

  const issuedItems = activePrescriptions
    .filter((prescription) => prescription.id !== editingPrescriptionId)
    .flatMap((prescription) => (
      (prescription.items || []).map((item) => ({
        key: `issued-${prescription.id}-${item.id}`,
        type: 'issued',
        prescriptionId: prescription.id,
        prescriptionStatus: prescription.status_display || prescription.status || 'Đã kê',
        medicationId: getMedicationId(item.medication),
        medication: item.medication_detail || item.medication,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        quantity: item.quantity,
        instruction: item.instruction,
      }))
    ))

  const issuedMedicineCount = activePrescriptions.reduce(
    (total, prescription) => total + (prescription.items?.length || 0),
    0,
  )

  const pendingItems = items.map((item) => ({
    key: `pending-${item.medication.id}`,
    type: 'pending',
    medicationId: item.medication.id,
    medication: item.medication,
    dosage: item.dosage,
    frequency: item.frequency,
    duration: item.duration,
    quantity: item.quantity,
    instruction: item.instruction,
  }))

  const displayedItems = [
    ...issuedItems,
    ...pendingItems,
  ]

  const existingMedicationIds = new Set(
    issuedItems
      .map((item) => item.medicationId)
      .filter((medicationId) => medicationId !== null && medicationId !== undefined),
  )

  const selectedIds = new Set([
    ...existingMedicationIds,
    ...items.map((item) => item.medication.id),
  ])

  function handleSearchChange(event) {
    setSearchTerm(event.target.value)
  }

  function handleToggleMedication(medication) {
    if (existingMedicationIds.has(medication.id)) {
      return
    }

    setItems((current) => (
      current.some((item) => item.medication.id === medication.id)
        ? current.filter((item) => item.medication.id !== medication.id)
        : [...current, { medication, ...DEFAULT_ITEM }]
    ))
  }

  function handleItemChange(medicationId, field, value) {
    setItems((current) => (
      current.map((item) => (
        item.medication.id === medicationId
          ? { ...item, [field]: value }
          : item
      ))
    ))
  }

  function handleEditPrescription(prescription) {
    if (items.length && editingPrescriptionId !== prescription.id) {
      const shouldReplace = window.confirm('Bỏ các thay đổi đang nhập để sửa đơn thuốc này?')
      if (!shouldReplace) return
    }

    setEditingPrescriptionId(prescription.id)
    setItems((prescription.items || []).map((item) => ({
      medication: item.medication_detail || item.medication,
      dosage: item.dosage || '',
      frequency: item.frequency || '',
      duration: item.duration || '',
      quantity: item.quantity ?? '1',
      instruction: item.instruction || '',
    })))
    setNote(prescription.note || '')
    setSubmitErrorMessage('')
  }

  function validateItems() {
    if (!items.length) {
      return 'Vui lòng chọn ít nhất một thuốc.'
    }

    const missingItem = items.find((item) => (
      !item.dosage.trim()
      || !item.frequency.trim()
      || !item.duration.trim()
      || !String(item.quantity).trim()
    ))

    if (missingItem) {
      return 'Vui lòng nhập đủ liều dùng, tần suất, thời gian và số lượng.'
    }

    return ''
  }

  async function handleSubmitPrescription() {
    const validationMessage = validateItems()

    if (validationMessage) {
      setSubmitErrorMessage(validationMessage)
      return
    }

    setIsSubmitting(true)
    setSubmitErrorMessage('')

    try {
      const payload = {
        status: 'issued',
        note: note.trim(),
        items: items.map((item) => ({
          medication: item.medication.id,
          dosage: item.dosage.trim(),
          frequency: item.frequency.trim(),
          duration: item.duration.trim(),
          quantity: item.quantity,
          instruction: item.instruction.trim(),
        })),
      }

      const savedPrescription = editingPrescriptionId
        ? await updatePrescription(editingPrescriptionId, payload)
        : await createPrescription({ encounter: encounterId, ...payload })

      setItems([])
      setNote('')
      setEditingPrescriptionId(null)

      if (editingPrescriptionId) {
        onUpdated?.(savedPrescription)
      } else {
        onSubmitted(savedPrescription)
      }
    } catch (error) {
      console.error(error)
      setSubmitErrorMessage(
        error?.message || (editingPrescriptionId
          ? 'Không thể cập nhật đơn thuốc.'
          : 'Không thể gửi đơn thuốc.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCancelAllPrescriptions() {
    const prescriptionCount = activePrescriptions.length
    const medicineCount = issuedMedicineCount
    const shouldCancel = window.confirm(
      `Hủy toàn bộ ${medicineCount} thuốc trong ${prescriptionCount} đơn hiện tại để chuyển chuyên khoa?`,
    )

    if (!shouldCancel) return

    setIsCancellingPrescriptions(true)
    setSubmitErrorMessage('')

    try {
      const updatedPrescriptions = await Promise.all(
        activePrescriptions.map((prescription) => updatePrescription(prescription.id, {
          status: 'cancelled',
        })),
      )

      setEditingPrescriptionId(null)
      setItems([])
      setNote('')
      onCancelled?.(updatedPrescriptions)
    } catch (error) {
      console.error(error)
      const message = error?.message || 'Không thể hủy toàn bộ đơn thuốc.'
      setSubmitErrorMessage(message)
      onCancelError?.(message)
    } finally {
      setIsCancellingPrescriptions(false)
    }
  }

  return (
    <div
      className="lab-order-backdrop"
      role="presentation"
      onMouseDown={isCancellingPrescriptions ? undefined : onClose}
    >
      <section
        className="lab-order-modal prescription-order-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prescription-order-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="lab-order-modal__header">
          <div>
            <span className="doctor-page__eyebrow">
              <Pill size={15} />
              Phiếu kê đơn thuốc
            </span>
            <h2 id="prescription-order-title">Kê đơn thuốc</h2>
          </div>

          <div className="lab-order-patient-strip">
            <strong>{patientName}</strong>
            <span>{visitNumber}</span>
            <span>{departmentName}</span>
          </div>

          <button
            type="button"
            className="lab-order-modal__close"
            aria-label="Đóng"
            disabled={isCancellingPrescriptions}
            onClick={onClose}
          >
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
                  placeholder="Tìm thuốc, hoạt chất, hàm lượng..."
                />
              </label>
            </div>

            <div className="lab-test-list">
              {isLoading && (
                <div className="lab-order-state">Đang tải danh mục thuốc...</div>
              )}

              {!isLoading && errorMessage && (
                <div className="lab-order-state lab-order-state--error">
                  <span>{errorMessage}</span>
                  <button type="button" onClick={loadItems}>
                    <RefreshCw size={15} />
                    Tải lại
                  </button>
                </div>
              )}

              {!isLoading && !errorMessage && !medications.length && (
                <div className="lab-order-state">Không có thuốc phù hợp.</div>
              )}

              {!isLoading && !errorMessage && medications.map((medication) => {
                const isSelected = selectedIds.has(medication.id)
                const isIssued = existingMedicationIds.has(medication.id)

                return (
                  <button
                    key={medication.id}
                    type="button"
                    className={`lab-test-option${isSelected ? ' is-selected' : ''}${isIssued ? ' is-locked' : ''}`}
                    onClick={() => handleToggleMedication(medication)}
                  >
                    <span className="lab-test-option__check">
                      {isSelected && <CheckCircle2 size={15} />}
                    </span>

                    <span className="lab-test-option__content">
                      <strong>{medication.name}</strong>
                      <small>{medication.active_ingredient} · {medication.strength} · {getRouteLabel(medication.route)}</small>
                      <em>
                        {isIssued
                          ? 'Đã có trong đơn thuốc'
                          : `${medication.dosage_form} · Đơn vị: ${medication.unit}`}
                      </em>
                    </span>
                  </button>
                )
              })}
            </div>

            <PaginationFooter
              count={pagination.count}
              entityLabel="thuốc"
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
                <strong>Đơn thuốc</strong>
                <span>
                  {editingPrescriptionId
                    ? `${items.length} thuốc đang chỉnh sửa trong đơn #${editingPrescriptionId}`
                    : items.length
                    ? `${items.length} thuốc đang kê`
                    : issuedItems.length
                      ? `${issuedItems.length} thuốc đã kê`
                      : 'Chưa chọn thuốc'}
                </span>
              </div>

              {activePrescriptions.length > 0 && (
                <div className="prescription-order-actions">
                  {activePrescriptions.map((prescription) => (
                    <button
                      key={prescription.id}
                      type="button"
                      className="prescription-edit-button"
                      disabled={
                        isSubmitting
                        || isCancellingPrescriptions
                        || editingPrescriptionId === prescription.id
                      }
                      onClick={() => handleEditPrescription(prescription)}
                    >
                      <Pencil size={15} />
                      {editingPrescriptionId === prescription.id
                        ? `Đang sửa đơn #${prescription.id}`
                        : `Sửa đơn thuốc`}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="prescription-cancel-button"
                    disabled={isSubmitting || isCancellingPrescriptions}
                    onClick={handleCancelAllPrescriptions}
                  >
                    <Trash2 size={15} />
                    {isCancellingPrescriptions ? 'Đang hủy...' : 'Hủy đơn thuốc'}
                  </button>
                </div>
              )}
            </div>

            {displayedItems.length > 0 ? (
              <div className="prescription-slip__list">
                {displayedItems.map((item) => {
                  const medicationLabel = getMedicationLabel(item.medication)
                  const isIssued = item.type === 'issued'

                  return (
                  <article
                    className={`prescription-slip__item${isIssued ? ' prescription-slip__item--issued' : ''}`}
                    key={item.key}
                  >
                    <header>
                      <div>
                        <strong>{medicationLabel.name}</strong>
                        <span>{medicationLabel.meta}</span>
                        {isIssued && (
                          <em className="prescription-slip__status">
                            {item.prescriptionStatus} · Đơn #{item.prescriptionId}
                          </em>
                        )}
                      </div>

                      {!isIssued && (
                        <button
                          type="button"
                          aria-label={`Bỏ ${item.medication.name}`}
                          onClick={() => handleToggleMedication(item.medication)}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </header>

                    {isIssued ? (
                      <dl className="prescription-slip__summary">
                        <div>
                          <dt>Liều dùng</dt>
                          <dd>{item.dosage || 'Chưa ghi'}</dd>
                        </div>
                        <div>
                          <dt>Tần suất</dt>
                          <dd>{item.frequency || 'Chưa ghi'}</dd>
                        </div>
                        <div>
                          <dt>Thời gian</dt>
                          <dd>{item.duration || 'Chưa ghi'}</dd>
                        </div>
                        <div>
                          <dt>Số lượng</dt>
                          <dd>{item.quantity || 'Chưa ghi'}</dd>
                        </div>
                        <div className="prescription-slip__summary-wide">
                          <dt>Dặn dò</dt>
                          <dd>{item.instruction || medicationLabel.detail}</dd>
                        </div>
                      </dl>
                    ) : (
                      <div className="prescription-fields">
                        <label>
                          <span>Liều dùng</span>
                          <input
                            value={item.dosage}
                            onChange={(event) => handleItemChange(item.medication.id, 'dosage', event.target.value)}
                            placeholder="VD: 1 viên"
                          />
                        </label>

                        <label>
                          <span>Tần suất</span>
                          <input
                            value={item.frequency}
                            onChange={(event) => handleItemChange(item.medication.id, 'frequency', event.target.value)}
                            placeholder="VD: 2 lần/ngày"
                          />
                        </label>

                        <label>
                          <span>Thời gian</span>
                          <input
                            value={item.duration}
                            onChange={(event) => handleItemChange(item.medication.id, 'duration', event.target.value)}
                            placeholder="VD: 5 ngày"
                          />
                        </label>

                        <label>
                          <span>Số lượng</span>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.quantity}
                            onChange={(event) => handleItemChange(item.medication.id, 'quantity', event.target.value)}
                          />
                        </label>

                        <label className="prescription-fields__wide">
                          <span>Dặn dò</span>
                          <input
                            value={item.instruction}
                            onChange={(event) => handleItemChange(item.medication.id, 'instruction', event.target.value)}
                            placeholder="VD: uống sau ăn"
                          />
                        </label>
                      </div>
                    )}
                  </article>
                  )
                })}
              </div>
            ) : (
              <div className="lab-order-empty">
                <strong>Đơn thuốc đang trống</strong>
                <span>Chọn thuốc ở danh mục bên trái để thêm vào đơn.</span>
              </div>
            )}

            <div className="lab-order-slip__controls">
              <label className="lab-order-note">
                <span>Ghi chú đơn thuốc</span>
                <textarea
                  rows={1}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Dặn dò chung hoặc lưu ý cấp phát..."
                />
              </label>
            </div>
          </aside>
        </div>

        <footer className="lab-order-modal__footer">
          {submitErrorMessage && (
            <div className="lab-order-submit-error">
              {submitErrorMessage}
            </div>
          )}

          <button
            type="button"
            className="exam-save-button"
            disabled={isSubmitting || isCancellingPrescriptions}
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            type="button"
            className="exam-complete-button"
            onClick={handleSubmitPrescription}
            disabled={!items.length || isSubmitting || isCancellingPrescriptions}
          >
            <Send size={16} />
            {isSubmitting
              ? editingPrescriptionId ? 'Đang lưu...' : 'Đang gửi...'
              : editingPrescriptionId ? 'Lưu thay đổi' : 'Gửi đơn thuốc'}
          </button>
        </footer>
      </section>
    </div>
  )
}
