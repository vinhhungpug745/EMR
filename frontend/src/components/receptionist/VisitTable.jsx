import { formatVietnamDateTime } from '../../utils/dateTime'

const STATUS_LABELS = {
  checked_in: 'Đã tiếp nhận',
  in_progress: 'Đang khám',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
}

export function VisitTable({ isLoading, loadingVisitId, onEdit, visits }) {
  return (
    <div className="visit-table-wrap">
      <table className="users-table catalog-table visit-table">
        <colgroup>
          <col style={{ width: '16%' }} />
          <col style={{ width: '22%' }} />
          <col style={{ width: '24%' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '20%' }} />
        </colgroup>
        <thead>
          <tr>
            <th>Mã lần đến</th>
            <th>Bệnh nhân</th>
            <th>Lý do đến khám</th>
            <th>Tiếp nhận</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan="5">Đang tải...</td>
            </tr>
          )}

          {!isLoading && visits.map((visit) => (
            <tr
              className="visit-table__row"
              key={visit.id}
              tabIndex={0}
              aria-label={`Cập nhật lần đến khám ${visit.visit_number || visit.id} của ${visit.patient_name || 'bệnh nhân'}`}
              aria-busy={loadingVisitId === visit.id}
              onClick={() => onEdit(visit)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onEdit(visit)
                }
              }}
            >
              <td>
                <span>{visit.visit_number || `#${visit.id}`}</span>
              </td>
              <td>
                <span className="users-table__identity visit-patient">
                  <span>
                    <strong>{visit.patient_name || 'Chưa có tên'}</strong>
                  </span>
                </span>
              </td>
              <td>
                <span className="visit-reason">{visit.reason || 'Chưa ghi nhận'}</span>
              </td>
              <td>{loadingVisitId === visit.id ? 'Đang tải...' : formatVietnamDateTime(visit.arrived_at)}</td>
              <td>
                <VisitStatus status={visit.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function VisitStatus({ status }) {
  return (
    <span className={`visit-status visit-status--${status || 'unknown'}`}>
      <i aria-hidden="true" />
      {STATUS_LABELS[status] || 'Chưa xác định'}
    </span>
  )
}
