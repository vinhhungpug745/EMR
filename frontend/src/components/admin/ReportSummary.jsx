const number = new Intl.NumberFormat('vi-VN')

function displayDate(value) {
  return value.split('-').reverse().join('/')
}

export function ReportSummary({ summary, startDate, endDate }) {
  const metrics = [
    ['Số lần đến khám', summary.total_visits, 'Mỗi lần tiếp nhận tính một lần'],
    ['Số bệnh nhân', summary.total_patients, 'Không trùng trong kỳ báo cáo'],
    ['Lượt khám tại khoa', summary.total_encounters, 'Bao gồm các lượt chuyển khoa'],
    ['Lần đến đã hoàn thành', summary.completed_visits, 'Theo trạng thái lần đến'],
  ]

  return (
    <>
      <p className="reports-period">
        Kỳ báo cáo: <strong>{displayDate(startDate)} – {displayDate(endDate)}</strong> · Theo ngày tiếp nhận, giờ Việt Nam.
      </p>
      <section className="reports-metrics" aria-label="Tổng quan kỳ báo cáo">
        {metrics.map(([label, value, hint]) => (
          <article className="reports-metric" key={label}>
            <span>{label}</span>
            <strong>{number.format(value)}</strong>
            <small>{hint}</small>
          </article>
        ))}
      </section>
      <p className="reports-note">
        Một lần đến có thể có nhiều lượt khám tại các khoa. Không tính lần đến hoặc lượt khám đã hủy, ngừng hoạt động. Trạng thái được tính tại thời điểm xem báo cáo.
      </p>
      {summary.total_visits === 0 && (
        <div className="users-table__empty">
          <strong>Chưa có lần đến khám ngoại trú trong kỳ này.</strong>
          <span>Chọn khoảng ngày khác để xem dữ liệu.</span>
        </div>
      )}
    </>
  )
}
