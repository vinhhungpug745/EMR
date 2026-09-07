import { CalendarClock, ClipboardList, Send, Stethoscope } from 'lucide-react'

export function ReceptionCheckInForm({
  departments,
  form,
  isLoadingDepartments,
  isSubmitting,
  onChange,
  onDepartmentFocus,
  onSubmit,
  selectedPatient,
}) {
  return (
    <form className="reception-panel reception-form" onSubmit={onSubmit}>
      <header className="reception-panel__header">
        <span className="reception-panel__icon">
          <Stethoscope size={18} aria-hidden="true" />
        </span>
        <div>
          <h2>Thông tin tiếp nhận</h2>
          <p>Điền thông tin để tạo lần đến khám và đưa bệnh nhân vào hàng đợi đo sinh hiệu.</p>
        </div>
      </header>

      {selectedPatient ? (
        <div className="reception-selected">
          <span className="reception-selected__icon">
            <ClipboardList size={18} aria-hidden="true" />
          </span>
          <span>
            <strong>{selectedPatient.full_name}</strong>
            <small>Mã hồ sơ: {selectedPatient.record_number || selectedPatient.medical_record_id}</small>
          </span>
        </div>
      ) : (
        <div className="reception-selected reception-selected--empty">
          <span className="reception-selected__icon">
            <ClipboardList size={18} aria-hidden="true" />
          </span>
          <span>
            <strong>Chưa chọn bệnh nhân</strong>
            <small>Chọn bệnh nhân ở khung bên trái trước khi tiếp nhận.</small>
          </span>
        </div>
      )}

      <div className="reception-form__body">
        <div className="reception-form__section reception-form__section--compact">
         <div className="reception-form__section-title">
          <span className="reception-form__section-icon">
            <CalendarClock size={16} aria-hidden="true" />
          </span>

          <span>Thông tin lượt đến</span>
         </div>

          <label className="user-form__field">
            <span>Loại khám</span>
            <input value="Khám ngoại trú" readOnly />
          </label>

          <label className="user-form__field">
            <span>Khoa khám</span>
            <select
              name="department"
              value={form.department}
              disabled={isLoadingDepartments}
              onChange={onChange}
              onFocus={onDepartmentFocus}
              onMouseDown={onDepartmentFocus}
            >
              <option value="">
                {isLoadingDepartments ? 'Đang tải khoa...' : 'Chưa phân khoa'}
              </option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>

          <label className="user-form__field reception-form__time-field">
            <span>Thời gian đến</span>
            <input
              name="arrived_at"
              type="datetime-local"
              value={form.arrived_at}
              required
              onChange={onChange}
            />
          </label>
        </div>

        <div className="reception-form__section">
          <span className="reception-form__section-title">
            <ClipboardList size={15} aria-hidden="true" />
            Nội dung tiếp nhận
          </span>

          <label className="user-form__field">
            <span>Lý do đến khám</span>
            <input
              name="reason"
              value={form.reason}
              required
              placeholder="Ví dụ: đau bụng, sốt, tái khám..."
              onChange={onChange}
            />
          </label>

          <label className="user-form__field">
            <span>Ghi chú</span>
            <textarea
              name="note"
              value={form.note}
              rows={4}
              placeholder="Ghi chú thêm cho lần tiếp nhận nếu có"
              onChange={onChange}
            />
          </label>
        </div>
      </div>

      <footer className="user-modal__footer reception-form__footer">
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          <Send size={17} aria-hidden="true" />
          {isSubmitting ? 'Đang tiếp nhận...' : 'Tiếp nhận'}
        </button>
      </footer>
    </form>
  )
}
