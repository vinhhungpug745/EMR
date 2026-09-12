import { useEffect, useState } from 'react'

import {
  CatalogModal,
  FormError,
  FormField,
  ModalFooter,
} from '../admin/CatalogTableParts'
import { getFieldError } from '../admin/formErrorUtils'

const EMPTY_FORM = {
  arrived_at: '',
  reason: '',
  note: '',
}

export function VisitFormModal({ error, initialVisit, isSaving, onClose, onSubmit }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    ...normalizeVisit(initialVisit),
  }))

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSaving) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSaving, onClose])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit({
      arrived_at: form.arrived_at,
      reason: form.reason.trim(),
      note: form.note.trim() || null,
    })
  }

  const patientName = initialVisit.medical_record_detail?.patient_detail?.full_name || 'Chưa có tên'

  return (
    <CatalogModal
      title="Cập nhật lần đến khám"
      description={`${initialVisit.visit_number} · ${patientName}`}
      labelledBy="visit-modal-title"
      onClose={onClose}
    >
      <form className="user-form" onSubmit={handleSubmit}>
        {error && <FormError error={error} fallback="Không thể cập nhật lần đến khám." />}
        <div className="user-form__grid">
          <FormField label="Bệnh nhân">
            <input value={patientName} readOnly />
          </FormField>
          <FormField label="Loại khám">
            <input value={initialVisit.visit_type_display || 'Ngoại trú'} readOnly />
          </FormField>
          <FormField label="Thời gian đến" error={getFieldError(error, 'arrived_at')}>
            <input
              name="arrived_at"
              type="datetime-local"
              value={form.arrived_at}
              required
              autoFocus
              onChange={updateField}
            />
          </FormField>
          <FormField label="Lý do đến khám" error={getFieldError(error, 'reason')}>
            <input
              name="reason"
              value={form.reason}
              required
              maxLength={255}
              onChange={updateField}
            />
          </FormField>
          <FormField label="Ghi chú" error={getFieldError(error, 'note')} wide>
            <textarea name="note" value={form.note} rows={4} onChange={updateField} />
          </FormField>
        </div>
        <ModalFooter isSaving={isSaving} saveLabel="Lưu thay đổi" onClose={onClose} />
      </form>
    </CatalogModal>
  )
}

function normalizeVisit(visit) {
  if (!visit) return {}

  return {
    arrived_at: toLocalInputValue(visit.arrived_at),
    reason: visit.reason || '',
    note: visit.note || '',
  }
}

function toLocalInputValue(value) {
  if (!value) return ''

  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}
