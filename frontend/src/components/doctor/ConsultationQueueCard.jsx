import {
  Activity,
  CalendarClock,
  HeartPulse,
  Phone,
  Stethoscope,
  UserRound,
} from 'lucide-react'

import { formatVietnamTime } from '../../utils/dateTime'


function formatVital(value, suffix = '') {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—'
  }

  return `${value}${suffix}`
}


function VitalItem({
  label,
  value,
}) {
  return (
    <div className="doctor-vital-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}


export default function ConsultationQueueCard({
  encounter,
  number,
  onStart,
  isStarting = false,
}) {
  const vitalSign = encounter.latest_vital_sign

  const bloodPressure =
    vitalSign?.systolic_bp &&
    vitalSign?.diastolic_bp
      ? `${vitalSign.systolic_bp}/${vitalSign.diastolic_bp} mmHg`
      : '—'

  return (
    <article className="consultation-queue-card">
      <div className="consultation-queue-card__number">
        {number}
      </div>

      <div className="consultation-queue-card__content">
        <div className="consultation-queue-card__header">
          <div className="consultation-queue-card__identity">
            <strong>
              {encounter.patient_name || 'Chưa rõ bệnh nhân'}
            </strong>

            <small>
              {encounter.visit_number || 'Chưa có mã lượt khám'}
            </small>
          </div>

          <span className="consultation-queue-status">
            <Stethoscope size={13} />
            Chờ khám
          </span>
        </div>


        <div className="consultation-queue-card__meta">
          <span>
            <UserRound size={14} />

            {encounter.department_name ||
              'Chưa phân khoa'}
          </span>

          <span>
            <Phone size={14} />

            {encounter.patient_phone ||
              'Chưa có SĐT'}
          </span>

          <span>
            <CalendarClock size={14} />

            Tiếp nhận {formatVietnamTime(encounter.arrived_at)}
          </span>
        </div>


        <div className="consultation-queue-card__reason">
          <span>Lý do khám</span>

          <p>
            {encounter.reason ||
              encounter.chief_complaint ||
              'Không có thông tin'}
          </p>
        </div>


        <div className="consultation-queue-card__vitals">
          <div className="consultation-queue-card__vitals-title">
            <HeartPulse size={15} />
            <span>Sinh hiệu gần nhất</span>
          </div>

          {vitalSign ? (
            <div className="doctor-vital-grid">
              <VitalItem
                label="Nhiệt độ"
                value={formatVital(
                  vitalSign.temperature,
                  ' °C',
                )}
              />

              <VitalItem
                label="Huyết áp"
                value={bloodPressure}
              />

              <VitalItem
                label="Mạch"
                value={formatVital(
                  vitalSign.pulse,
                  ' bpm',
                )}
              />

              <VitalItem
                label="Nhịp thở"
                value={formatVital(
                  vitalSign.respiratory_rate,
                  ' l/p',
                )}
              />

              <VitalItem
                label="Chiều cao"
                value={formatVital(
                  vitalSign.height_cm,
                  ' cm',
                )}
              />

              <VitalItem
                label="Cân nặng"
                value={formatVital(
                  vitalSign.weight_kg,
                  ' kg',
                )}
              />
            </div>
          ) : (
            <div className="doctor-vitals-empty">
              <Activity size={16} />

              <span>
                Chưa có dữ liệu sinh hiệu.
              </span>
            </div>
          )}
        </div>
      </div>


      <button
        type="button"
        className="doctor-start-button"
        disabled={isStarting}
        onClick={() => onStart(encounter)}
      >
        <Stethoscope size={16} />
        {isStarting ? 'Đang mở...' : 'Bắt đầu khám'}
      </button>
    </article>
  )
}
