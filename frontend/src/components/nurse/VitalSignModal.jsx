import { useEffect, useState } from 'react'
import {
  Activity,
  HeartPulse,
  Ruler,
  Save,
  Stethoscope,
  Thermometer,
  Weight,
  Wind,
  X,
} from 'lucide-react'


const INITIAL_FORM = {
  department: '',
  temperature: '',
  pulse: '',
  systolic_bp: '',
  diastolic_bp: '',
  respiratory_rate: '',
  height_cm: '',
  weight_kg: '',
}


function VitalSignModal({
  departments = [],
  encounter,
  initialVitalSign,
  isLoadingDepartments = false,
  isSubmitting,
  error,
  mode = 'create',
  onClose,
  onDepartmentFocus,
  onSubmit,
}) {
  const isEdit = mode === 'edit'
  const isRecheck = !isEdit && encounter?.status === 'vitals_recheck'
  const [form, setForm] = useState(() => ({
    ...INITIAL_FORM,
    ...normalizeVitalSign(initialVitalSign),
    department: !isEdit && encounter?.department
      ? String(encounter.department)
      : '',
  }))

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSubmitting) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSubmitting, onClose])

  if ((!isEdit && !encounter) || (isEdit && !initialVitalSign)) {
    return null
  }


  function handleChange(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }


  function toNumberOrNull(value) {
    return value === ''
      ? null
      : Number(value)
  }


  function handleSubmit(event) {
    event.preventDefault()

    const measurements = {
      temperature:
        toNumberOrNull(form.temperature),

      pulse:
        toNumberOrNull(form.pulse),

      systolic_bp:
        toNumberOrNull(form.systolic_bp),

      diastolic_bp:
        toNumberOrNull(form.diastolic_bp),

      respiratory_rate:
        toNumberOrNull(form.respiratory_rate),

      height_cm:
        toNumberOrNull(form.height_cm),

      weight_kg:
        toNumberOrNull(form.weight_kg),
    }

    onSubmit(isEdit ? measurements : {
      ...measurements,
      encounter: encounter.id,
      ...(isRecheck ? {} : { department: form.department }),
    })
  }

  const patientName = isEdit ? initialVitalSign.patient_name : encounter.patient_name
  const visitNumber = isEdit ? initialVitalSign.visit_number : encounter.visit_number

  return (
    <div
      className="nurse-modal-backdrop"
      onMouseDown={onClose}
    >
      <div
        className="nurse-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="nurse-modal__header">
          <div className="nurse-modal__heading">
            <div className="nurse-modal__icon">
              <HeartPulse size={20} />
            </div>

            <div>
              <h2>{isEdit ? 'Cập nhật sinh hiệu' : isRecheck ? 'Đo lại sinh hiệu' : 'Đo sinh hiệu'}</h2>

              <p>
                {patientName}
                {' · '}
                {visitNumber}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="nurse-modal__close"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="nurse-vital-form">
            <section className="nurse-vital-section">
              <label className="nurse-vital-field nurse-vital-field--department">
                <span className="nurse-vital-field__label">
                  <Stethoscope size={15} />
                  Khoa khám
                </span>

                {isEdit || isRecheck ? (
                  <div className="nurse-input-unit">
                    <input
                      value={isEdit
                        ? initialVitalSign.encounter_detail?.department_name || 'Chưa phân khoa'
                        : encounter.department_name || 'Chưa phân khoa'}
                      readOnly
                    />
                  </div>
                ) : (
                  <select
                    name="department"
                    value={form.department}
                    required
                    disabled={isSubmitting || isLoadingDepartments}
                    onChange={handleChange}
                    onFocus={onDepartmentFocus}
                    onMouseDown={onDepartmentFocus}
                  >
                    <option value="">
                      {isLoadingDepartments
                        ? 'Đang tải khoa...'
                        : 'Chọn khoa khám'}
                    </option>

                    {departments.map((department) => (
                      <option
                        key={department.id}
                        value={department.id}
                      >
                        {department.name}
                      </option>
                    ))}
                  </select>
                )}
              </label>
            </section>

            <section className="nurse-vital-grid">
              <VitalField
                icon={<Thermometer size={15} />}
                label="Nhiệt độ"
                name="temperature"
                value={form.temperature}
                onChange={handleChange}
                unit="°C"
                step="0.1"
                placeholder="37.0"
              />

              <VitalField
                icon={<Activity size={15} />}
                label="Mạch"
                name="pulse"
                value={form.pulse}
                onChange={handleChange}
                unit="bpm"
                placeholder="80"
              />

              <VitalField
                icon={<Wind size={15} />}
                label="Nhịp thở"
                name="respiratory_rate"
                value={form.respiratory_rate}
                onChange={handleChange}
                unit="lần/phút"
                placeholder="18"
              />

              <div className="nurse-vital-field nurse-vital-field--bp">
                <span className="nurse-vital-field__label">
                  <HeartPulse size={15} />
                  Huyết áp
                </span>

                <div className="nurse-bp">
                  <div className="nurse-input-unit">
                    <input
                      type="number"
                      name="systolic_bp"
                      value={form.systolic_bp}
                      onChange={handleChange}
                      placeholder="120"
                    />
                    <span>mmHg</span>
                  </div>

                  <strong>/</strong>

                  <div className="nurse-input-unit">
                    <input
                      type="number"
                      name="diastolic_bp"
                      value={form.diastolic_bp}
                      onChange={handleChange}
                      placeholder="80"
                    />
                    <span>mmHg</span>
                  </div>
                </div>
              </div>

              <VitalField
                icon={<Ruler size={15} />}
                label="Chiều cao"
                name="height_cm"
                value={form.height_cm}
                onChange={handleChange}
                unit="cm"
                step="0.01"
                placeholder="170"
              />

              <VitalField
                icon={<Weight size={15} />}
                label="Cân nặng"
                name="weight_kg"
                value={form.weight_kg}
                onChange={handleChange}
                unit="kg"
                step="0.01"
                placeholder="65"
              />
            </section>
          </div>

          {error && (
            <div className="nurse-modal__error">
              {getErrorMessage(error)}
            </div>
          )}

          <footer className="nurse-modal__footer">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={isSubmitting}
            >
              <Save size={16} />

              {isSubmitting
                ? 'Đang lưu...'
                : isEdit ? 'Lưu thay đổi' : 'Lưu sinh hiệu'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}


function VitalField({
  icon,
  label,
  unit,
  ...inputProps
}) {
  return (
    <label className="nurse-vital-field">
      <span className="nurse-vital-field__label">
        {icon}
        {label}
      </span>

      <div className="nurse-input-unit">
        <input
          type="number"
          {...inputProps}
        />

        <span>{unit}</span>
      </div>
    </label>
  )
}


export default VitalSignModal

function normalizeVitalSign(vitalSign) {
  if (!vitalSign) return {}

  return Object.fromEntries(
    Object.keys(INITIAL_FORM)
      .filter((key) => key !== 'department')
      .map((key) => [key, vitalSign[key] ?? '']),
  )
}

function getErrorMessage(error) {
  if (typeof error === 'string') return error
  if (error?.data?.detail) return error.data.detail
  if (error?.message) return error.message

  const firstFieldError = Object.values(error?.data || {})[0]
  if (Array.isArray(firstFieldError)) return firstFieldError[0]
  if (typeof firstFieldError === 'string') return firstFieldError
  return 'Không thể lưu sinh hiệu.'
}
