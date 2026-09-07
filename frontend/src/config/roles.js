import {
  Activity,
  BarChart3,
  Beaker,
  BookOpenText,
  Building2,
  CalendarDays,
  ClipboardList,
  FileClock,
  FileText,
  FlaskConical,
  LayoutDashboard,
  ListChecks,
  Pill,
  Stethoscope,
  UserRound,
  Users,
} from 'lucide-react'

const sharedDashboard = {
  id: 'dashboard',
  label: 'Tổng quan',
  path: '/app',
  icon: LayoutDashboard,
}

export const ROLE_CONFIG = {
  admin: {
    label: 'Quản trị viên',
    greeting: 'Quản trị và vận hành hệ thống',
    description: 'Quản lý tài khoản, nhân sự, danh mục và báo cáo khám ngoại trú.',
    nav: [
      sharedDashboard,
      { id: 'users', label: 'Tài khoản', path: '/app/users', icon: Users },
      { id: 'staff', label: 'Hồ sơ nhân viên', path: '/app/staff', icon: UserRound },
      { id: 'departments', label: 'Khoa', path: '/app/departments', icon: Building2 },
      { id: 'medications', label: 'Danh mục thuốc', path: '/app/medications', icon: Pill },
      { id: 'lab-test-catalogs', label: 'Danh mục xét nghiệm', path: '/app/lab-test-catalogs', icon: FlaskConical },
      { id: 'audit-logs', label: 'Nhật ký hệ thống', path: '/app/audit-logs', icon: FileClock },
      { id: 'reports', label: 'Thống kê, báo cáo', path: '/app/reports', icon: BarChart3 },
    ],
    focus: [
      { label: 'Tài khoản người dùng', value: 'Quản lý', icon: Users },
      { label: 'Hồ sơ nhân viên', value: 'Quản lý', icon: UserRound },
      { label: 'Khoa', value: 'Cập nhật', icon: Building2 },
      { label: 'Danh mục thuốc', value: 'Theo dõi', icon: Pill },
      { label: 'Danh mục xét nghiệm', value: 'Cập nhật', icon: FlaskConical },
      { label: 'Nhật ký truy cập', value: 'Kiểm tra', icon: FileClock },
      { label: 'Thống kê khám ngoại trú', value: 'Xem báo cáo', icon: BarChart3 },
    ],
  },
  receptionist: {
    label: 'Nhân viên tiếp nhận',
    greeting: 'Tiếp nhận và điều phối khám',
    description: 'Tiếp nhận trực tiếp, quản lý hồ sơ bệnh nhân và hàng đợi trong ngày.',
    nav: [
      sharedDashboard,
      { id: 'reception', label: 'Tiếp nhận', path: '/app/reception', icon: ClipboardList },
      { id: 'visits', label: 'Lần đến khám', path: '/app/visits', icon: CalendarDays },
      { id: 'patients', label: 'Bệnh nhân', path: '/app/patients', icon: Users },
    ],
    focus: [
      { label: 'Tiếp nhận', value: 'Tạo lượt khám', icon: ClipboardList },
      { label: 'Lần đến', value: 'Mở danh sách', icon: CalendarDays },
      { label: 'Quản lý', value: 'Bệnh nhân', icon: Users },
    ],
  },
  nurse: {
    label: 'Điều dưỡng',
    greeting: 'Theo dõi sinh hiệu người bệnh',
    description: 'Tiếp nhận hàng đợi điều dưỡng và cập nhật chỉ số lâm sàng.',
    nav: [
      sharedDashboard,
      { id: 'vital-sign-queue', label: 'Chờ đo sinh hiệu', path: '/app/vital-sign-queue', icon: ListChecks },
      { id: 'vital-signs', label: 'Sinh hiệu', path: '/app/vital-signs', icon: Activity },
    ],
    focus: [
      { label: 'Chờ đo sinh hiệu', value: 'Mở hàng đợi', icon: ListChecks },
      { label: 'Phiếu sinh hiệu', value: 'Cập nhật', icon: Activity },
    ],
  },
  doctor: {
    label: 'Bác sĩ',
    greeting: 'Khám và cập nhật bệnh án',
    description: 'Theo dõi hàng đợi, lịch sử điều trị và chỉ định chuyên môn.',
    nav: [
      sharedDashboard,
      { id: 'consultation-queue', label: 'Hàng đợi khám', path: '/app/consultation-queue', icon: ListChecks },
      { id: 'encounters', label: 'Thực hiện khám bệnh', path: '/app/encounters', icon: Stethoscope  },
      { id: 'medical-records', label: 'Hồ sơ bệnh án', path: '/app/medical-records', icon: BookOpenText },
      // { id: 'lab-tests', label: 'Xét nghiệm', path: '/app/lab-tests', icon: FlaskConical },
      // { id: 'prescriptions', label: 'Đơn thuốc', path: '/app/prescriptions', icon: Pill },
    ],
    focus: [
      { label: 'Bệnh nhân chờ khám', value: 'Mở hàng đợi', icon: Stethoscope },
      { label: 'Lượt khám đang thực hiện', value: 'Cập nhật', icon: Stethoscope },
      { label: 'Hồ sơ bệnh án', value: 'Tra cứu', icon: BookOpenText },
    ],
  },
  lab_technician: {
    label: 'Nhân viên xét nghiệm',
    greeting: 'Quản lý chỉ định xét nghiệm',
    description: 'Tiếp nhận mẫu, cập nhật tiến độ và trả kết quả lâm sàng.',
    nav: [
      sharedDashboard,
      { id: 'lab-technician-queue', label: 'Chỉ định mới', path: '/app/lab-technician-queue', icon: Beaker },
      { id: 'lab-progress', label: 'Đang thực hiện', path: '/app/lab-progress', icon: FlaskConical },
      { id: 'lab-results', label: 'Đã có kết quả', path: '/app/lab-results', icon: FileText },
    ],
    focus: [
      { label: 'Chỉ định mới', value: 'Tiếp nhận', icon: Beaker },
      { label: 'Mẫu đang xử lý', value: 'Cập nhật', icon: FlaskConical },
      { label: 'Kết quả hoàn thành', value: 'Tra cứu', icon: FileText },
    ],
  },
}

export function getRoleConfig(role) {
  return ROLE_CONFIG[role] || ROLE_CONFIG.receptionist
}
