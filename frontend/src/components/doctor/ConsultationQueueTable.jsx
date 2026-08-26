import {
  Stethoscope,
  UsersRound,
} from 'lucide-react'

import ConsultationQueueCard from './ConsultationQueueCard'


export default function ConsultationQueueTable({
  encounters = [],
  isLoading = false,
  onStart,
  startingId = null,
  page = 1,
  pageSize = 8,
}) {
  if (isLoading) {
    return (
      <div className="consultation-queue-state">
        <Stethoscope
          size={32}
          className="is-spinning"
        />

        <strong>
          Đang tải hàng đợi bác sĩ...
        </strong>

        <span>
          Vui lòng chờ trong giây lát.
        </span>
      </div>
    )
  }


  if (!encounters.length) {
    return (
      <div className="consultation-queue-state">
        <UsersRound size={34} />

        <strong>
          Không có bệnh nhân chờ khám
        </strong>

        <span>
          Bệnh nhân sẽ xuất hiện sau khi hoàn tất đo sinh hiệu.
        </span>
      </div>
    )
  }


  return (
    <div className="consultation-queue">
      {encounters.map((encounter, index) => (
        <ConsultationQueueCard
          key={encounter.id}
          encounter={encounter}
          number={
            (page - 1) * pageSize +
            index +
            1
          }
          onStart={onStart}
          isStarting={startingId === encounter.id}
        />
      ))}
    </div>
  )
}
