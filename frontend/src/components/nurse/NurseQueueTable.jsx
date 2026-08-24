import {
  Activity,
  Clock3,
  Phone,
  Stethoscope,
  UserRound,
} from 'lucide-react'


function formatTime(value) {
  if (!value) {
    return '--:--'
  }

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}


function NurseQueueTable({
  patients = [],
  isLoading = false,
  onMeasure,
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
    <div className="nurse-queue">
      {patients.map((item, index) => (
        <article
          key={item.id}
          className="nurse-queue-card"
        >
          <div className="nurse-queue-card__number">
            {index + 1}
          </div>

          <div className="nurse-queue-card__content">
            <div className="nurse-queue-card__header">
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

            <div className="nurse-queue-card__meta">
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
                {formatTime(item.arrived_at)}
              </span>
            </div>

            <div className="nurse-queue-card__reason">
              <span>Lý do khám</span>

              <p>
                {item.reason ||
                  item.chief_complaint ||
                  'Không có thông tin'}
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

export default NurseQueueTable