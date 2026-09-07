export function exportReport(report) {
  const rows = [
    ['Báo cáo khám ngoại trú'],
    ['Từ ngày', report.start_date, 'Đến ngày', report.end_date],
    ['Thống kê theo ngày tiếp nhận; không tính dữ liệu đã hủy hoặc ngừng hoạt động.'],
    ['Số lần đến khám', report.summary.total_visits],
    ['Số bệnh nhân', report.summary.total_patients],
    ['Lượt khám tại khoa', report.summary.total_encounters],
    ['Lần đến đã hoàn thành', report.summary.completed_visits],
    [],
    ['Khoa', 'Số lần đến', 'Lượt khám', 'Chờ khám / sinh hiệu', 'Đang khám', 'Hoàn thành'],
    ...report.departments.map((row) => [row.department_name, row.total_visits, row.total_encounters, row.waiting, row.in_progress, row.completed]),
  ]
  const csv = rows.map((row) => row.map((value) => {
    const text = String(value)
    const safe = /^[=+\-@\t\r\n]/.test(text) ? `'${text}` : text
    return `"${safe.replaceAll('"', '""')}"`
  }).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `bao-cao-ngoai-tru_${report.start_date}_${report.end_date}.csv`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

