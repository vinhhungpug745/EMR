import { FileText, Phone } from 'lucide-react'

import { formatVietnamDate, formatVietnamDateTime } from '../../utils/dateTime'

export function MedicalRecordTable({
  isLoading,
  loadingRecordId,
  medicalRecords,
  onEdit,
}) {
  return (
    <div className="users-table">
      <table className="users-table medical-record-table">
        <colgroup>
          <col style={{ width: '27%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '33%' }} />
        </colgroup>

        <thead>
          <tr>
            <th>Bệnh nhân</th>
            <th>Mã hồ sơ</th>
            <th>Ngày sinh</th>
            <th>Lần khám cuối</th>
            <th>Chẩn đoán gần nhất</th>
          </tr>
        </thead>

        <tbody>
          {isLoading && <LoadingRows />}

          {!isLoading && medicalRecords.map((record) => {
            const patient = record.patient_detail

            return (
              <tr
                className="medical-record-table__row"
                key={record.id}
                tabIndex={loadingRecordId === record.id ? -1 : 0}
                aria-label={`Xem chi tiết bệnh án ${patient?.full_name || record.record_number}`}
                aria-disabled={loadingRecordId === record.id}
                onClick={() => {
                  if (loadingRecordId !== record.id) onEdit(record)
                }}
                onKeyDown={(event) => {
                  if (loadingRecordId === record.id) return
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onEdit(record)
                  }
                }}
              >
                <td>
                  <div className="users-table__identity">
                    <span className="users-table__avatar" aria-hidden="true">
                      {getInitials(patient?.full_name)}
                    </span>

                    <span>
                      <strong>{patient?.full_name || 'Chưa rõ bệnh nhân'}</strong>
                      <small>
                        <Phone size={12} aria-hidden="true" />
                        {patient?.phone || 'Chưa có SĐT'}
                      </small>
                    </span>
                  </div>
                </td>

                <td className="users-table__code">{record.record_number}</td>
                <td>{formatVietnamDate(patient?.date_of_birth, 'Chưa có')}</td>
                <td>
                  <LatestVisit record={record} />
                </td>
                <td>
                  <ClinicalSummary record={record} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function LoadingRows() {
  return Array.from({ length: 5 }, (_, index) => (
    <tr className="users-table__loading" key={index}>
      {Array.from({ length: 5 }, (__, cellIndex) => (
        <td key={cellIndex}><span /></td>
      ))}
    </tr>
  ))
}

function LatestVisit({ record }) {
  const latestVisit = record.latest_visit

  if (!latestVisit) {
    return (
      <span className="medical-record-muted">
        Chưa có lần đến khám
      </span>
    )
  }

  return (
    <span className="medical-record-visit-cell">
      <strong>{formatVietnamDateTime(latestVisit.arrived_at)}</strong>
    </span>
  )
}

function ClinicalSummary({ record }) {
  const latestDiagnosis = record.latest_diagnosis

  if (latestDiagnosis?.diagnosis) {
    return (
      <span className="medical-record-summary">
        <FileText size={14} aria-hidden="true" />
        <span>
          <strong>{latestDiagnosis.diagnosis}</strong>
          <small>{latestDiagnosis.department_name || 'Chưa rõ khoa'}</small>
        </span>
      </span>
    )
  }

  if (record.allergies || record.medical_history) {
    return (
      <span className="medical-record-summary medical-record-summary--baseline">
        <FileText size={14} aria-hidden="true" />
        <span>{getBaselineSummary(record)}</span>
      </span>
    )
  }

  return (
    <span className="medical-record-muted">
      Chưa có chẩn đoán
    </span>
  )
}

function getBaselineSummary(record) {
  if (record.allergies) return `Dị ứng: ${record.allergies}`
  if (record.medical_history) return `Tiền sử: ${record.medical_history}`
  return 'Chưa cập nhật dị ứng/tiền sử'
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
