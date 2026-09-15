from datetime import timedelta
from tempfile import TemporaryDirectory

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from emrapi.models import (
    Department,
    DoctorProfile,
    Encounter,
    LabTechnicianProfile,
    LabTest,
    LabTestCatalog,
    MedicalAttachment,
    MedicalRecord,
    Medication,
    Patient,
    Prescription,
    StaffProfile,
    Visit,
    VitalSign,
    AuditLog,
)


class RolePermissionTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.users = {}
        for index, role in enumerate(StaffProfile.Role.values, start=1):
            user = User.objects.create_user(
                username=f'{role}_permission_test',
                password='Strong-test-password-123',
            )
            StaffProfile.objects.create(
                user=user,
                role=role,
                employee_code=f'PERM-{index:03d}',
            )
            cls.users[role] = user

    def request_as(self, role, method, path, data=None):
        self.client.force_authenticate(self.users[role])
        return getattr(self.client, method)(path, data=data, format='json')

    def test_all_staff_can_read_shared_catalogs_but_only_admin_can_write(self):
        for role in StaffProfile.Role.values:
            with self.subTest(role=role, action='read'):
                response = self.request_as(role, 'get', '/departments/')
                self.assertEqual(response.status_code, status.HTTP_200_OK)

        for role in StaffProfile.Role.values:
            if role == StaffProfile.Role.ADMIN:
                continue
            with self.subTest(role=role, action='write'):
                response = self.request_as(
                    role,
                    'post',
                    '/departments/',
                    {'name': f'Forbidden department {role}'},
                )
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        response = self.request_as(
            StaffProfile.Role.ADMIN,
            'post',
            '/departments/',
            {'name': 'Admin-created department'},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_vital_sign_endpoints_are_restricted_to_nurse_and_admin(self):
        for role in (StaffProfile.Role.NURSE, StaffProfile.Role.ADMIN):
            with self.subTest(role=role, allowed=True):
                response = self.request_as(role, 'get', '/vital-signs/')
                self.assertEqual(response.status_code, status.HTTP_200_OK)

        for role in (
            StaffProfile.Role.RECEPTIONIST,
            StaffProfile.Role.DOCTOR,
            StaffProfile.Role.LAB_TECHNICIAN,
        ):
            with self.subTest(role=role, allowed=False):
                response = self.request_as(role, 'get', '/vital-signs/')
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_medical_records_are_restricted_to_doctor_and_admin(self):
        for role in (StaffProfile.Role.DOCTOR, StaffProfile.Role.ADMIN):
            with self.subTest(role=role, allowed=True):
                response = self.request_as(role, 'get', '/medical-records/')
                self.assertEqual(response.status_code, status.HTTP_200_OK)

        for role in (
            StaffProfile.Role.RECEPTIONIST,
            StaffProfile.Role.NURSE,
            StaffProfile.Role.LAB_TECHNICIAN,
        ):
            with self.subTest(role=role, allowed=False):
                response = self.request_as(role, 'get', '/medical-records/')
                self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_encounter_actions_use_receptionist_and_doctor_workflow(self):
        response = self.request_as(
            StaffProfile.Role.RECEPTIONIST,
            'post',
            '/encounters/',
            {},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        response = self.request_as(
            StaffProfile.Role.DOCTOR,
            'post',
            '/encounters/',
            {},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        response = self.request_as(
            StaffProfile.Role.RECEPTIONIST,
            'get',
            '/encounters/',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_lab_and_prescription_endpoints_reject_unrelated_roles(self):
        for path in ('/lab-tests/', '/prescriptions/'):
            for role in (StaffProfile.Role.RECEPTIONIST, StaffProfile.Role.NURSE):
                with self.subTest(path=path, role=role):
                    response = self.request_as(role, 'get', path)
                    self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_inactive_staff_profile_is_denied(self):
        nurse = self.users[StaffProfile.Role.NURSE]
        nurse.staff_profile.active = False
        nurse.staff_profile.save(update_fields=['active'])

        response = self.request_as(StaffProfile.Role.NURSE, 'get', '/vital-signs/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class InactiveStaffAuthenticationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='inactive_profile_login_test',
            password='Strong-test-password-123',
            first_name='Nhan vien',
            last_name='Kiem thu',
        )
        self.staff = StaffProfile.objects.create(
            user=self.user,
            role=StaffProfile.Role.NURSE,
            employee_code='INACTIVE-001',
            active=False,
        )

    def test_inactive_staff_can_login_and_view_status_but_cannot_use_workflow(self):
        login_response = self.client.post(
            '/auth/login/',
            {
                'username': self.user.username,
                'password': 'Strong-test-password-123',
            },
            format='json',
        )

        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertFalse(login_response.data['user']['staff_active'])

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}"
        )
        profile_response = self.client.get('/auth/me/')
        workflow_response = self.client.get('/vital-signs/')
        own_profile_response = self.client.get('/my-profile/')

        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        self.assertFalse(profile_response.data['user']['staff_active'])
        self.assertEqual(workflow_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(own_profile_response.status_code, status.HTTP_403_FORBIDDEN)


class StaffProfileStatusManagementTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username='profile_status_admin',
            password='Strong-test-password-123',
        )
        self.admin_staff = StaffProfile.objects.create(
            user=self.admin,
            role=StaffProfile.Role.ADMIN,
            employee_code='STATUS-ADMIN-001',
        )
        self.staff_user = User.objects.create_user(
            username='profile_status_nurse',
            password='Strong-test-password-123',
        )
        self.staff = StaffProfile.objects.create(
            user=self.staff_user,
            role=StaffProfile.Role.NURSE,
            employee_code='STATUS-NURSE-001',
        )
        self.client.force_authenticate(self.admin)

    def test_admin_can_lock_another_staff_profile(self):
        response = self.client.patch(
            f'/staff-profiles/{self.staff.id}/',
            {'active': False},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['active'])
        self.staff.refresh_from_db()
        self.assertFalse(self.staff.active)

    def test_admin_cannot_lock_own_staff_profile(self):
        response = self.client.patch(
            f'/staff-profiles/{self.admin_staff.id}/',
            {'active': False},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.admin_staff.refresh_from_db()
        self.assertTrue(self.admin_staff.active)

    def test_account_lock_does_not_lock_staff_profile(self):
        response = self.client.patch(
            f'/users/{self.staff_user.id}/',
            {'is_active': False},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.staff_user.refresh_from_db()
        self.staff.refresh_from_db()
        self.assertFalse(self.staff_user.is_active)
        self.assertTrue(self.staff.active)


class VitalSignRecheckWorkflowTests(APITestCase):
    def setUp(self):
        self.department = Department.objects.create(name='Khoa Nội')

        self.doctor_user = User.objects.create_user(username='recheck_doctor')
        self.doctor_staff = StaffProfile.objects.create(
            user=self.doctor_user,
            department=self.department,
            role=StaffProfile.Role.DOCTOR,
            employee_code='RECHECK-DOC-001',
        )
        self.doctor = DoctorProfile.objects.create(
            staff=self.doctor_staff,
            specialty='Nội khoa',
            license_number='RECHECK-LICENSE-001',
        )

        self.nurse_user = User.objects.create_user(username='recheck_nurse')
        self.nurse_staff = StaffProfile.objects.create(
            user=self.nurse_user,
            department=self.department,
            role=StaffProfile.Role.NURSE,
            employee_code='RECHECK-NURSE-001',
        )

        patient = Patient.objects.create(
            full_name='Bệnh nhân đo lại',
            date_of_birth='1990-01-01',
        )
        medical_record = MedicalRecord.objects.create(
            patient=patient,
            record_number='EMR-RECHECK-001',
        )
        visit = Visit.objects.create(
            medical_record=medical_record,
            arrived_at=timezone.now(),
            reason='Khám bệnh',
            status=Visit.Status.IN_PROGRESS,
        )
        self.encounter = Encounter.objects.create(
            visit=visit,
            department=self.department,
            doctor=self.doctor,
            status=Encounter.Status.IN_PROGRESS,
            started_at=timezone.now(),
            chief_complaint='Mệt',
        )
        VitalSign.objects.create(
            encounter=self.encounter,
            recorded_by=self.nurse_staff,
            temperature='37.0',
            pulse=80,
        )

    def test_request_measure_and_close_vital_sign_recheck(self):
        self.client.force_authenticate(self.doctor_user)
        request_response = self.client.patch(
            f'/encounters/{self.encounter.id}/',
            {'status': Encounter.Status.VITALS_RECHECK},
            format='json',
        )

        self.assertEqual(request_response.status_code, status.HTTP_200_OK)
        self.encounter.refresh_from_db()
        self.assertEqual(
            self.encounter.status,
            Encounter.Status.VITALS_RECHECK,
        )

        self.client.force_authenticate(self.nurse_user)
        queue_response = self.client.get('/vital-sign-queue/')
        self.assertEqual(queue_response.status_code, status.HTTP_200_OK)
        queue_items = queue_response.data.get('results', queue_response.data)
        self.assertEqual(len(queue_items), 1)
        self.assertEqual(
            queue_items[0]['status'],
            Encounter.Status.VITALS_RECHECK,
        )

        measurement_response = self.client.post(
            '/vital-signs/',
            {
                'encounter': self.encounter.id,
                'temperature': '37.5',
                'pulse': 84,
            },
            format='json',
        )

        self.assertEqual(measurement_response.status_code, status.HTTP_201_CREATED)
        self.encounter.refresh_from_db()
        self.assertEqual(self.encounter.status, Encounter.Status.IN_PROGRESS)


class OutpatientWorkflowAPITests(APITestCase):
    """API integration tests for the core outpatient workflow."""

    def setUp(self):
        self.internal_medicine = Department.objects.create(name='Khoa Nội')
        self.cardiology = Department.objects.create(name='Khoa Tim mạch')

        self.receptionist_user, self.receptionist_staff = self._create_staff(
            username='workflow_receptionist',
            role=StaffProfile.Role.RECEPTIONIST,
            employee_code='WF-REC-001',
        )
        self.nurse_user, self.nurse_staff = self._create_staff(
            username='workflow_nurse',
            role=StaffProfile.Role.NURSE,
            employee_code='WF-NUR-001',
            department=self.internal_medicine,
        )
        self.doctor_user, self.doctor_staff = self._create_staff(
            username='workflow_doctor',
            role=StaffProfile.Role.DOCTOR,
            employee_code='WF-DOC-001',
            department=self.internal_medicine,
        )
        self.doctor = DoctorProfile.objects.create(
            staff=self.doctor_staff,
            specialty='Nội khoa',
            license_number='WF-LICENSE-001',
        )
        self.lab_user, self.lab_staff = self._create_staff(
            username='workflow_lab',
            role=StaffProfile.Role.LAB_TECHNICIAN,
            employee_code='WF-LAB-001',
        )
        self.lab_technician = LabTechnicianProfile.objects.create(
            staff=self.lab_staff,
            laboratory_unit='Huyết học',
            certification_number='WF-LAB-CERT-001',
        )

        self.patient = Patient.objects.create(
            full_name='Người bệnh kiểm thử',
            date_of_birth='1990-01-01',
            phone='0900000001',
        )
        self.medical_record = MedicalRecord.objects.create(
            patient=self.patient,
            record_number='EMR-WORKFLOW-001',
            created_by=self.receptionist_staff,
        )
        self.visit = Visit.objects.create(
            medical_record=self.medical_record,
            arrived_at=timezone.now(),
            reason='Đau họng',
            created_by=self.receptionist_staff,
        )
        self.encounter = Encounter.objects.create(
            visit=self.visit,
            department=self.internal_medicine,
            chief_complaint='Đau họng',
            created_by=self.receptionist_staff,
        )

        self.blood_count = LabTestCatalog.objects.create(
            code='CBC-WF',
            name='Công thức máu kiểm thử',
            category='Huyết học',
            specimen_type='Máu',
        )
        self.medication = Medication.objects.create(
            code='PARA-WF',
            name='Paracetamol kiểm thử',
            active_ingredient='Paracetamol',
            strength='500 mg',
            dosage_form='Viên nén',
            unit='Viên',
            route=Medication.Route.ORAL,
        )

    @staticmethod
    def _create_staff(username, role, employee_code, department=None):
        user = User.objects.create_user(username=username)
        staff = StaffProfile.objects.create(
            user=user,
            role=role,
            employee_code=employee_code,
            department=department,
        )
        return user, staff

    def _authenticate(self, user):
        self.client.force_authenticate(user)

    def _record_vital_sign_and_start_encounter(self):
        self._authenticate(self.nurse_user)
        vital_response = self.client.post(
            '/vital-signs/',
            {
                'encounter': self.encounter.id,
                'temperature': '37.2',
                'pulse': 82,
                'systolic_bp': 120,
                'diastolic_bp': 80,
            },
            format='json',
        )
        self.assertEqual(vital_response.status_code, status.HTTP_201_CREATED)

        self._authenticate(self.doctor_user)
        start_response = self.client.patch(
            f'/encounters/{self.encounter.id}/',
            {'status': Encounter.Status.IN_PROGRESS},
            format='json',
        )
        self.assertEqual(start_response.status_code, status.HTTP_200_OK)
        self.encounter.refresh_from_db()
        self.assertEqual(self.encounter.doctor, self.doctor)
        self.assertIsNotNone(self.encounter.started_at)

    def test_reception_creates_patient_record_visit_and_encounter(self):
        self._authenticate(self.receptionist_user)
        patient_response = self.client.post(
            '/patients/',
            {
                'full_name': 'Người bệnh tiếp nhận mới',
                'date_of_birth': '2000-02-20',
                'phone': '0900000002',
            },
            format='json',
        )
        self.assertEqual(patient_response.status_code, status.HTTP_201_CREATED)

        patient = Patient.objects.get(pk=patient_response.data['id'])
        self.assertTrue(hasattr(patient, 'medical_record'))
        self.assertEqual(
            patient.medical_record.created_by,
            self.receptionist_staff,
        )

        visit_response = self.client.post(
            '/visits/',
            {
                'medical_record': patient.medical_record.id,
                'arrived_at': timezone.now().isoformat(),
                'reason': 'Khám ngoại trú',
            },
            format='json',
        )
        self.assertEqual(visit_response.status_code, status.HTTP_201_CREATED)

        encounter_response = self.client.post(
            '/encounters/',
            {
                'visit': visit_response.data['id'],
                'department': self.internal_medicine.id,
                'chief_complaint': 'Đau đầu',
            },
            format='json',
        )
        self.assertEqual(encounter_response.status_code, status.HTTP_201_CREATED)
        encounter = Encounter.objects.get(pk=encounter_response.data['id'])
        self.assertEqual(encounter.status, Encounter.Status.CHECKED_IN)
        self.assertEqual(encounter.created_by, self.receptionist_staff)

    def test_reception_rejects_future_date_of_birth(self):
        self._authenticate(self.receptionist_user)
        future_date = timezone.localdate() + timedelta(days=1)

        response = self.client.post(
            '/patients/',
            {
                'full_name': 'Ngày sinh không hợp lệ',
                'date_of_birth': future_date.isoformat(),
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('date_of_birth', response.data)
        self.assertFalse(
            Patient.objects.filter(full_name='Ngày sinh không hợp lệ').exists()
        )

    def test_vital_sign_validation_and_queue_transition(self):
        self._authenticate(self.nurse_user)
        invalid_response = self.client.post(
            '/vital-signs/',
            {
                'encounter': self.encounter.id,
                'systolic_bp': 70,
                'diastolic_bp': 90,
            },
            format='json',
        )
        self.assertEqual(invalid_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(VitalSign.objects.filter(encounter=self.encounter).count(), 0)

        valid_response = self.client.post(
            '/vital-signs/',
            {
                'encounter': self.encounter.id,
                'temperature': '37.0',
                'pulse': 80,
                'systolic_bp': 120,
                'diastolic_bp': 80,
            },
            format='json',
        )
        self.assertEqual(valid_response.status_code, status.HTTP_201_CREATED)
        self.encounter.refresh_from_db()
        self.assertEqual(self.encounter.status, Encounter.Status.VITALS_DONE)
        self.assertEqual(
            VitalSign.objects.get(pk=valid_response.data['id']).recorded_by,
            self.nurse_staff,
        )

        queue_response = self.client.get('/vital-sign-queue/')
        self.assertEqual(queue_response.status_code, status.HTTP_200_OK)
        queue_items = queue_response.data.get('results', queue_response.data)
        self.assertNotIn(self.encounter.id, [item['id'] for item in queue_items])

    def test_doctor_cannot_start_encounter_before_vital_sign_is_recorded(self):
        self._authenticate(self.doctor_user)
        response = self.client.patch(
            f'/encounters/{self.encounter.id}/',
            {'status': Encounter.Status.IN_PROGRESS},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.encounter.refresh_from_db()
        self.assertEqual(self.encounter.status, Encounter.Status.CHECKED_IN)
        self.assertIsNone(self.encounter.doctor)

    def test_completion_requires_diagnosis_and_no_pending_lab_test(self):
        self._record_vital_sign_and_start_encounter()

        missing_diagnosis_response = self.client.patch(
            f'/encounters/{self.encounter.id}/',
            {'status': Encounter.Status.COMPLETED},
            format='json',
        )
        self.assertEqual(
            missing_diagnosis_response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.encounter.refresh_from_db()
        self.assertEqual(self.encounter.status, Encounter.Status.IN_PROGRESS)

        lab_response = self.client.post(
            '/lab-tests/',
            {
                'encounter': self.encounter.id,
                'test_catalog': self.blood_count.id,
            },
            format='json',
        )
        self.assertEqual(lab_response.status_code, status.HTTP_201_CREATED)

        pending_lab_response = self.client.patch(
            f'/encounters/{self.encounter.id}/',
            {
                'status': Encounter.Status.COMPLETED,
                'diagnosis': 'Viêm họng cấp',
            },
            format='json',
        )
        self.assertEqual(pending_lab_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('lab_tests', pending_lab_response.data)

    def test_lab_order_processing_and_completion_workflow(self):
        self._record_vital_sign_and_start_encounter()
        order_response = self.client.post(
            '/lab-tests/',
            {
                'encounter': self.encounter.id,
                'test_catalog': self.blood_count.id,
            },
            format='json',
        )
        self.assertEqual(order_response.status_code, status.HTTP_201_CREATED)
        lab_test_id = order_response.data['id']

        self._authenticate(self.lab_user)
        queue_response = self.client.get('/lab-technician-queue/')
        self.assertEqual(queue_response.status_code, status.HTTP_200_OK)
        queue_items = queue_response.data.get('results', queue_response.data)
        self.assertIn(lab_test_id, [item['id'] for item in queue_items])

        processing_response = self.client.patch(
            f'/lab-tests/{lab_test_id}/',
            {'status': LabTest.Status.PROCESSING},
            format='json',
        )
        self.assertEqual(processing_response.status_code, status.HTTP_200_OK)

        completed_response = self.client.patch(
            f'/lab-tests/{lab_test_id}/',
            {
                'status': LabTest.Status.COMPLETED,
                'result': 'Các chỉ số trong giới hạn tham chiếu',
            },
            format='json',
        )
        self.assertEqual(completed_response.status_code, status.HTTP_200_OK)
        lab_test = LabTest.objects.get(pk=lab_test_id)
        self.assertEqual(lab_test.status, LabTest.Status.COMPLETED)
        self.assertEqual(lab_test.performed_by, self.lab_technician)
        self.assertIsNotNone(lab_test.performed_at)

        self._authenticate(self.doctor_user)
        detail_response = self.client.get(f'/lab-tests/{lab_test_id}/')
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            detail_response.data['result'],
            'Các chỉ số trong giới hạn tham chiếu',
        )

    def test_doctor_issues_prescription_with_items_for_own_encounter(self):
        self._record_vital_sign_and_start_encounter()
        response = self.client.post(
            '/prescriptions/',
            {
                'encounter': self.encounter.id,
                'status': Prescription.Status.ISSUED,
                'note': 'Uống sau ăn',
                'items': [
                    {
                        'medication': self.medication.id,
                        'dosage': '1 viên',
                        'frequency': '2 lần/ngày',
                        'duration': '3 ngày',
                        'quantity': '6',
                        'instruction': 'Uống sau ăn',
                    }
                ],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        prescription = Prescription.objects.get(pk=response.data['id'])
        self.assertEqual(prescription.encounter, self.encounter)
        self.assertEqual(prescription.prescribed_by, self.doctor)
        self.assertEqual(prescription.items.count(), 1)
        self.assertEqual(prescription.items.get().medication, self.medication)

    def test_specialty_transfer_completes_source_and_creates_linked_encounter(self):
        self._record_vital_sign_and_start_encounter()
        self.encounter.diagnosis = 'Theo dõi bệnh tim mạch'
        self.encounter.save(update_fields=['diagnosis', 'updated_at'])

        response = self.client.post(
            f'/encounters/{self.encounter.id}/transfer-specialty/',
            {
                'department': self.cardiology.id,
                'reason': 'Cần đánh giá chuyên khoa tim mạch',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.encounter.refresh_from_db()
        self.assertEqual(self.encounter.status, Encounter.Status.COMPLETED)
        self.assertIsNotNone(self.encounter.completed_at)

        referred_encounter = Encounter.objects.get(pk=response.data['id'])
        self.assertEqual(referred_encounter.parent_encounter, self.encounter)
        self.assertEqual(referred_encounter.visit, self.visit)
        self.assertEqual(referred_encounter.department, self.cardiology)
        self.assertEqual(referred_encounter.status, Encounter.Status.VITALS_DONE)
        self.assertIsNone(referred_encounter.doctor)

    def test_completed_encounter_completes_visit_and_is_visible_in_history(self):
        self._record_vital_sign_and_start_encounter()
        completion_response = self.client.patch(
            f'/encounters/{self.encounter.id}/',
            {
                'status': Encounter.Status.COMPLETED,
                'diagnosis': 'Viêm họng cấp',
                'treatment_plan': 'Điều trị ngoại trú',
            },
            format='json',
        )
        self.assertEqual(completion_response.status_code, status.HTTP_200_OK)

        self.encounter.refresh_from_db()
        self.visit.refresh_from_db()
        self.assertEqual(self.encounter.status, Encounter.Status.COMPLETED)
        self.assertIsNotNone(self.encounter.completed_at)
        self.assertEqual(self.visit.status, Visit.Status.COMPLETED)
        self.assertIsNotNone(self.visit.completed_at)

        history_response = self.client.get(
            f'/medical-records/{self.medical_record.id}/'
        )
        self.assertEqual(history_response.status_code, status.HTTP_200_OK)
        self.assertEqual(history_response.data['visits'][0]['id'], self.visit.id)
        history_encounter = history_response.data['visits'][0]['encounters'][0]
        self.assertEqual(history_encounter['id'], self.encounter.id)
        self.assertEqual(history_encounter['diagnosis'], 'Viêm họng cấp')


class MedicalAttachmentAndAuditTests(APITestCase):
    def setUp(self):
        self.media_directory = TemporaryDirectory()
        self.settings_override = override_settings(
            MEDIA_ROOT=self.media_directory.name,
        )
        self.settings_override.enable()
        self.addCleanup(self.settings_override.disable)
        self.addCleanup(self.media_directory.cleanup)

        self.department = Department.objects.create(name='Khoa tệp kiểm thử')
        self.doctor_user = User.objects.create_user(username='attachment_doctor')
        self.doctor_staff = StaffProfile.objects.create(
            user=self.doctor_user,
            role=StaffProfile.Role.DOCTOR,
            employee_code='ATT-DOC-001',
            department=self.department,
        )
        self.doctor = DoctorProfile.objects.create(
            staff=self.doctor_staff,
            specialty='Nội khoa',
            license_number='ATT-LICENSE-001',
        )
        self.lab_user = User.objects.create_user(username='attachment_lab_technician')
        self.lab_staff = StaffProfile.objects.create(
            user=self.lab_user,
            role=StaffProfile.Role.LAB_TECHNICIAN,
            employee_code='ATT-LAB-001',
        )
        self.lab_technician = LabTechnicianProfile.objects.create(
            staff=self.lab_staff,
            laboratory_unit='Huyết học',
            certification_number='ATT-LAB-CERT-001',
        )
        self.nurse_user = User.objects.create_user(username='attachment_nurse')
        StaffProfile.objects.create(
            user=self.nurse_user,
            role=StaffProfile.Role.NURSE,
            employee_code='ATT-NUR-001',
            department=self.department,
        )
        self.receptionist_user = User.objects.create_user(username='audit_receptionist')
        self.receptionist_staff = StaffProfile.objects.create(
            user=self.receptionist_user,
            role=StaffProfile.Role.RECEPTIONIST,
            employee_code='ATT-REC-001',
        )
        self.patient = Patient.objects.create(
            full_name='Bệnh nhân có tệp',
            date_of_birth='1992-04-05',
        )
        self.medical_record = MedicalRecord.objects.create(
            patient=self.patient,
            record_number='EMR-ATT-001',
            created_by=self.receptionist_staff,
        )
        self.visit = Visit.objects.create(
            medical_record=self.medical_record,
            arrived_at=timezone.now(),
            reason='Khám có tài liệu',
            created_by=self.receptionist_staff,
        )
        self.encounter = Encounter.objects.create(
            visit=self.visit,
            department=self.department,
            doctor=self.doctor,
            status=Encounter.Status.IN_PROGRESS,
            chief_complaint='Đau đầu',
            created_by=self.receptionist_staff,
        )
        self.lab_catalog = LabTestCatalog.objects.create(
            code='ATT-CBC',
            name='Công thức máu cho tệp',
            category='Huyết học',
            specimen_type='Máu',
        )
        self.lab_test = LabTest.objects.create(
            encounter=self.encounter,
            test_catalog=self.lab_catalog,
            ordered_by=self.doctor,
            performed_by=self.lab_technician,
            status=LabTest.Status.PROCESSING,
        )

    def _upload(self, name='ket-qua.pdf', content=b'%PDF-1.4 test document'):
        self.client.force_authenticate(self.doctor_user)
        return self.client.post(
            '/medical-attachments/',
            {
                'encounter': self.encounter.id,
                'title': 'Kết quả chẩn đoán hình ảnh',
                'description': 'Tệp dùng cho kiểm thử tích hợp',
                'file': SimpleUploadedFile(
                    name,
                    content,
                    content_type='application/pdf',
                ),
            },
            format='multipart',
        )

    def _upload_lab_attachment(self, lab_test=None, name='anh-xet-nghiem.jpg'):
        self.client.force_authenticate(self.lab_user)
        selected_test = lab_test or self.lab_test
        return self.client.post(
            '/medical-attachments/',
            {
                'encounter': selected_test.encounter_id,
                'lab_test': selected_test.id,
                'title': 'Ảnh kết quả xét nghiệm',
                'file': SimpleUploadedFile(
                    name,
                    b'jpeg test image',
                    content_type='image/jpeg',
                ),
            },
            format='multipart',
        )

    def test_doctor_can_upload_download_and_see_attachment_in_history(self):
        upload_response = self._upload()
        self.assertEqual(upload_response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn('file', upload_response.data)
        self.assertEqual(upload_response.data['file_name'], 'ket-qua.pdf')
        self.assertTrue(upload_response.data['active'], upload_response.data)

        attachment_id = upload_response.data['id']
        self.assertTrue(
            MedicalAttachment.objects.filter(pk=attachment_id).exists(),
            upload_response.data,
        )
        list_response = self.client.get('/medical-attachments/')
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        listed = list_response.data.get('results', list_response.data)
        self.assertIn(attachment_id, [item['id'] for item in listed])
        download_response = self.client.get(
            f'/medical-attachments/{attachment_id}/download/'
        )
        self.assertEqual(download_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            b''.join(download_response.streaming_content),
            b'%PDF-1.4 test document',
        )

        history_response = self.client.get(
            f'/medical-records/{self.medical_record.id}/'
        )
        self.assertEqual(history_response.status_code, status.HTTP_200_OK)
        attachments = history_response.data['visits'][0]['encounters'][0]['attachments']
        self.assertEqual(attachments[0]['id'], attachment_id)
        self.assertEqual(attachments[0]['file_name'], 'ket-qua.pdf')

        self.assertTrue(AuditLog.objects.filter(
            actor=self.doctor_user,
            action=AuditLog.Action.CREATE,
            resource_type='MedicalAttachment',
            resource_id=str(attachment_id),
        ).exists())
        self.assertTrue(AuditLog.objects.filter(
            actor=self.doctor_user,
            action=AuditLog.Action.VIEW,
            resource_type='MedicalAttachment',
            resource_id=str(attachment_id),
        ).exists())

    def test_attachment_rejects_invalid_extension_and_unrelated_role(self):
        invalid_response = self._upload(name='chuong-trinh.exe', content=b'MZ')
        self.assertEqual(invalid_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('file', invalid_response.data)
        self.assertFalse(MedicalAttachment.objects.exists())

        self.client.force_authenticate(self.nurse_user)
        forbidden_response = self.client.get('/medical-attachments/')
        self.assertEqual(forbidden_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_lab_technician_uploads_file_for_processing_test(self):
        response = self._upload_lab_attachment()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['encounter'], self.encounter.id)
        self.assertEqual(response.data['lab_test'], self.lab_test.id)
        self.assertEqual(
            response.data['lab_test_detail']['name'],
            self.lab_catalog.name,
        )
        attachment = MedicalAttachment.objects.get(pk=response.data['id'])
        self.assertEqual(attachment.uploaded_by, self.lab_staff)
        self.assertEqual(attachment.lab_test, self.lab_test)

        list_response = self.client.get(
            f'/medical-attachments/?lab_test={self.lab_test.id}'
        )
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        listed = list_response.data.get('results', list_response.data)
        self.assertEqual([item['id'] for item in listed], [attachment.id])

    def test_lab_attachment_is_scoped_and_locked_after_completion(self):
        other_catalog = LabTestCatalog.objects.create(
            code='ATT-BIO',
            name='Sinh hóa ngoài đơn vị',
            category='Sinh hóa',
            specimen_type='Máu',
        )
        other_test = LabTest.objects.create(
            encounter=self.encounter,
            test_catalog=other_catalog,
            ordered_by=self.doctor,
            status=LabTest.Status.PROCESSING,
        )
        forbidden_response = self._upload_lab_attachment(lab_test=other_test)
        self.assertEqual(forbidden_response.status_code, status.HTTP_403_FORBIDDEN)

        upload_response = self._upload_lab_attachment()
        attachment_id = upload_response.data['id']
        self.lab_test.status = LabTest.Status.COMPLETED
        self.lab_test.result = 'Kết quả đã chốt'
        self.lab_test.save(update_fields=['status', 'result', 'updated_at'])

        create_response = self._upload_lab_attachment(name='bo-sung.jpg')
        delete_response = self.client.delete(
            f'/medical-attachments/{attachment_id}/'
        )
        self.assertEqual(create_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(delete_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(MedicalAttachment.objects.filter(pk=attachment_id).exists())

    def test_completed_encounter_attachment_is_read_only_for_doctor(self):
        upload_response = self._upload()
        attachment_id = upload_response.data['id']
        self.encounter.status = Encounter.Status.COMPLETED
        self.encounter.diagnosis = 'Đã có kết luận'
        self.encounter.save(update_fields=['status', 'diagnosis', 'updated_at'])

        create_response = self._upload(name='bo-sung.pdf')
        delete_response = self.client.delete(
            f'/medical-attachments/{attachment_id}/'
        )
        self.assertEqual(create_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(delete_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(MedicalAttachment.objects.filter(pk=attachment_id).exists())

    def test_reception_workflow_creation_is_audited(self):
        self.client.force_authenticate(self.receptionist_user)
        response = self.client.post(
            '/patients/',
            {
                'full_name': 'Bệnh nhân nhật ký',
                'date_of_birth': '2001-01-02',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(AuditLog.objects.filter(
            actor=self.receptionist_user,
            action=AuditLog.Action.CREATE,
            resource_type='Patient',
            resource_id=str(response.data['id']),
        ).exists())
