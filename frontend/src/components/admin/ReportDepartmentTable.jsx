const number = new Intl.NumberFormat('vi-VN')

export function ReportDepartmentTable({ departments }) {
  const largest = Math.max(1, ...departments.map((row) => row.total_encounters))

  return (
    <section className="users-table-panel reports-departments">
      <header>
        <h2>Lượt khám theo khoa</h2>
        <p>Số lần đến tại từng khoa được đếm riêng; tổng các khoa có thể lớn hơn số lần đến toàn cơ sở.</p>
      </header>
      <div className="reports-table-scroll">
        <table className="reports-table">
          <thead>
            <tr>
              <th scope="col">Khoa khám</th>
              <th scope="col">Số lần đến</th>
              <th scope="col">Lượt khám</th>
              <th scope="col">Chờ khám / sinh hiệu</th>
              <th scope="col">Đang khám</th>
              <th scope="col">Hoàn thành</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((row) => (
              <tr key={row.department_id ?? 'unassigned'}>
                <th scope="row">
                  {row.department_name}
                  <span className="reports-bar" aria-hidden="true">
                    <span style={{ width: `${row.total_encounters / largest * 100}%` }} />
                  </span>
                </th>
                <td>{number.format(row.total_visits)}</td>
                <td><strong>{number.format(row.total_encounters)}</strong></td>
                <td>{number.format(row.waiting)}</td>
                <td>{number.format(row.in_progress)}</td>
                <td>{number.format(row.completed)}</td>
              </tr>
            ))}
            {!departments.length && <tr><td colSpan={6}>Chưa có dữ liệu khoa khám.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}
