import { ArrowRight, CalendarClock, CheckCircle2, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useAuth } from '../auth/useAuth'
import { getRoleConfig } from '../config/roles'

export function DashboardPage() {
  const { user } = useAuth()
  const roleConfig = getRoleConfig(user.role)
  const firstName = user.full_name.trim().split(' ').at(-1)

  return (
    <div className="dashboard">
      <header className="page-heading">
        <div>
          <p className="page-heading__context">{roleConfig.label}</p>
          <h1>Chào {firstName},</h1>
          <p>{roleConfig.description}</p>
        </div>
        <Link className="secondary-button" to={roleConfig.nav[1]?.path || '/app'}>
          Mở công việc chính
          <ArrowRight size={17} />
        </Link>
      </header>

      <section className="focus-grid" aria-label="Truy cập nhanh">
        {roleConfig.focus.map(({ label, value, icon: Icon }, index) => (
          <Link
            className="focus-item"
            key={label}
            to={roleConfig.nav[index + 1]?.path || '/app'}
          >
            <span className="focus-item__icon"><Icon size={21} /></span>
            <span>
              <small>{label}</small>
              <strong>{value}</strong>
            </span>
            <ArrowRight className="focus-item__arrow" size={17} />
          </Link>
        ))}
      </section>

      <div className="dashboard-grid">
        <section className="work-panel">
          <div className="section-heading">
            <div>
              <h2>Công việc hôm nay</h2>
              <p>Các bước chính trong ca làm việc của bạn.</p>
            </div>
            <span className="status-tag status-tag--blue">
              <Clock3 size={14} />
              Đang hoạt động
            </span>
          </div>
          <div className="workflow-list">
            {roleConfig.focus.map((item, index) => (
              <div className="workflow-row" key={item.label}>
                <span className="workflow-row__number">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{item.label}</strong>
                  <small>{item.value} thông tin theo quyền {roleConfig.label.toLowerCase()}.</small>
                </div>
                {index === 0 ? <CalendarClock size={19} /> : <CheckCircle2 size={19} />}
              </div>
            ))}
          </div>
        </section>

        <aside className="shift-panel">
          <div className="section-heading">
            <div>
              <h2>Ca làm việc</h2>
              <p>Thông tin tài khoản hiện tại.</p>
            </div>
          </div>
          <dl className="identity-list">
            <div><dt>Nhân viên</dt><dd>{user.full_name}</dd></div>
            <div><dt>Mã nhân viên</dt><dd>{user.employee_code}</dd></div>
            <div><dt>Đơn vị</dt><dd>{user.department?.name || 'Ban quản trị'}</dd></div>
            <div><dt>Vai trò</dt><dd>{roleConfig.label}</dd></div>
          </dl>
        </aside>
      </div>
    </div>
  )
}
