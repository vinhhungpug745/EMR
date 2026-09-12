import { Edit3, Thermometer } from 'lucide-react'

import { formatVietnamDateTime } from '../../utils/dateTime'

function formatNumber(value, suffix = '') {
  return value === null || value === undefined
    ? '—'
    : `${value}${suffix}`
}

function formatBloodPressure(item) {
  return item.systolic_bp && item.diastolic_bp
    ? `${item.systolic_bp}/${item.diastolic_bp} mmHg`
    : '—'
}

export default function VitalSignTable({
  vitalSigns,
  isLoading,
  loadingVitalSignId,
  onEdit,
}) {
  return (
    <section className="users-table-panel" aria-label="Danh sách sinh hiệu">
      <div className="users-table-scroll">
        <table className="users-table vital-sign-table">
          <colgroup>
            <col style={{ width: '28%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '8%' }} />
          </colgroup>

          <thead>
            <tr>
              <th>Bệnh nhân</th>
              <th>Mã lượt khám</th>
              <th>Tóm tắt</th>
              <th>Người ghi</th>
              <th>Thời gian đo</th>
              <th><span className="sr-only">Thao tác</span></th>
            </tr>
          </thead>

          <tbody>
            {isLoading && <LoadingRows />}

            {!isLoading && vitalSigns.map((item) => (
              <tr
                key={item.id}
                className="users-table__clickable-row"
                tabIndex={0}
                aria-label={`Cập nhật sinh hiệu của ${item.patient_name || 'bệnh nhân'}`}
                aria-busy={loadingVitalSignId === item.id}
                onClick={() => onEdit(item)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onEdit(item)
                  }
                }}
              >
                <td>
                  <div className="users-table__identity">
                    <span>
                      <strong>{item.patient_name || 'Chưa rõ'}</strong>
                      <small>{item.encounter_detail?.chief_complaint || 'Sinh hiệu'}</small>
                    </span>
                  </div>
                </td>
                <td>{item.visit_number || '—'}</td>
                <td>
                  <span className="vital-summary">
                    {formatNumber(item.temperature, '°C')}
                    {' · '}
                    {formatBloodPressure(item)}
                  </span>
                </td>
                <td>{item.recorded_by_detail?.full_name || '—'}</td>
                <td>
                  {loadingVitalSignId === item.id
                    ? 'Đang tải...'
                    : formatVietnamDateTime(item.created_at)}
                </td>
                <td>
                  <div className="users-table__actions">
                    <button
                      className="icon-button"
                      type="button"
                      title="Cập nhật sinh hiệu"
                      aria-label={`Cập nhật sinh hiệu ${item.patient_name || ''}`}
                      disabled={loadingVitalSignId === item.id}
                      onClick={(event) => {
                        event.stopPropagation()
                        onEdit(item)
                      }}
                    >
                      <Edit3 size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!isLoading && vitalSigns.length === 0 && (
        <div className="users-table__empty">
          <Thermometer size={28} aria-hidden="true" />
          <strong>Chưa có bản ghi sinh hiệu</strong>
          <span>Thử thay đổi từ khóa tìm kiếm hoặc đo sinh hiệu cho bệnh nhân trước.</span>
        </div>
      )}
    </section>
  )
}

function LoadingRows() {
  return Array.from({ length: 5 }, (_, index) => (
    <tr className="users-table__loading" key={index}>
      {Array.from({ length: 6 }, (__, cellIndex) => (
        <td key={cellIndex}><span /></td>
      ))}
    </tr>
  ))
}
