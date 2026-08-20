import { Beaker, CheckCircle2, FileText, FlaskConical, Hash, TestTube2 } from 'lucide-react'

import {
  CatalogCode,
  CatalogHeading,
  CatalogStatusButton,
} from './CatalogTableParts'

export function LabTestTable({
  labTests,
  isLoading,
  pendingStatusChange,
  updatingId,
  onStatusChange,
}) {
  return (
    <div className="users-table-scroll">
      <table className="users-table catalog-table lab-catalog-table">
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
            <th><CatalogHeading icon={FlaskConical} label="Tên xét nghiệm" /></th>
            <th><CatalogHeading icon={Beaker} label="Nhóm" /></th>
            <th><CatalogHeading icon={TestTube2} label="Mẫu bệnh phẩm" /></th>
            <th><CatalogHeading icon={FileText} label="Mô tả" /></th>
            <th><CatalogHeading icon={CheckCircle2} label="Trạng thái" /></th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan="6">Đang tải...</td>
            </tr>
          )}

          {!isLoading && labTests.map((test) => (
            <tr key={test.id}>
              <td><CatalogCode value={test.code} /></td>
              <td>
                <span className="catalog-table__title">
                  <strong>{test.name}</strong>
                </span>
              </td>
              <td>{test.category || 'Chưa phân loại'}</td>
              <td>{test.specimen_type || 'Chưa cập nhật'}</td>
              <td>
                <span
                  className="catalog-table__description"
                  title={test.description || 'Chưa cập nhật'}
                >
                  {test.description || 'Chưa cập nhật'}
                </span>
              </td>
              <td>
                <CatalogStatusButton
                  active={test.active}
                  activeTitle="Bấm để ngưng hoạt động"
                  inactiveTitle="Bấm để kích hoạt"
                  disabled={updatingId === test.id || pendingStatusChange?.item.id === test.id}
                  onClick={() => onStatusChange(test)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
