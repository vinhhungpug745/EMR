export const AUDIT_ACTIONS = {
  create: 'Tạo mới', view: 'Xem', update: 'Cập nhật', delete: 'Xóa',
  login: 'Đăng nhập', login_failed: 'Đăng nhập thất bại', logout: 'Đăng xuất',
}

export const AUDIT_RESOURCES = {
  User: 'Tài khoản', StaffProfile: 'Hồ sơ nhân viên', Department: 'Khoa',
  Patient: 'Bệnh nhân', Visit: 'Lần đến khám', Encounter: 'Lượt khám',
  MedicalRecord: 'Hồ sơ bệnh án', VitalSign: 'Sinh hiệu', Medication: 'Thuốc',
  Prescription: 'Đơn thuốc', LabTest: 'Xét nghiệm',
  LabTestCatalog: 'Danh mục xét nghiệm', OutpatientReport: 'Báo cáo ngoại trú',
}

export function auditActorName(log) {
  return log.actor_detail?.full_name || log.actor_detail?.username || 'Không xác định'
}
