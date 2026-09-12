import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Beaker,
  CheckCircle2,
  ClipboardPlus,
  FileText,
  HeartPulse,
  MoveUpRight,
  Pill,
  Save,
  Stethoscope,
  UserRound,
} from 'lucide-react'

import {
  getEncounter,
  transferEncounterSpecialty,
  updateEncounter,
} from '../../api/encounters'
import { getLabTests } from '../../api/labtests'
import { getPrescriptions } from '../../api/prescriptions'
import { Snackbar } from '../../components/common/Snackbar'
import LabOrderModal from '../../components/doctor/LabOrderModal'
import PrescriptionOrderModal from '../../components/doctor/PrescriptionOrderModal'
import SpecialtyTransferModal from '../../components/doctor/SpecialtyTransferModal'
import { formatVietnamDateTime } from '../../utils/dateTime'
import { useSnackbar } from '../../utils/useSnackbar'

function formatVital(value) {
  if (value === null || value === undefined || value === '') {
    return 'Chưa có'
  }

  return value
}

function ExamTimeItem({ label, value, tone = 'default' }) {
  return (
    <div className={`exam-time-item exam-time-item--${tone}`}>
      <span>{label}</span>
      <strong>{formatVietnamDateTime(value)}</strong>
    </div>
  )
}

function VitalBox({ label, value, unit }) {
  return (
    <div className="exam-vital-box">
      <span>{label}</span>
      {unit && <em>{unit}</em>}
      <strong>{value}</strong>
    </div>
  )
}

export default function EncounterExamPage() {
  const { encounterId } = useParams()
  const navigate = useNavigate()
  const { snackbar, showSnackbar } = useSnackbar()

  const [encounter, setEncounter] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLabOrderOpen, setIsLabOrderOpen] = useState(false)
  const [isRefreshingLabTests, setIsRefreshingLabTests] = useState(false)
  const [isPrescriptionOrderOpen, setIsPrescriptionOrderOpen] = useState(false)
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [transferErrorMessage, setTransferErrorMessage] = useState('')
  const [orderedLabTests, setOrderedLabTests] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const activePrescriptions = prescriptions?.filter(
    (prescription) => prescription.status !== 'cancelled'
  ) || []

  const [form, setForm] = useState({
    chief_complaint: '',
    diagnosis: '',
    treatment_plan: '',
    follow_up_date: '',
  })

  useEffect(() => {
    async function loadEncounter() {
      try {
        const [encounterData, labTestData, prescriptionData] = await Promise.all([
          getEncounter(encounterId),

          getLabTests({
            encounter: encounterId,
            ordering: '-ordered_at',
          }),

          getPrescriptions({
            encounter: encounterId,
            ordering: '-created_at',
          }),
        ])

        setEncounter(encounterData)

        setOrderedLabTests(labTestData.results ?? labTestData ?? [],)
        setPrescriptions(prescriptionData.results ?? prescriptionData ?? [])
        setForm({
          chief_complaint: encounterData.chief_complaint || '',
          diagnosis: encounterData.diagnosis || '',
          treatment_plan: encounterData.treatment_plan || '',
          follow_up_date: encounterData.follow_up_date || '',
        })
      } catch (error) {
        console.error(error)
        setErrorMessage('Không thể tải thông tin lượt khám.')
      } finally {
        setIsLoading(false)
      }
    }

    loadEncounter()
  }, [encounterId])

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const data = await updateEncounter(encounterId, normalizeEncounterForm(form))
      setEncounter(data)
      setErrorMessage('')
    } catch (error) {
      console.error(error)
      setErrorMessage('Không thể lưu nội dung khám.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleComplete = async () => {
    if (!form.diagnosis.trim()) {
      setErrorMessage('Vui lòng nhập chẩn đoán trước khi hoàn tất khám.')
      return
    }

    setIsSaving(true)

    try {
      await updateEncounter(encounterId, {
        ...normalizeEncounterForm(form),
        status: 'completed',
      })

      navigate('/app/encounters')
    } catch (error) {
      console.error(error)
      setErrorMessage(
        getApiErrorMessage(error) || 'Không thể hoàn tất lượt khám.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleRequestVitalSignRecheck = async () => {
    setIsSaving(true)
    setErrorMessage('')

    try {
      const updatedEncounter = await updateEncounter(encounterId, {
        status: 'vitals_recheck',
      })
      setEncounter(updatedEncounter)
      showSnackbar({
        type: 'success',
        message: 'Đã gửi yêu cầu đo lại sinh hiệu cho điều dưỡng.',
      })
    } catch (error) {
      console.error(error)
      setErrorMessage(
        getApiErrorMessage(error) || 'Không thể gửi yêu cầu đo lại sinh hiệu.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleTransferSpecialty = async ({ department, reason }) => {
    if (!form.diagnosis.trim()) {
      setTransferErrorMessage('Vui lòng nhập chẩn đoán hoặc nhận định ban đầu trước khi chuyển khoa.')
      return
    }

    setIsSaving(true)
    setTransferErrorMessage('')

    try {
      await updateEncounter(encounterId, normalizeEncounterForm(form))
      await transferEncounterSpecialty(encounterId, {
        department,
        reason: reason.trim(),
      })

      setIsTransferOpen(false)
      navigate('/app/consultation-queue')
    } catch (error) {
      console.error(error)
      setTransferErrorMessage(
        getApiErrorMessage(error) || 'Không thể chuyển khám chuyên khoa.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="doctor-page">Đang tải lượt khám...</div>
  }

  if (!encounter) {
    return <div className="doctor-page">Không tìm thấy lượt khám.</div>
  }

  const handleLabOrderSubmitted = (createdTests) => {
    setOrderedLabTests((current) => [
      ...createdTests,
      ...current,
    ])
    setIsLabOrderOpen(false)
  }

  const refreshOrderedLabTests = async () => {
    setIsRefreshingLabTests(true)

    try {
      const data = await getLabTests({
        encounter: encounterId,
        ordering: '-ordered_at',
      })

      setOrderedLabTests(data.results ?? data ?? [])
    } catch (error) {
      console.error(error)
      showSnackbar({
        type: 'error',
        message: 'Không thể cập nhật kết quả xét nghiệm.',
      })
    } finally {
      setIsRefreshingLabTests(false)
    }
  }

  const handleOpenLabOrder = () => {
    setIsLabOrderOpen(true)
    refreshOrderedLabTests()
  }

  const handlePrescriptionSubmitted = (createdPrescription) => {
    setPrescriptions((current) => [
      createdPrescription,
      ...current,
    ])
    showSnackbar({
      type: 'success',
      message: 'Đã gửi đơn thuốc.',
    })
    setIsPrescriptionOrderOpen(false)
  }

  const handlePrescriptionUpdated = (updatedPrescription) => {
    setPrescriptions((current) => (
      current.map((prescription) => (
        prescription.id === updatedPrescription.id
          ? updatedPrescription
          : prescription
      ))
    ))
    showSnackbar({
      type: 'success',
      message: `Đã cập nhật đơn thuốc #${updatedPrescription.id}.`,
    })
    setIsPrescriptionOrderOpen(false)
  }

  const handlePrescriptionCancelled = (updatedPrescriptions) => {
    const cancelledPrescriptions = Array.isArray(updatedPrescriptions)
      ? updatedPrescriptions
      : [updatedPrescriptions]
    const cancelledById = new Map(
      cancelledPrescriptions.map((prescription) => [prescription.id, prescription]),
    )

    setPrescriptions((current) => (
      current.map((prescription) => (
        cancelledById.get(prescription.id) || prescription
      ))
    ))
    showSnackbar({
      type: 'success',
      message: `Đã hủy toàn bộ đơn thuốc (${cancelledPrescriptions.length} đơn).`,
    })
  }

  const handlePrescriptionCancelError = (message) => {
    showSnackbar({
      type: 'error',
      message,
    })
  }

  const visit = encounter.visit_detail
  const vitalSign = encounter?.latest_vital_sign
  const bloodPressure =
    vitalSign?.systolic_bp && vitalSign?.diastolic_bp
      ? `${vitalSign.systolic_bp}/${vitalSign.diastolic_bp}`
      : 'Chưa có'

  return (
    <div className="doctor-page exam-page">
      <header className="exam-hero">
        <button
          type="button"
          className="exam-back-button"
          onClick={() => navigate('/app/encounters')}
        >
          <ArrowLeft size={17} />
        </button>

        <div className="exam-hero__title">
          <span className="doctor-page__eyebrow">
            <Stethoscope size={15} />
            Phiếu khám bệnh
          </span>

          <h1>{visit?.patient_name || 'Bệnh nhân chưa rõ'}</h1>

          <p>
            {visit?.visit_number || 'Chưa có mã lượt khám'} · {encounter.department_detail?.name || 'Chưa phân khoa'}
          </p>
        </div>

        <span className="exam-status-pill">
          {encounter.status_display || encounter.status}
        </span>
      </header>

      <section className="exam-timeline" aria-label="Mốc thời gian lượt khám">
        <ExamTimeItem
          label="Tiếp nhận"
          value={visit?.arrived_at}
          tone="received"
        />

        <ExamTimeItem
          label="Đo sinh hiệu"
          value={vitalSign?.created_at}
          tone="vitals"
        />

        <ExamTimeItem
          label="Bắt đầu khám"
          value={encounter.started_at}
          tone="started"
        />

        <ExamTimeItem
          label="Hoàn tất khám"
          value={encounter.completed_at}
          tone="completed"
        />
      </section>

      {errorMessage && (
        <div className="users-page__error">
          <span>{errorMessage}</span>
        </div>
      )}

      <section className="exam-layout">
        <aside className="exam-side">
          <section className="exam-panel exam-patient-card">
            <div className="exam-avatar" aria-hidden="true">
              <UserRound size={34} />
            </div>

            <h2>{visit?.patient_name || 'Bệnh nhân chưa rõ'}</h2>

            <p>{visit?.visit_number || 'Chưa có mã lượt khám'}</p>

            <dl className="exam-info-list">
              <div>
                <dt>Khoa khám</dt>
                <dd>{encounter.department_detail?.name || 'Chưa phân khoa'}</dd>
              </div>

              <div>
                <dt>Bác sĩ</dt>
                <dd>{encounter.doctor_detail?.full_name || 'Chưa gán'}</dd>
              </div>

              <div>
                <dt>Lý do tiếp nhận</dt>
                <dd>{visit?.reason || 'Chưa ghi nhận'}</dd>
              </div>
            </dl>
          </section>

          <section className="exam-panel">
            <div className="exam-panel__title">
              <HeartPulse size={17} />
              <h2>Sinh hiệu</h2>
            </div>

            <div className="exam-vital-grid">
              <VitalBox label="Huyết áp" value={bloodPressure} unit="mmHg" />
              <VitalBox label="Mạch" value={formatVital(vitalSign?.pulse)} unit="bpm" />
              <VitalBox label="Nhiệt độ" value={formatVital(vitalSign?.temperature)} unit="°C" />
              <VitalBox label="Nhịp thở" value={formatVital(vitalSign?.respiratory_rate)} unit="l/p" />
              <VitalBox label="Chiều cao" value={formatVital(vitalSign?.height_cm)} unit="cm" />
              <VitalBox label="Cân nặng" value={formatVital(vitalSign?.weight_kg)} unit="kg" />
            </div>
          </section>
        </aside>

        <section className="exam-panel exam-clinical">
          <div className="exam-panel__header">
            <div className="exam-panel__title">
              <FileText size={18} />
              <h2>Diễn biến lâm sàng</h2>
            </div>

            <span>Nhập nội dung khám hiện tại</span>
          </div>

          <div className="exam-form">
            <label>
              <span>Triệu chứng và khám lâm sàng</span>
              <textarea
                name="chief_complaint"
                value={form.chief_complaint}
                onChange={handleChange}
                rows={6}
                placeholder="Nhập triệu chứng cơ năng, thực thể và ghi nhận khám lâm sàng..."
              />
            </label>

            <label>
              <span>Chẩn đoán</span>
              <textarea
                name="diagnosis"
                value={form.diagnosis}
                onChange={handleChange}
                rows={4}
                placeholder="Nhập chẩn đoán chính, chẩn đoán phân biệt hoặc mã bệnh nếu có..."
              />
            </label>

            <label>
              <span>Hướng điều trị</span>
              <textarea
                name="treatment_plan"
                value={form.treatment_plan}
                onChange={handleChange}
                rows={4}
                placeholder="Nhập kế hoạch điều trị, dặn dò, theo dõi..."
              />
            </label>

            <label>
              <span>Ngày tái khám</span>
              <input
                type="date"
                name="follow_up_date"
                value={form.follow_up_date}
                onChange={handleChange}
              />
            </label>
          </div>
        </section>

        <aside className="exam-actions-panel">
          <section className="exam-panel exam-actions">
            <div className="exam-panel__title">
              <ClipboardPlus size={18} />
              <h2>Xử trí</h2>
            </div>

            <button
              type="button"
              className="exam-action-button"
              onClick={handleOpenLabOrder}
            >
              <span>
                <Beaker size={17} />
                Chỉ định xét nghiệm
              </span>
              <MoveUpRight size={15} />
            </button>

            <button
              type="button"
              className="exam-action-button"
              onClick={() => {
                setTransferErrorMessage('')
                setIsTransferOpen(true)
              }}
            >
              <span>
                <MoveUpRight size={17} />
                Chuyển chuyên khoa
              </span>
              <MoveUpRight size={15} />
            </button>

            <button
              type="button"
              className="exam-action-button"
              onClick={() => setIsPrescriptionOrderOpen(true)}
            >
              <span>
                <Pill size={17} />
                Kê đơn thuốc
              </span>
              <MoveUpRight size={15} />
            </button>

            <button
              type="button"
              className="exam-action-button"
              disabled={isSaving || encounter.status === 'vitals_recheck'}
              onClick={handleRequestVitalSignRecheck}
            >
              <span>
                <HeartPulse size={17} />
                {encounter.status === 'vitals_recheck'
                  ? 'Đang chờ đo lại sinh hiệu'
                  : 'Yêu cầu đo lại sinh hiệu'}
              </span>
              <MoveUpRight size={15} />
            </button>

            {orderedLabTests.length > 0 && (
              <section className="exam-lab-summary" aria-label="Phiếu xét nghiệm đã chỉ định">
                <div>
                  <strong>Đã chỉ định xét nghiệm</strong>
                  <span>{orderedLabTests.length} xét nghiệm </span>
                </div>

                <button type="button" onClick={handleOpenLabOrder}>
                  Xem phiếu
                </button>
              </section>
            )}

            {activePrescriptions.length > 0 && (
              <section className="exam-lab-summary" aria-label="Đơn thuốc đã kê">
                <div>
                  <strong>Đã kê đơn thuốc</strong>
                  <span>{activePrescriptions.length} đơn thuốc</span>
                </div>

                <button type="button" onClick={() => setIsPrescriptionOrderOpen(true)}>
                  Xem đơn
                </button>
              </section>
            )}

            <div className="exam-actions__footer">
              <button
                type="button"
                className="exam-save-button"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save size={16} />
                Lưu nháp
              </button>

              <button
                type="button"
                className="exam-complete-button"
                onClick={handleComplete}
                disabled={isSaving}
              >
                <CheckCircle2 size={16} />
                Hoàn tất lượt khám
              </button>
            </div>
          </section>
        </aside>
      </section>

      {isLabOrderOpen && (
        <LabOrderModal
          patientName={visit?.patient_name || 'Bệnh nhân chưa rõ'}
          visitNumber={visit?.visit_number || 'Chưa có mã lượt khám'}
          departmentName={encounter.department_detail?.name || 'Chưa phân khoa'}
          encounterId={encounter.id}
          orderedLabTests={orderedLabTests}
          isRefreshing={isRefreshingLabTests}
          onClose={() => setIsLabOrderOpen(false)}
          onRefresh={refreshOrderedLabTests}
          onSubmitted={handleLabOrderSubmitted}
        />
      )}

      {isPrescriptionOrderOpen && (
        <PrescriptionOrderModal
          patientName={visit?.patient_name || 'Bệnh nhân chưa rõ'}
          visitNumber={visit?.visit_number || 'Chưa có mã lượt khám'}
          departmentName={encounter.department_detail?.name || 'Chưa phân khoa'}
          encounterId={encounter.id}
          existingPrescriptions={prescriptions}
          onClose={() => setIsPrescriptionOrderOpen(false)}
          onCancelled={handlePrescriptionCancelled}
          onCancelError={handlePrescriptionCancelError}
          onSubmitted={handlePrescriptionSubmitted}
          onUpdated={handlePrescriptionUpdated}
        />
      )}

      {isTransferOpen && (
        <SpecialtyTransferModal
          currentDepartmentId={encounter.department}
          currentDepartmentName={encounter.department_detail?.name || 'Chưa phân khoa'}
          errorMessage={transferErrorMessage}
          isSubmitting={isSaving}
          patientName={visit?.patient_name || 'Bệnh nhân chưa rõ'}
          visitNumber={visit?.visit_number || 'Chưa có mã lượt khám'}
          onClose={() => {
            if (isSaving) return
            setIsTransferOpen(false)
            setTransferErrorMessage('')
          }}
          onSubmit={handleTransferSpecialty}
        />
      )}

      <Snackbar snackbar={snackbar} />
    </div>
  )
}

function getApiErrorMessage(error) {
  if (!error?.data || typeof error.data !== 'object') {
    return error?.message
  }

  const firstValue = Object.values(error.data)[0]
  if (Array.isArray(firstValue)) {
    return firstValue[0]
  }

  return firstValue || error.message
}

function normalizeEncounterForm(form) {
  return {
    ...form,
    follow_up_date: form.follow_up_date || null,
  }
}
