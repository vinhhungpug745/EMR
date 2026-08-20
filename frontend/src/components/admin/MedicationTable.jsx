import { CheckCircle2, FileText, Hash, Package, Pill, Route } from 'lucide-react'

import {
  CatalogCode,
  CatalogHeading,
  CatalogStatusButton,
} from './CatalogTableParts'

export function MedicationTable({
  medications,
  isLoading,
  pendingStatusChange,
  updatingId,
  onStatusChange,
  getRouteLabel,
}) {
  return (
    <div className="users-table-scroll">
      <table className="users-table catalog-table medication-table">
        <colgroup>
          <col style={{ width: '15%' }} />  
          <col style={{ width: '18%' }} />   
          <col style={{ width: '18%' }} />   
          <col style={{ width: '15%' }} />   
          <col style={{ width: '15%' }} />   
          <col style={{ width: '20%' }} />   
        </colgroup>
        <thead>
          <tr>
            <th><CatalogHeading icon={Hash} label="Mã" /></th>
            <th><CatalogHeading icon={Pill} label="Tên thuốc" /></th>
            <th><CatalogHeading icon={FileText} label="Hoạt chất" /></th>
            <th><CatalogHeading icon={Package} label="Hàm lượng" /></th>
            <th><CatalogHeading icon={Route} label="Đường dùng" /></th>
            <th><CatalogHeading icon={CheckCircle2} label="Trạng thái" /></th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan="6">Đang tải...</td>
            </tr>
          )}

          {!isLoading && medications.map((medication) => (
            <tr key={medication.id}>
              <td><CatalogCode value={medication.code} /></td>
              <td>
                <span className="catalog-table__title">
                  <strong>{medication.name}</strong>
                </span>
              </td>
              <td>
                <span className="catalog-table__description" title={medication.active_ingredient}>
                  {medication.active_ingredient}
                </span>
              </td>
              <td>{medication.strength} / {medication.unit}</td>
              <td>{getRouteLabel(medication.route)}</td>
              <td>
                <CatalogStatusButton
                  active={medication.active}
                  activeTitle="Bấm để ngưng hoạt động"
                  inactiveTitle="Bấm để kích hoạt"
                  disabled={updatingId === medication.id || pendingStatusChange?.item.id === medication.id}
                  onClick={() => onStatusChange(medication)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
