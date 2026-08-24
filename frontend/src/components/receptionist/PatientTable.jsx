import { CalendarDays, CreditCard, Edit3, Phone, UserRound } from 'lucide-react'

import { CatalogHeading } from '../admin/CatalogTableParts'

export function PatientTable({ isLoading, loadingPatientId, onEdit, patients }) {
  return (
    <div className="users-table-scroll">
      <table className="users-table catalog-table patient-table">
        <colgroup>
          <col style={{ width: '32%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '24%' }} />
          <col style={{ width: '10%' }} />
        </colgroup>
        <thead>
          <tr>
            <th><CatalogHeading icon={UserRound} label="Bệnh nhân" /></th>
            <th><CatalogHeading icon={CalendarDays} label="Ngày sinh" /></th>
            <th><CatalogHeading icon={Phone} label="Điện thoại" /></th>
            <th><CatalogHeading icon={CreditCard} label="Giới tính" /></th>
            <th><span className="sr-only">Thao tác</span></th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan="5">Đang tải...</td>
            </tr>
          )}

          {!isLoading && patients.map((patient) => (
            <tr key={patient.id}>
              <td>
                <span className="users-table__identity">
                  <span className="users-table__avatar">{getInitials(patient.full_name)}</span>
                  <span>
                    <strong>{patient.full_name}</strong>
                    <small>Mã bệnh nhân #{patient.id}</small>
                  </span>
                </span>
              </td>
              <td>{formatDate(patient.date_of_birth)}</td>
              <td>{patient.phone || 'Chưa có'}</td>
              <td>{getGenderLabel(patient.gender)}</td>
              <td>
                <span className="users-table__actions">
                  <button
                    className="icon-button"
                    type="button"
                    title="Cập nhật bệnh nhân"
                    aria-label={`Cập nhật ${patient.full_name}`}
                    disabled={loadingPatientId === patient.id}
                    onClick={() => onEdit(patient)}
                  >
                    <Edit3 size={17} aria-hidden="true" />
                  </button>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
    .toUpperCase() || 'BN'
}

function getGenderLabel(gender) {
  const labels = {
    male: 'Nam',
    female: 'Nữ',
    other: 'Khác',
  }
  return labels[gender] || 'Chưa chọn'
}

function formatDate(value) {
  if (!value) return 'Chưa có'
  const date = new Date(`${value}T00:00:00`)
  return new Intl.DateTimeFormat('vi-VN').format(date)
}
