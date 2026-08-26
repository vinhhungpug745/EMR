import {
  Activity,
  CalendarClock,
  HeartPulse,
  Ruler,
  Thermometer,
  UserRound,
  Weight,
  Wind,
  X,
} from 'lucide-react'

import { formatVietnamDateTime } from '../../utils/dateTime'

function formatValue(value, unit = '') {
  if (value === null || value === undefined || value === '') {
    return 'Chưa ghi nhận'
  }

  return `${value}${unit ? ` ${unit}` : ''}`
}

function formatBloodPressure(vitalSign) {
  if (!vitalSign?.systolic_bp || !vitalSign?.diastolic_bp) {
    return 'Chưa ghi nhận'
  }

  return `${vitalSign.systolic_bp}/${vitalSign.diastolic_bp} mmHg`
}

export default function VitalSignDetailModal({
  vitalSign,
  isLoading = false,
  error = '',
  onClose,
}) {
  if (!vitalSign) return null

  return (
    <div
      className="nurse-modal-backdrop"
      onMouseDown={onClose}
    >
      <div
        className="nurse-modal vital-detail-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="nurse-modal__header">
          <div className="nurse-modal__heading">
            <div className="nurse-modal__icon">
              <HeartPulse size={20} />
            </div>

            <div>
              <h2>Chi tiết sinh hiệu</h2>

              <p>
                {vitalSign.patient_name || 'Chưa rõ bệnh nhân'}
                {' · '}
                {vitalSign.visit_number || 'Chưa có mã lượt khám'}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="nurse-modal__close"
            onClick={onClose}
            disabled={isLoading}
          >
            <X size={18} />
          </button>
        </header>

        <div className="vital-detail">
          {isLoading && (
            <div className="vital-detail__state">
              <Activity
                size={26}
                className="is-spinning"
              />
              <strong>Đang tải chi tiết...</strong>
            </div>
          )}

          {!isLoading && error && (
            <div className="nurse-modal__error">
              {error}
            </div>
          )}

          {!isLoading && !error && (
            <>
              <section className="vital-detail__meta">
                <DetailMeta
                  icon={<UserRound size={15} />}
                  label="Người ghi"
                  value={vitalSign.recorded_by_detail?.full_name || 'Chưa ghi nhận'}
                />
                <DetailMeta
                  icon={<CalendarClock size={15} />}
                  label="Thời gian đo"
                  value={formatVietnamDateTime(vitalSign.created_at)}
                />
              </section>

              <section className="vital-detail__grid">
                <DetailMetric
                  icon={<Thermometer size={17} />}
                  label="Nhiệt độ"
                  value={formatValue(vitalSign.temperature, '°C')}
                />
                <DetailMetric
                  icon={<Activity size={17} />}
                  label="Mạch"
                  value={formatValue(vitalSign.pulse, 'bpm')}
                />
                <DetailMetric
                  icon={<HeartPulse size={17} />}
                  label="Huyết áp"
                  value={formatBloodPressure(vitalSign)}
                />
                <DetailMetric
                  icon={<Wind size={17} />}
                  label="Nhịp thở"
                  value={formatValue(vitalSign.respiratory_rate, 'lần/phút')}
                />
                <DetailMetric
                  icon={<Ruler size={17} />}
                  label="Chiều cao"
                  value={formatValue(vitalSign.height_cm, 'cm')}
                />
                <DetailMetric
                  icon={<Weight size={17} />}
                  label="Cân nặng"
                  value={formatValue(vitalSign.weight_kg, 'kg')}
                />
              </section>
            </>
          )}
        </div>

        <footer className="nurse-modal__footer">
          <button
            type="button"
            className="button button--secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Đóng
          </button>
        </footer>
      </div>
    </div>
  )
}

function DetailMeta({
  icon,
  label,
  value,
}) {
  return (
    <div className="vital-detail__meta-item">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function DetailMetric({
  icon,
  label,
  value,
}) {
  return (
    <article className="vital-detail__metric">
      <span>
        {icon}
        {label}
      </span>
      <strong>{value}</strong>
    </article>
  )
}
