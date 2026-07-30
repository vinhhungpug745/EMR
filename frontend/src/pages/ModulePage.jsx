import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'

import { useAuth } from '../auth/useAuth'
import { getRoleConfig } from '../config/roles'

export function ModulePage() {
  const { moduleId } = useParams()
  const { user } = useAuth()
  const roleConfig = getRoleConfig(user.role)
  const module = roleConfig.nav.find((item) => item.id === moduleId)

  if (!module) {
    return <Navigate to="/app" replace />
  }

  const Icon = module.icon

  return (
    <div className="module-page">
      <header className="page-heading">
        <div>
          <p className="page-heading__context">{roleConfig.label}</p>
          <h1>{module.label}</h1>
          <p>Khu vực nghiệp vụ dành cho {roleConfig.label.toLowerCase()}.</p>
        </div>
      </header>
      <section className="empty-module">
        <span><Icon size={28} /></span>
        <h2>{module.label}</h2>
        <p>Chức năng này đã được phân quyền và sẵn sàng để kết nối API nghiệp vụ.</p>
        <Link className="secondary-button" to="/app">
          <ArrowLeft size={17} />
          Quay lại tổng quan
        </Link>
      </section>
    </div>
  )
}
