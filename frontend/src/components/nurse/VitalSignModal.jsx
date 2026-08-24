import { useEffect, useState } from 'react'
import {
  Activity,
  HeartPulse,
  Ruler,
  Save,
  Thermometer,
  Weight,
  Wind,
  X,
} from 'lucide-react'


const INITIAL_FORM = {
  temperature: '',
  pulse: '',
  systolic_bp: '',
  diastolic_bp: '',
  respiratory_rate: '',
  height_cm: '',
  weight_kg: '',
}


function VitalSignModal({
  encounter,
  isSubmitting,
  error,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(INITIAL_FORM)


  useEffect(() => {
    if (encounter) {
      setForm(INITIAL_FORM)
    }
  }, [encounter])


  if (!encounter) {
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

    onSubmit({
      encounter: encounter.id,

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
    })
  }


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
              <h2>Đo sinh hiệu</h2>

              <p>
                {encounter.patient_name}
                {' · '}
                {encounter.visit_number}
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
          <div className="nurse-vital-grid">
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

            <div className="nurse-vital-field nurse-vital-field--wide">
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
              icon={<Wind size={15} />}
              label="Nhịp thở"
              name="respiratory_rate"
              value={form.respiratory_rate}
              onChange={handleChange}
              unit="lần/phút"
              placeholder="18"
            />

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
          </div>

          {error && (
            <div className="nurse-modal__error">
              {error}
            </div>
          )}

          <footer className="nurse-modal__footer">
            <button
              type="button"
              className="button button--secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>

            <button
              type="submit"
              className="button button--primary"
              disabled={isSubmitting}
            >
              <Save size={16} />

              {isSubmitting
                ? 'Đang lưu...'
                : 'Lưu sinh hiệu'}
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