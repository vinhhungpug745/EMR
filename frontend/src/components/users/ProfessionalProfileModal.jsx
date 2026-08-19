import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'

import {
  createProfessionalProfile,
  getProfessionalProfile,
  updateProfessionalProfile,
} from '../../api/professionalProfiles'
import { getRoleLabel } from '../../config/userOptions'

const PROFILE_FIELDS = {
  doctor: [
    { name: 'specialty', label: 'Chuyên khoa', required: true },
    { name: 'license_number', label: 'Số chứng chỉ hành nghề', required: true },
    { name: 'academic_title', label: 'Học hàm/học vị' },
    { name: 'degree', label: 'Bằng cấp' },
    { name: 'license_issue_date', label: 'Ngày cấp chứng chỉ', type: 'date' },
    { name: 'license_issued_by', label: 'Nơi cấp chứng chỉ' },
    { name: 'practice_start_date', label: 'Ngày bắt đầu hành nghề', type: 'date' },
    { name: 'consultation_room', label: 'Phòng khám' },
    { name: 'scope_of_practice', label: 'Phạm vi hành nghề', type: 'textarea', wide: true },
  ],
  nurse: [
    { name: 'nursing_license_number', label: 'Số chứng chỉ điều dưỡng' },
    { name: 'care_unit', label: 'Đơn vị chăm sóc' },
    { name: 'professional_qualification', label: 'Trình độ chuyên môn' },
    { name: 'professional_rank', label: 'Hạng chức danh' },
    { name: 'practice_start_date', label: 'Ngày bắt đầu hành nghề', type: 'date' },
    { name: 'shift', label: 'Ca trực' },
  ],
  receptionist: [
    { name: 'counter_number', label: 'Quầy tiếp nhận' },
    { name: 'shift', label: 'Ca trực' },
    { name: 'assigned_area', label: 'Khu vực phụ trách' },
    { name: 'career_start_date', label: 'Ngày bắt đầu làm việc', type: 'date' },
    { name: 'handles_health_insurance', label: 'Phụ trách BHYT', type: 'checkbox' },
  ],
  lab_technician: [
    { name: 'laboratory_unit', label: 'Đơn vị xét nghiệm' },
    { name: 'certification_number', label: 'Số chứng chỉ' },
    { name: 'specialization', label: 'Chuyên môn' },
    { name: 'professional_qualification', label: 'Trình độ chuyên môn' },
    { name: 'practice_start_date', label: 'Ngày bắt đầu hành nghề', type: 'date' },
  ],
}

const IGNORED_ERROR_FIELDS = new Set([
  'id',
  'staff',
  'staff_detail',
  'years_of_experience',
  'created_at',
  'updated_at',
])

export default function ProfessionalProfileModal({
  user,
  onClose,
  onSaved,
}) {
  const staff = user?.staff_profile
  const role = staff?.role
  const staffId = staff?.id
  const fields = useMemo(() => PROFILE_FIELDS[role] || [], [role])
  const setupError = !staffId || fields.length === 0
    ? 'Không xác định được hồ sơ nhân viên.'
    : ''
  const [form, setForm] = useState(() => createEmptyForm(fields))
  const [hasProfile, setHasProfile] = useState(false)
  const [isLoading, setIsLoading] = useState(!setupError)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const displayName = user?.full_name || user?.username || 'Nhân viên'

  useEffect(() => {
    if (setupError) return undefined

    let isMounted = true

    async function loadProfile() {
      setIsLoading(true)
      setError('')

      try {
        const data = await getProfessionalProfile(staffId)
        if (!isMounted) return

        setHasProfile(Boolean(data))
        setForm(data ? normalizeProfile(data, fields) : createEmptyForm(fields))
      } catch (err) {
        if (isMounted) setError(err.message || 'Không thể tải hồ sơ chuyên môn.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadProfile()

    return () => {
      isMounted = false
    }
  }, [fields, setupError, staffId])

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

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    setError('')

    try {
      const payload = buildPayload(form, fields)
      const save = hasProfile ? updateProfessionalProfile : createProfessionalProfile
      await save(staffId, payload)
      await onSaved?.()
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="user-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="user-modal professional-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="professional-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="user-modal__header">
          <div>
            <h2 id="professional-modal-title">Hồ sơ chuyên môn</h2>
            <p>{displayName} · {getRoleLabel(role)}</p>
          </div>
          <button className="icon-button" type="button" aria-label="Đóng" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <form className="user-form" onSubmit={handleSubmit}>
          {(setupError || error) && (
            <div className="user-form__error" role="alert">
              {setupError || error}
            </div>
          )}

          {isLoading ? (
            <div className="professional-modal__loading">Đang tải hồ sơ chuyên môn...</div>
          ) : (
            <div className="user-form__grid">
              {fields.map((field) => (
                <ProfessionalField
                  key={field.name}
                  field={field}
                  value={form[field.name]}
                  onChange={updateField}
                />
              ))}
            </div>
          )}

          <footer className="user-modal__footer">
            <button className="secondary-button" type="button" disabled={isSaving} onClick={onClose}>
              Hủy
            </button>
            <button className="primary-button" type="submit" disabled={isLoading || isSaving}>
              {isSaving ? 'Đang lưu...' : hasProfile ? 'Lưu hồ sơ' : 'Tạo hồ sơ'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

function ProfessionalField({ field, value, onChange }) {
  if (field.type === 'checkbox') {
    return (
      <label className="user-form__status professional-modal__status">
        <input
          name={field.name}
          type="checkbox"
          checked={Boolean(value)}
          onChange={onChange}
        />
        <span>
          <strong>{field.label}</strong>
          <small>Bật nếu nhân viên phụ trách nhiệm vụ này</small>
        </span>
      </label>
    )
  }

  return (
    <label className={`user-form__field${field.wide ? ' user-form__field--wide' : ''}`}>
      <span>{field.label}</span>
      {field.type === 'textarea' ? (
        <textarea
          name={field.name}
          value={value || ''}
          required={field.required}
          rows={4}
          onChange={onChange}
        />
      ) : (
        <input
          name={field.name}
          type={field.type || 'text'}
          value={value || ''}
          required={field.required}
          onChange={onChange}
        />
      )}
    </label>
  )
}

function createEmptyForm(fields) {
  return fields.reduce((data, field) => ({
    ...data,
    [field.name]: field.type === 'checkbox' ? false : '',
  }), {})
}

function normalizeProfile(profile, fields) {
  return fields.reduce((data, field) => ({
    ...data,
    [field.name]: profile[field.name] ?? (field.type === 'checkbox' ? false : ''),
  }), {})
}

function buildPayload(form, fields) {
  return fields.reduce((payload, field) => {
    const value = form[field.name]
    payload[field.name] = field.type === 'checkbox'
      ? Boolean(value)
      : value === '' ? null : value
    return payload
  }, {})
}

function getErrorMessage(error) {
  const data = error?.data

  if (!data || typeof data !== 'object') {
    return error?.message || 'Không thể lưu hồ sơ chuyên môn.'
  }

  const firstKey = Object.keys(data).find((key) => !IGNORED_ERROR_FIELDS.has(key))
  const firstValue = firstKey ? data[firstKey] : data.detail

  if (Array.isArray(firstValue)) return firstValue[0]
  if (typeof firstValue === 'string') return firstValue
  return error?.message || 'Không thể lưu hồ sơ chuyên môn.'
}
