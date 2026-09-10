import { useState } from 'react'

import {
  Activity,
  ArrowLeft,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  Edit3,
  FileText,
  FlaskConical,
  HeartPulse,
  Pill,
  Stethoscope,
  UserRound,
} from 'lucide-react'

import { formatVietnamDate, formatVietnamDateTime } from '../../utils/dateTime'

export function MedicalRecordDetail({medicalRecord,onBack,onEdit,}) {
  const patient = medicalRecord.patient_detail
  const visits = medicalRecord.visits || []
  const latestVisit = visits[0]
  const [selectedVisitId, setSelectedVisitId] = useState(latestVisit?.id || null)
  const selectedVisit = (
    visits.find((visit) => visit.id === selectedVisitId) ||
    latestVisit ||
    null
  )
  const totalEncounters = visits.reduce(
    (total, visit) => total + (visit.encounters?.length || 0),
    0,
  )

  return (
    <div className="medical-record-detail">
      <header className="medical-record-detail__header">
        <button
          className="secondary-button"
          type="button"
          onClick={onBack}
        >
          <ArrowLeft size={17} />
          Quay lại
        </button>

        <div className="medical-record-detail__actions">
          {/* <button
            className="secondary-button"
            type="button"
            onClick={() => window.print()}
          >
            <FileText size={17} />
            Xuất hồ sơ
          </button> */}

          <button
            className="primary-button"
            type="button"
            onClick={onEdit}
          >
            <Edit3 size={17} />
            Cập nhật thông tin nền
          </button>
        </div>
      </header>

      <section className="medical-record-hero">
        <div className="medical-record-identity">
          <span className="medical-record-identity__avatar">
            {getInitials(patient?.full_name)}
          </span>
          <div>
            <div className="medical-record-hero__eyebrow">
              <FileText size={15} />
              {medicalRecord.record_number}
            </div>
            <h1>{patient?.full_name || 'Chưa rõ bệnh nhân'}</h1>
            <p>
              {formatVietnamDate(patient?.date_of_birth, 'Chưa có ngày sinh')}
              {' · '}
              {patient?.phone || 'Chưa có SĐT'}
            </p>
          </div>
        </div>

        <div className="medical-record-alerts">
          <InfoTile label="Nhóm máu" value={medicalRecord.blood_type || 'Chưa ghi nhận'} />
          <InfoTile label="Dị ứng" value={medicalRecord.allergies || 'Không ghi nhận'} tone="danger" />
          <InfoTile label="Tiền sử" value={medicalRecord.medical_history || 'Không ghi nhận'} />
          <InfoTile label="Lần đến khám" value={visits.length} />
          <InfoTile label="Lượt khám" value={totalEncounters} />
          <InfoTile
            label="Gần nhất"
            value={latestVisit ? formatVietnamDate(latestVisit.arrived_at) : 'Chưa có'}
          />
        </div>
      </section>

      <section className="medical-record-workspace">
        <aside className="medical-record-visit-rail">
          <div className="medical-record-section-title">
            <CalendarClock size={18} />
            <h2>Lịch sử khám bệnh</h2>
          </div>

          {!visits.length && (
            <div className="medical-record-empty medical-record-empty--compact">
              <ClipboardList size={24} />
              <strong>Chưa có lần đến khám</strong>
              <span>Bệnh án sẽ được bổ sung khi bệnh nhân được tiếp nhận.</span>
            </div>
          )}

          <div className="medical-record-visit-list">
            {visits.map((visit) => (
              <VisitRailItem
                isActive={visit.id === selectedVisit?.id}
                key={visit.id}
                onSelect={() => setSelectedVisitId(visit.id)}
                visit={visit}
              />
            ))}
          </div>
        </aside>

        <div className="medical-record-encounter-area">
          {!visits.length && (
            <div className="medical-record-empty">
              <ClipboardList size={28} />
              <strong>Chưa có lần đến khám</strong>
              <span>Bệnh án sẽ được bổ sung khi bệnh nhân được tiếp nhận.</span>
            </div>
          )}

          {selectedVisit && (
            <VisitTimelineItem
              key={selectedVisit.id}
              visit={selectedVisit}
            />
          )}
        </div>
      </section>
    </div>
  )
}

function VisitRailItem({
  isActive,
  onSelect,
  visit,
}) {
  const encounters = visit.encounters || []

  return (
    <button
      className={`visit-rail-item ${isActive ? 'visit-rail-item--active' : ''}`}
      type="button"
      aria-current={isActive ? 'true' : undefined}
      onClick={onSelect}
    >
      <span className="visit-rail-item__dot" />
      <div>
        <strong>{formatVietnamDate(visit.arrived_at)}</strong>
        <p>{visit.reason || visit.visit_type_display || visit.visit_number}</p>
        <small>
          <Stethoscope size={13} />
          {encounters.length} lượt khám
        </small>
      </div>
    </button>
  )
}

function VisitTimelineItem({ visit }) {
  const encounters = visit.encounters || []

  return (
    <article className="visit-timeline-item">
      <div className="visit-card">
        <header className="visit-card__header">
          <div>
            <span>
              <CalendarDays size={14} />
              {visit.visit_number}
            </span>
            <h3>{visit.reason || 'Chưa ghi nhận lý do khám'}</h3>
            <p>
              Tiếp nhận {formatVietnamDateTime(visit.arrived_at)}
              {' · '}
              {visit.visit_type_display}
            </p>
          </div>

          <strong className={`status-label status-label--${visit.status === 'cancelled' ? 'inactive' : 'active'}`}>
            <i aria-hidden="true" />
            {visit.status_display}
          </strong>
        </header>

        <div className="encounter-list">
          {!encounters.length && (
            <div className="encounter-empty">
              Chưa có lượt khám trong lần đến này.
            </div>
          )}

          {encounters.map((encounter) => (
            <EncounterPanel
              key={encounter.id}
              encounter={encounter}
            />
          ))}
        </div>
      </div>
    </article>
  )
}

function EncounterPanel({ encounter }) {
  const latestVitalSign = encounter.vital_signs?.[0]
  const activePrescriptions = (encounter.prescriptions || [])
    .filter((prescription) => prescription.status !== 'cancelled')

  return (
    <section className="encounter-panel">
      <header className="encounter-panel__header">
        <div>
          <span>
            <Stethoscope size={14} />
            {encounter.department_name || 'Chưa phân khoa'}
          </span>
          <h4>{encounter.chief_complaint || 'Lượt khám'}</h4>
        </div>

        <div className="encounter-panel__doctor">
          <UserRound size={14} />
          {encounter.doctor_name || 'Chưa chỉ định bác sĩ'}
        </div>
      </header>

      <div className="encounter-grid">
        <ClinicalBlock
          icon={<HeartPulse size={16} />}
          title="Sinh hiệu"
          empty="Chưa đo sinh hiệu"
        >
          {latestVitalSign && (
            <div className="vital-chip-grid">
              <VitalChip label="Nhiệt độ" value={formatVital(latestVitalSign.temperature, '°C')} />
              <VitalChip label="Huyết áp" value={formatBloodPressure(latestVitalSign)} />
              <VitalChip label="Mạch" value={formatVital(latestVitalSign.pulse, 'bpm')} />
              <VitalChip label="Nhịp thở" value={formatVital(latestVitalSign.respiratory_rate, 'l/p')} />
            </div>
          )}
        </ClinicalBlock>

        <ClinicalBlock
          icon={<FileText size={16} />}
          title="Kết luận khám"
          empty="Chưa có chẩn đoán"
        >
          {encounter.diagnosis && (
            <div className="clinical-text">
              <strong>Chẩn đoán</strong>
              <p>{encounter.diagnosis}</p>
              {encounter.treatment_plan && (
                <>
                  <strong>Hướng điều trị</strong>
                  <p>{encounter.treatment_plan}</p>
                </>
              )}
            </div>
          )}
        </ClinicalBlock>

        <ClinicalBlock
          icon={<FlaskConical size={16} />}
          title="Xét nghiệm"
          empty="Chưa có chỉ định xét nghiệm"
        >
          {!!encounter.lab_tests?.length && (
            <ul className="clinical-list">
              {encounter.lab_tests.map((test) => (
                <li key={test.id}>
                  <strong>{test.name}</strong>
                  <span>{test.status_display}</span>
                </li>
              ))}
            </ul>
          )}
        </ClinicalBlock>

        <ClinicalBlock
          icon={<Pill size={16} />}
          title="Đơn thuốc"
          empty="Chưa có đơn thuốc"
        >
          {!!activePrescriptions.length && (
            <ul className="clinical-list">
              {activePrescriptions.flatMap((prescription) => (
                prescription.items.map((item) => (
                  <li key={`${prescription.id}-${item.id}`}>
                    <strong>{item.medication_name || 'Thuốc'}</strong>
                    <span>{[prescription.status_display, item.dosage, item.frequency, item.duration].filter(Boolean).join(' · ')}</span>
                  </li>
                ))
              ))}
            </ul>
          )}
        </ClinicalBlock>
      </div>
    </section>
  )
}

function ClinicalBlock({
  children,
  empty,
  icon,
  title,
}) {
  const hasContent = Boolean(children)

  return (
    <article className="clinical-block">
      <h5>
        {icon}
        {title}
      </h5>
      {hasContent ? children : (
        <div className="clinical-empty">
          <Activity size={14} />
          {empty}
        </div>
      )}
    </article>
  )
}

function InfoTile({ label, tone, value }) {
  return (
    <div className={`medical-record-info-tile ${tone ? `medical-record-info-tile--${tone}` : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'BA'
}

function VitalChip({ label, value }) {
  return (
    <span className="vital-chip">
      <small>{label}</small>
      <strong>{value}</strong>
    </span>
  )
}

function formatVital(value, unit) {
  if (value === null || value === undefined || value === '') return '—'
  return `${value} ${unit}`
}

function formatBloodPressure(vitalSign) {
  if (!vitalSign?.systolic_bp || !vitalSign?.diastolic_bp) return '—'
  return `${vitalSign.systolic_bp}/${vitalSign.diastolic_bp} mmHg`
}
