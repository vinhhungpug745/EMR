from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from emrapi.models import StaffProfile


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
