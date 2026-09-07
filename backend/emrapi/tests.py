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
