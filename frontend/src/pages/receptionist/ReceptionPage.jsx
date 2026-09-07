import { useCallback, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { getPatient, getPatients } from '../../api/patients'
import { createVisit } from '../../api/visits'
import { createEncounter } from '../../api/encounters'
import { getDepartments } from '../../api/departments'
import { useAuth } from '../../auth/useAuth'
import { Snackbar } from '../../components/common/Snackbar'
import { ReceptionCheckInForm } from '../../components/receptionist/ReceptionCheckInForm'
import { ReceptionPatientSearch } from '../../components/receptionist/ReceptionPatientSearch'
import { getNowLocalInputValue } from '../../utils/dateTime'
import { usePaginatedResource } from '../../utils/usePaginatedResource'
import { useSnackbar } from '../../utils/useSnackbar'

const PAGE_SIZE = 6

export default function ReceptionPage() {
  const { user } = useAuth()
  const { snackbar, showSnackbar } = useSnackbar()

  const [search, setSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [selectingPatientId, setSelectingPatientId] = useState(null)

  const [departments, setDepartments] = useState([])
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    visit_type: 'outpatient',
    arrived_at: getNowLocalInputValue(),
    reason: '',
    department: '',
    doctor: '',
    note: '',
  })

  const hasSearch = search.trim().length > 0

  const fetchPatients = useCallback(({ page, pageSize }) => {
    if (!search.trim()) {
      return Promise.resolve({
        count: 0,
        next: null,
        previous: null,
        results: [],
      })
    }

    return getPatients({
      search,
      ordering: 'full_name',
      page,
      pageSize,
    })
  }, [search])

  const {
    items: patients,
    page,
    setPage,
    pageSize,
    pagination,
    isLoading,
    errorMessage,
    loadItems: loadPatients,
  } = usePaginatedResource({
    fetchPage: fetchPatients,
    resetKey: search,
    pageSize: PAGE_SIZE,
    errorFallback: 'Không thể tải danh sách bệnh nhân.',
  })

  async function loadDepartmentsIfNeeded() {
  if (departments.length > 0 || isLoadingDepartments) return

  setIsLoadingDepartments(true)

  try {
    const data = await getDepartments({
      page: 1,
      pageSize: 50,
      ordering: 'name',
    })

    setDepartments(data.results || [])
  } catch (error) {
    showSnackbar({
      type: 'error',
      message: error.message || 'Không thể tải danh sách khoa.',
    })
  } finally {
    setIsLoadingDepartments(false)
  }
}

  if (user.role !== 'receptionist') {
    return <Navigate to="/app" replace />
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSelectPatient(patient) {
    setSelectingPatientId(patient.id)

    try {
      const patientDetail = await getPatient(patient.id)
      setSelectedPatient(patientDetail)
    } catch (error) {
      showSnackbar({
        type: 'error',
        message: error.message || 'Không thể tải chi tiết bệnh nhân.',
      })
    } finally {
      setSelectingPatientId(null)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!selectedPatient) {
      showSnackbar({
        type: 'error',
        message: 'Vui lòng chọn bệnh nhân trước khi tiếp nhận.',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const visit = await createVisit({
        medical_record: selectedPatient.medical_record_id,
        visit_type: 'outpatient',
        arrived_at: form.arrived_at,
        reason: form.reason.trim(),
        note: form.note.trim() || null,
        status: 'checked_in',
        active: true,
      })

      await createEncounter({
        visit: visit.id,
        department: form.department || null,
        doctor: form.doctor || null,
        status: 'checked_in',
        started_at: form.arrived_at,
        chief_complaint: form.reason.trim(),
        active: true,
      })

      showSnackbar({
        type: 'success',
        message: `Đã tiếp nhận ${selectedPatient.full_name}.`,
      })

      setSelectedPatient(null)
      setSearch('')
      setForm({
        visit_type: 'outpatient',
        arrived_at: getNowLocalInputValue(),
        reason: '',
        department: '',
        doctor: '',
        note: '',
      })
      await loadPatients()
    } catch (error) {
      showSnackbar({
        type: 'error',
        message: error.message || 'Không thể tiếp nhận bệnh nhân.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="users-page">
      <header className="users-page__header">
        <div>
          <h1>Tiếp nhận bệnh nhân</h1>
          <p>Tìm bệnh nhân đã có hồ sơ, tạo lần đến khám và đưa vào hàng đợi khám.</p>
        </div>
      </header>

      <section className="reception-layout">
        <ReceptionPatientSearch
          errorMessage={errorMessage}
          hasSearch={hasSearch}
          isLoading={isLoading}
          onPageChange={setPage}
          onRefresh={loadPatients}
          onRetry={loadPatients}
          onSearchChange={setSearch}
          onSelectPatient={handleSelectPatient}
          page={page}
          pageSize={pageSize}
          pagination={pagination}
          patients={patients}
          search={search}
          selectedPatientId={selectedPatient?.id}
          selectingPatientId={selectingPatientId}
        />

        <ReceptionCheckInForm
          departments={departments}
          form={form}
          isLoadingDepartments={isLoadingDepartments}
          isSubmitting={isSubmitting}
          onChange={updateField}
          onDepartmentFocus={loadDepartmentsIfNeeded}
          onSubmit={handleSubmit}
          selectedPatient={selectedPatient}
        />
      </section>

      <Snackbar snackbar={snackbar} />
    </div>
  )
}
