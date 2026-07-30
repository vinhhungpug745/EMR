import { HeartPulse } from 'lucide-react'

export function Brand({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand--compact' : ''}`}>
      <span className="brand__mark" aria-hidden="true">
        <HeartPulse size={22} strokeWidth={2} />
      </span>
      <span className="brand__copy">
        <strong>EMR Care</strong>
        {!compact && <small>Hồ sơ bệnh án điện tử</small>}
      </span>
    </div>
  )
}
