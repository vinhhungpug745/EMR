import { useEffect, useState } from 'react'

import {
  CatalogModal,
  FormError,
  FormField,
  ModalFooter,
  StatusField,
} from '../admin/CatalogTableParts'
import { getFieldError } from '../admin/formErrorUtils'
import { formatVietnamDate } from '../../utils/dateTime'

const EMPTY_FORM = {
  blood_type: '',
  allergies: '',
  medical_history: '',
  active: true,
}

const BLOOD_TYPE_OPTIONS = [
  '',
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
]

export function MedicalRecordModal({
  error,
  isSaving,
  medicalRecord,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(() => normalizeRecord(medicalRecord))
  const patient = medicalRecord?.patient_detail

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSaving) onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSaving, onClose])

  function updateField(event) {
    const { name, value, checked, type } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit({
      blood_type: cleanOptional(form.blood_type),
      allergies: cleanOptional(form.allergies),
      medical_history: cleanOptional(form.medical_history),
      active: form.active,
    })
  }

  if (!medicalRecord) return null

  return (
    <CatalogModal
      title="Hồ sơ bệnh án"
      description="Cập nhật thông tin lâm sàng nền của người bệnh."
      labelledBy="medical-record-modal-title"
      onClose={onClose}
    >
      <form className="user-form" onSubmit={handleSubmit}>
        {error && <FormError error={error} fallback="Không thể lưu hồ sơ bệnh án." />}

        <section className="medical-record-profile">
          <div>
            <span>Bệnh nhân</span>
            <strong>{patient?.full_name || 'Chưa rõ bệnh nhân'}</strong>
          </div>
          <div>
            <span>Mã hồ sơ</span>
            <strong>{medicalRecord.record_number}</strong>
          </div>
          <div>
            <span>Ngày sinh</span>
            <strong>{formatVietnamDate(patient?.date_of_birth, 'Chưa có')}</strong>
          </div>
          <div>
            <span>Số điện thoại</span>
            <strong>{patient?.phone || 'Chưa có'}</strong>
          </div>
        </section>

        <div className="user-form__grid medical-record-form-grid">
          <FormField label="Nhóm máu" error={getFieldError(error, 'blood_type')}>
            <select
              name="blood_type"
              value={form.blood_type}
              onChange={updateField}
            >
              <option value="">Chưa ghi nhận</option>
              {BLOOD_TYPE_OPTIONS.filter(Boolean).map((bloodType) => (
                <option key={bloodType} value={bloodType}>
                  {bloodType}
                </option>
              ))}
            </select>
          </FormField>

          <StatusField
            checked={form.active}
            name="active"
            title="Hồ sơ đang hoạt động"
            hint="Cho phép sử dụng hồ sơ trong quy trình khám"
            onChange={updateField}
          />

          <FormField label="Dị ứng" error={getFieldError(error, 'allergies')} wide>
            <textarea
              name="allergies"
              value={form.allergies}
              rows={4}
              placeholder="Ví dụ: dị ứng penicillin, hải sản..."
              onChange={updateField}
            />
          </FormField>

          <FormField label="Tiền sử bệnh" error={getFieldError(error, 'medical_history')} wide>
            <textarea
              name="medical_history"
              value={form.medical_history}
              rows={5}
              placeholder="Ví dụ: tăng huyết áp, đái tháo đường, phẫu thuật trước đây..."
              onChange={updateField}
            />
          </FormField>
        </div>

        <ModalFooter
          isSaving={isSaving}
          saveLabel="Lưu hồ sơ"
          onClose={onClose}
        />
      </form>
    </CatalogModal>
  )
}

function normalizeRecord(record) {
  if (!record) return EMPTY_FORM

  return {
    blood_type: record.blood_type || '',
    allergies: record.allergies || '',
    medical_history: record.medical_history || '',
    active: record.active ?? true,
  }
}

function cleanOptional(value) {
  const normalized = value.trim()
  return normalized || null
}
