import {
  Activity,
  Clock3,
  Phone,
  Stethoscope,
  UserRound,
} from 'lucide-react'

import { formatVietnamTime } from '../../utils/dateTime'


function VitalSignQueueTable({
  patients = [],
  isLoading = false,
  onMeasure,
  page = 1,
  pageSize = 8,
}) {
  if (isLoading) {
    return (
      <div className="nurse-state">
        <Activity size={30} />
        <strong>Đang tải hàng đợi...</strong>
      </div>
    )
  }

  if (!patients.length) {
    return (
      <div className="nurse-state">
        <Activity size={32} />

        <strong>
          Không có bệnh nhân chờ đo sinh hiệu
        </strong>

        <span>
          Bệnh nhân sẽ xuất hiện sau khi nhân viên tiếp nhận hoàn tất tiếp nhận.
        </span>
      </div>
    )
  }

  return (
    <div className="vital-sign-queue">
      {patients.map((item, index) => (
        <article
          key={item.id}
          className="vital-sign-queue-card"
        >
          <div className="vital-sign-queue-card__number">
            {(page - 1) * pageSize + index + 1}
          </div>

          <div className="vital-sign-queue-card__content">
            <div className="vital-sign-queue-card__header">
              <div>
                <strong>
                  {item.patient_name}
                </strong>

                <small>
                  {item.visit_number}
                </small>
              </div>

              <span className="nurse-status">
                <Clock3 size={13} />
                Chờ đo sinh hiệu
              </span>
            </div>

            <div className="vital-sign-queue-card__meta">
              <span>
                <UserRound size={14} />
                {item.department_name || 'Chưa phân khoa'}
              </span>

              <span>
                <Phone size={14} />
                {item.patient_phone || 'Chưa có SĐT'}
              </span>

              <span>
                <Clock3 size={14} />
                {formatVietnamTime(item.arrived_at)}
              </span>
            </div>

            <div className="vital-sign-queue-card__reason">
              <span>Lý do khám</span>

              <p>
                {item.reason || item.chief_complaint || 'Không có thông tin'}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="nurse-measure-button"
            onClick={() => onMeasure(item)}
          >
            <Stethoscope size={16} />
            Đo sinh hiệu
          </button>
        </article>
      ))}
    </div>
  )
}

export default VitalSignQueueTable
