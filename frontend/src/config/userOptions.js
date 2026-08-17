export const USER_ROLE_OPTIONS = [
  { value: 'admin', label: 'Quản trị viên' },
  { value: 'receptionist', label: 'Nhân viên tiếp nhận' },
  { value: 'nurse', label: 'Điều dưỡng' },
  { value: 'doctor', label: 'Bác sĩ' },
  { value: 'lab_technician', label: 'Nhân viên xét nghiệm' },
]

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' },
]

export const USER_STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'inactive', label: 'Đã khóa' },
]

export const USER_ORDERING_OPTIONS = [
  { value: 'username', label: 'Tên đăng nhập A-Z' },
  { value: '-username', label: 'Tên đăng nhập Z-A' },
  { value: '-date_joined', label: 'Tài khoản mới nhất' },
  { value: 'date_joined', label: 'Tài khoản cũ nhất' },
]

export function getRoleLabel(role) {
  return USER_ROLE_OPTIONS.find((option) => option.value === role)?.label
    || 'Chưa xác định'
}
