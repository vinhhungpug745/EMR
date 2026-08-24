import { Pencil, Thermometer } from 'lucide-react'

function formatDateTime(value) {
  if (!value) return 'Chưa cập nhật'

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatNumber(value, suffix = '') {
  return value === null || value === undefined
    ? '—'
    : `${value}${suffix}`
}

export default function VitalSignTable({
  vitalSigns,
  isLoading,
  onEdit,
}) {
  return (
    <section className="users-table-panel" aria-label="Danh sách sinh hiệu">
      <div className="users-table-scroll">
        <table className="users-table vital-sign-table">
          <colgroup>
            <col style={{ width: '20%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '8%' }} />
          </colgroup>

          <thead>
            <tr>
              <th>Bệnh nhân</th>
              <th>Nhiệt độ</th>
              <th>Huyết áp</th>
              <th>Mạch</th>
              <th>Nhịp thở</th>
              <th>Cân nặng</th>
              <th>Thời gian đo</th>
              <th><span className="sr-only">Thao tác</span></th>
            </tr>
          </thead>

          <tbody>
            {isLoading && <LoadingRows />}

            {!isLoading && vitalSigns.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="users-table__identity">
                    <span>
                      <strong>{item.patient_name || 'Chưa rõ'}</strong>
                      <small>{item.visit_number}</small>
                    </span>
                  </div>
                </td>
                <td>{formatNumber(item.temperature, '°C')}</td>
                <td>
                  {item.systolic_bp && item.diastolic_bp
                    ? `${item.systolic_bp}/${item.diastolic_bp} mmHg`
                    : '—'}
                </td>
                <td>{formatNumber(item.pulse, ' bpm')}</td>
                <td>{formatNumber(item.respiratory_rate, ' l/p')}</td>
                <td>{formatNumber(item.weight_kg, ' kg')}</td>
                <td>{formatDateTime(item.created_at)}</td>
                <td>
                  <div className="users-table__actions">
                    <button
                      className="icon-button"
                      type="button"
                      title="Chỉnh sửa"
                      aria-label={`Chỉnh sửa sinh hiệu ${item.patient_name || ''}`}
                      onClick={() => onEdit(item)}
                    >
                      <Pencil size={17} />
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
      {Array.from({ length: 8 }, (__, cellIndex) => (
        <td key={cellIndex}><span /></td>
      ))}
    </tr>
  ))
}