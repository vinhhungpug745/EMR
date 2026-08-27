import { formatVietnamDateTime } from '../../utils/dateTime'

export function LabTechnicianQueueTable({
  orders,
  isLoading,
  onSelectOrder,
}) {
  if (isLoading) {
    return (
      <div className="technician-queue-loading">
        {Array.from({ length: 5 }, (_, index) => (
          <span key={index} />
        ))}
      </div>
    )
  }

  return (
    <div className="users-table-scroll technician-table">
      <table className="users-table lab-technician-table">
        <colgroup>
          <col style={{ width: '14%' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '25%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '17%' }} />
        </colgroup>
        <thead>
          <tr>
            <th>Mã lượt khám</th>
            <th>Bệnh nhân</th>
            <th>Xét nghiệm</th>
            <th>Loại</th>
            <th>Bác sĩ chỉ định</th>
            <th>Thời điểm</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              className="technician-table-row"
              tabIndex={0}
              onClick={() => onSelectOrder(order)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelectOrder(order)
                }
              }}
            >
              <td>
                <span className="users-table__code">
                  {order.encounter_detail?.visit_number || 'Chưa có mã'}
                </span>
              </td>

              <td>
                <span className="technician-patient-cell">
                  <span>
                    <strong>
                      {order.encounter_detail?.patient_name || 'Bệnh nhân chưa rõ'}
                    </strong>
                    <small>
                      {order.encounter_detail?.department_name || 'Chưa có khoa khám'}
                    </small>
                  </span>
                </span>
              </td>

              <td>
                  <span className="technician-test-name">
                    <strong>
                      {order.test_catalog_detail?.name || 'Xét nghiệm chưa rõ'}
                    </strong>
                    {/* <small>
                      {order.test_catalog_detail?.code || 'Chưa có mã xét nghiệm'}
                    </small> */}
                  </span>
                
              </td>

              <td>
                <span className="technician-category-badge">
                  {order.test_catalog_detail?.category || 'Chưa phân loại'}
                </span>
              </td>

              <td className="technician-doctor-cell">
                {order.ordered_by_detail?.full_name || 'Chưa rõ'}
              </td>

              <td className="technician-time-cell">
                {formatVietnamDateTime(order.ordered_at)}
              </td>
            </tr>
          ))}

          {!orders.length && (
            <tr>
              <td colSpan={6} className="users-table__empty">
                <strong>Không có chỉ định đang chờ</strong>
                <span>Danh sách sẽ tự cập nhật khi bác sĩ gửi chỉ định mới.</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
