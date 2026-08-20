import { Building2, CheckCircle2, FileText, Hash } from 'lucide-react'

import {
  CatalogCode,
  CatalogHeading,
  CatalogStatusButton,
} from './CatalogTableParts'

export function DepartmentTable({
  departments,
  isLoading,
  pendingStatusChange,
  updatingDepartmentId,
  onStatusChange,
}) {
  return (
    <div className="users-table-scroll">
      <table className="users-table catalog-table department-table">
        <thead>
          <tr>
            <th><CatalogHeading icon={Hash} label="Mã" /></th>
            <th><CatalogHeading icon={Building2} label="Tên khoa" /></th>
            <th><CatalogHeading icon={FileText} label="Mô tả" /></th>
            <th><CatalogHeading icon={CheckCircle2} label="Trạng thái" /></th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan="4">Đang tải...</td>
            </tr>
          )}

          {!isLoading && departments.map((department) => (
            <tr key={department.id}>
              <td><CatalogCode value={department.id} /></td>
              <td>
                <span className="catalog-table__title">
                  <strong>{department.name}</strong>
                </span>
              </td>
              <td>
                <span
                  className="catalog-table__description"
                  title={department.description || 'Chưa cập nhật'}
                >
                  {department.description || 'Chưa cập nhật'}
                </span>
              </td>
              <td>
                <CatalogStatusButton
                  active={department.active}
                  activeTitle="Bấm để ngưng hoạt động khoa"
                  inactiveTitle="Bấm để kích hoạt khoa"
                  disabled={
                    updatingDepartmentId === department.id
                    || pendingStatusChange?.item.id === department.id
                  }
                  onClick={() => onStatusChange(department)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
