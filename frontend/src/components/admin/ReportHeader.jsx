import { Download } from 'lucide-react'

export function ReportHeader({ canExport, onExport }) {
  return (
    <header className="users-page__header">
      <div>
        <h1>Thống kê, báo cáo</h1>
        <p>Hoạt động khám ngoại trú</p>
      </div>
      <button className="secondary-button" type="button" disabled={!canExport} onClick={onExport}>
        <Download size={17} aria-hidden="true" /> Xuất CSV
      </button>
    </header>
  )
}
