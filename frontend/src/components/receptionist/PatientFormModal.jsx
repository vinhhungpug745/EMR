import { useEffect, useState } from 'react'

import {
  CatalogModal,
  FormError,
  FormField,
  ModalFooter,
  StatusField,
} from '../admin/CatalogTableParts'
import { getFieldError } from '../admin/formErrorUtils'

const GENDER_OPTIONS = [
  { value: '', label: 'Chưa chọn' },
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' },
]

const EMPTY_FORM = {
  full_name: '',
  date_of_birth: '',
  gender: '',
  phone: '',
  email: '',
  address: '',
  citizen_id: '',
  health_insurance_code: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  active: true,
}

export function PatientFormModal({
  error,
  initialPatient,
  isSaving,
  mode = 'create',
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    ...normalizePatient(initialPatient),
  }))

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSaving) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSaving, onClose])

  function updateField(event) {
    const { name, value, checked, type } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit({
      full_name: form.full_name.trim(),
      date_of_birth: form.date_of_birth,
      gender: form.gender || null,
      phone: cleanOptional(form.phone),
      email: cleanOptional(form.email),
      address: cleanOptional(form.address),
      citizen_id: cleanOptional(form.citizen_id),
      health_insurance_code: cleanOptional(form.health_insurance_code),
      emergency_contact_name: cleanOptional(form.emergency_contact_name),
      emergency_contact_phone: cleanOptional(form.emergency_contact_phone),
      active: form.active,
    })
  }

  const isEdit = mode === 'edit'

  return (
    <CatalogModal
      title={isEdit ? 'Cập nhật bệnh nhân' : 'Thêm bệnh nhân mới'}
      description="Quản lý thông tin hành chính, bảo hiểm và liên hệ khẩn cấp."
      labelledBy="patient-modal-title"
      onClose={onClose}
    >
      <form className="user-form" onSubmit={handleSubmit}>
        {error && <FormError error={error} fallback="Không thể lưu thông tin bệnh nhân." />}
        <div className="user-form__grid">
          <FormField label="Họ và tên" error={getFieldError(error, 'full_name')}>
            <input
              name="full_name"
              value={form.full_name}
              required
              autoFocus
              onChange={updateField}
            />
          </FormField>
          <FormField label="Ngày sinh" error={getFieldError(error, 'date_of_birth')}>
            <input
              name="date_of_birth"
              type="date"
              value={form.date_of_birth}
              required
              onChange={updateField}
            />
          </FormField>
          <FormField label="Giới tính" error={getFieldError(error, 'gender')}>
            <select name="gender" value={form.gender} onChange={updateField}>
              {GENDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Số điện thoại" error={getFieldError(error, 'phone')}>
            <input name="phone" value={form.phone} inputMode="tel" onChange={updateField} />
          </FormField>
          <FormField label="Email" error={getFieldError(error, 'email')}>
            <input name="email" value={form.email} type="email" onChange={updateField} />
          </FormField>
          <FormField label="CCCD/CMND" error={getFieldError(error, 'citizen_id')}>
            <input name="citizen_id" value={form.citizen_id} onChange={updateField} />
          </FormField>
          <FormField label="Mã bảo hiểm" error={getFieldError(error, 'health_insurance_code')}>
            <input name="health_insurance_code" value={form.health_insurance_code} onChange={updateField} />
          </FormField>
          <StatusField
            checked={form.active}
            name="active"
            title="Hồ sơ đang hoạt động"
            hint="Cho phép dùng hồ sơ này khi tiếp nhận"
            onChange={updateField}
          />
          <FormField label="Địa chỉ" error={getFieldError(error, 'address')} wide>
            <textarea name="address" value={form.address} rows={3} onChange={updateField} />
          </FormField>
          <FormField label="Người liên hệ khẩn cấp" error={getFieldError(error, 'emergency_contact_name')}>
            <input name="emergency_contact_name" value={form.emergency_contact_name} onChange={updateField} />
          </FormField>
          <FormField label="SĐT liên hệ khẩn cấp" error={getFieldError(error, 'emergency_contact_phone')}>
            <input
              name="emergency_contact_phone"
              value={form.emergency_contact_phone}
              inputMode="tel"
              onChange={updateField}
            />
          </FormField>
        </div>
        <ModalFooter isSaving={isSaving} saveLabel={isEdit ? 'Lưu thay đổi' : 'Tạo bệnh nhân'} onClose={onClose} />
      </form>
    </CatalogModal>
  )
}

function cleanOptional(value) {
  const normalized = value.trim()
  return normalized || null
}

function normalizePatient(patient) {
  if (!patient) return {}

  return Object.fromEntries(
    Object.entries(EMPTY_FORM).map(([key, fallback]) => [key, patient[key] ?? fallback]),
  )
}
