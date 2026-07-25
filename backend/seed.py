#!/usr/bin/env python
"""Create realistic synthetic data for local EMR development."""

import os
import random
from datetime import date, datetime, timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django

django.setup()

from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone

from emrapi.models import (
    Appointment,
    Department,
    DoctorProfile,
    Encounter,
    LabTechnicianProfile,
    LabTest,
    MedicalAttachment,
    MedicalRecord,
    Medication,
    NurseProfile,
    Patient,
    Prescription,
    PrescriptionItem,
    ReceptionistProfile,
    StaffProfile,
    VitalSign,
)


SEED_PASSWORD = 'Emr@123456'
RANDOM = random.Random(20260725)
ANCHOR_TIME = timezone.make_aware(datetime(2026, 7, 25, 8, 0))

DEPARTMENT_DATA = [
    ('Khoa Khám bệnh', 'Tiếp nhận, điều phối và tổ chức khám bệnh ngoại trú.'),
    ('Khoa Nội tổng hợp', 'Khám và điều trị các bệnh lý nội khoa.'),
    ('Khoa Nhi', 'Khám và điều trị bệnh nhân trẻ em.'),
    ('Khoa Sản - Phụ khoa', 'Khám thai sản và phụ khoa.'),
    ('Khoa Ngoại tổng hợp', 'Khám và điều trị các bệnh lý ngoại khoa.'),
    ('Khoa Tai Mũi Họng', 'Khám chuyên khoa Tai Mũi Họng.'),
    ('Khoa Da liễu', 'Khám và điều trị các bệnh da liễu.'),
    ('Khoa Cấp cứu', 'Tiếp nhận và xử trí các trường hợp cấp cứu.'),
    ('Khoa Xét nghiệm', 'Thực hiện các xét nghiệm cận lâm sàng.'),
    ('Khoa Chẩn đoán hình ảnh', 'Thực hiện siêu âm và X-quang.'),
    ('Khoa Dược', 'Quản lý và cấp phát thuốc.'),
]

MEDICATION_DATA = [
    ('MED0001', 'Paracetamol', 'Paracetamol', '500 mg', 'Viên nén', 'Viên', Medication.Route.ORAL),
    ('MED0002', 'Natri clorid', 'Natri clorid', '0,9%', 'Dung dịch', 'Chai', Medication.Route.OTHER),
    ('MED0003', 'Amlodipine', 'Amlodipine', '5 mg', 'Viên nén', 'Viên', Medication.Route.ORAL),
    ('MED0004', 'Omeprazole', 'Omeprazole', '20 mg', 'Viên nang', 'Viên', Medication.Route.ORAL),
    ('MED0005', 'Phosphalugel', 'Nhôm phosphat', '20 g', 'Hỗn dịch uống', 'Gói', Medication.Route.ORAL),
    ('MED0006', 'Loratadine', 'Loratadine', '10 mg', 'Viên nén', 'Viên', Medication.Route.ORAL),
    ('MED0007', 'Metformin', 'Metformin', '500 mg', 'Viên nén', 'Viên', Medication.Route.ORAL),
    ('MED0008', 'Eperisone', 'Eperisone', '50 mg', 'Viên nén', 'Viên', Medication.Route.ORAL),
    ('MED0009', 'Acetylcysteine', 'Acetylcysteine', '200 mg', 'Cốm pha uống', 'Gói', Medication.Route.ORAL),
    ('MED0010', 'Betahistine', 'Betahistine', '16 mg', 'Viên nén', 'Viên', Medication.Route.ORAL),
]

MEDICATION_QUANTITIES = {
    'Paracetamol 500 mg': Decimal('10'),
    'Natri clorid 0,9%': Decimal('1'),
    'Amlodipine 5 mg': Decimal('30'),
    'Omeprazole 20 mg': Decimal('14'),
    'Phosphalugel 20 g': Decimal('14'),
    'Loratadine 10 mg': Decimal('7'),
    'Metformin 500 mg': Decimal('60'),
    'Eperisone 50 mg': Decimal('10'),
    'Acetylcysteine 200 mg': Decimal('21'),
    'Betahistine 16 mg': Decimal('20'),
}

STAFF_DATA = [
    {
        'username': 'admin_emr',
        'last_name': 'Nguyễn',
        'first_name': 'Minh Quân',
        'role': StaffProfile.Role.ADMIN,
        'employee_code': 'NV0001',
        'department': None,
        'phone': '0901000001',
    },
    {
        'username': 'tiepnhan.mai',
        'last_name': 'Trần',
        'first_name': 'Ngọc Mai',
        'role': StaffProfile.Role.RECEPTIONIST,
        'employee_code': 'TN0001',
        'department': 'Khoa Khám bệnh',
        'phone': '0901000011',
        'counter_number': 'Quầy 01',
        'shift': 'Ca sáng',
    },
    {
        'username': 'tiepnhan.huong',
        'last_name': 'Lê',
        'first_name': 'Thu Hương',
        'role': StaffProfile.Role.RECEPTIONIST,
        'employee_code': 'TN0002',
        'department': 'Khoa Khám bệnh',
        'phone': '0901000012',
        'counter_number': 'Quầy 02',
        'shift': 'Ca chiều',
    },
    {
        'username': 'tiepnhan.phong',
        'last_name': 'Phạm',
        'first_name': 'Đức Phong',
        'role': StaffProfile.Role.RECEPTIONIST,
        'employee_code': 'TN0003',
        'department': 'Khoa Khám bệnh',
        'phone': '0901000013',
        'counter_number': 'Quầy cấp cứu',
        'shift': 'Ca tối',
    },
    {
        'username': 'dieuduong.lan',
        'last_name': 'Nguyễn',
        'first_name': 'Thị Lan',
        'role': StaffProfile.Role.NURSE,
        'employee_code': 'DD0001',
        'department': 'Khoa Nội tổng hợp',
        'phone': '0901000021',
        'license': 'CCHN-DD-0001',
        'care_unit': 'Buồng khám Nội 01',
    },
    {
        'username': 'dieuduong.thao',
        'last_name': 'Đặng',
        'first_name': 'Thanh Thảo',
        'role': StaffProfile.Role.NURSE,
        'employee_code': 'DD0002',
        'department': 'Khoa Ngoại tổng hợp',
        'phone': '0901000022',
        'license': 'CCHN-DD-0002',
        'care_unit': 'Buồng khám Ngoại 01',
    },
    {
        'username': 'dieuduong.hien',
        'last_name': 'Bùi',
        'first_name': 'Ngọc Hiền',
        'role': StaffProfile.Role.NURSE,
        'employee_code': 'DD0003',
        'department': 'Khoa Nhi',
        'phone': '0901000023',
        'license': 'CCHN-DD-0003',
        'care_unit': 'Buồng khám Nhi 01',
    },
    {
        'username': 'dieuduong.nam',
        'last_name': 'Võ',
        'first_name': 'Hoàng Nam',
        'role': StaffProfile.Role.NURSE,
        'employee_code': 'DD0004',
        'department': 'Khoa Cấp cứu',
        'phone': '0901000024',
        'license': 'CCHN-DD-0004',
        'care_unit': 'Khu lưu bệnh cấp cứu',
    },
    {
        'username': 'dieuduong.trang',
        'last_name': 'Đỗ',
        'first_name': 'Huyền Trang',
        'role': StaffProfile.Role.NURSE,
        'employee_code': 'DD0005',
        'department': 'Khoa Khám bệnh',
        'phone': '0901000025',
        'license': 'CCHN-DD-0005',
        'care_unit': 'Khu đo sinh hiệu',
    },
    {
        'username': 'bacsi.an',
        'last_name': 'Nguyễn',
        'first_name': 'Hoàng An',
        'role': StaffProfile.Role.DOCTOR,
        'employee_code': 'BS0001',
        'department': 'Khoa Nội tổng hợp',
        'phone': '0901000031',
        'specialty': 'Nội tổng quát',
        'license': 'CCHN-BS-0001',
        'academic_title': 'Thạc sĩ, Bác sĩ',
    },
    {
        'username': 'bacsi.linh',
        'last_name': 'Trần',
        'first_name': 'Mỹ Linh',
        'role': StaffProfile.Role.DOCTOR,
        'employee_code': 'BS0002',
        'department': 'Khoa Nội tổng hợp',
        'phone': '0901000032',
        'specialty': 'Tim mạch',
        'license': 'CCHN-BS-0002',
        'academic_title': 'Bác sĩ chuyên khoa I',
    },
    {
        'username': 'bacsi.khoa',
        'last_name': 'Lê',
        'first_name': 'Đăng Khoa',
        'role': StaffProfile.Role.DOCTOR,
        'employee_code': 'BS0003',
        'department': 'Khoa Ngoại tổng hợp',
        'phone': '0901000033',
        'specialty': 'Ngoại tổng quát',
        'license': 'CCHN-BS-0003',
        'academic_title': 'Bác sĩ chuyên khoa I',
    },
    {
        'username': 'bacsi.ha',
        'last_name': 'Phạm',
        'first_name': 'Thu Hà',
        'role': StaffProfile.Role.DOCTOR,
        'employee_code': 'BS0004',
        'department': 'Khoa Nhi',
        'phone': '0901000034',
        'specialty': 'Nhi khoa',
        'license': 'CCHN-BS-0004',
        'academic_title': 'Thạc sĩ, Bác sĩ',
    },
    {
        'username': 'bacsi.son',
        'last_name': 'Vũ',
        'first_name': 'Minh Sơn',
        'role': StaffProfile.Role.DOCTOR,
        'employee_code': 'BS0005',
        'department': 'Khoa Cấp cứu',
        'phone': '0901000035',
        'specialty': 'Hồi sức cấp cứu',
        'license': 'CCHN-BS-0005',
        'academic_title': 'Bác sĩ chuyên khoa II',
    },
    {
        'username': 'bacsi.ngan',
        'last_name': 'Bùi',
        'first_name': 'Kim Ngân',
        'role': StaffProfile.Role.DOCTOR,
        'employee_code': 'BS0006',
        'department': 'Khoa Nội tổng hợp',
        'phone': '0901000036',
        'specialty': 'Nội tiết',
        'license': 'CCHN-BS-0006',
        'academic_title': 'Bác sĩ chuyên khoa I',
    },
    {
        'username': 'bacsi.tuan',
        'last_name': 'Đỗ',
        'first_name': 'Anh Tuấn',
        'role': StaffProfile.Role.DOCTOR,
        'employee_code': 'BS0007',
        'department': 'Khoa Nội tổng hợp',
        'phone': '0901000037',
        'specialty': 'Hô hấp',
        'license': 'CCHN-BS-0007',
        'academic_title': 'Bác sĩ',
    },
    {
        'username': 'bacsi.vy',
        'last_name': 'Hoàng',
        'first_name': 'Thảo Vy',
        'role': StaffProfile.Role.DOCTOR,
        'employee_code': 'BS0008',
        'department': 'Khoa Khám bệnh',
        'phone': '0901000038',
        'specialty': 'Y học gia đình',
        'license': 'CCHN-BS-0008',
        'academic_title': 'Bác sĩ',
    },
    {
        'username': 'xetnghiem.hai',
        'last_name': 'Nguyễn',
        'first_name': 'Quang Hải',
        'role': StaffProfile.Role.LAB_TECHNICIAN,
        'employee_code': 'XN0001',
        'department': 'Khoa Xét nghiệm',
        'phone': '0901000041',
        'laboratory_unit': 'Huyết học',
        'license': 'CC-XN-0001',
    },
    {
        'username': 'xetnghiem.yen',
        'last_name': 'Trần',
        'first_name': 'Hải Yến',
        'role': StaffProfile.Role.LAB_TECHNICIAN,
        'employee_code': 'XN0002',
        'department': 'Khoa Xét nghiệm',
        'phone': '0901000042',
        'laboratory_unit': 'Sinh hóa',
        'license': 'CC-XN-0002',
    },
    {
        'username': 'xetnghiem.long',
        'last_name': 'Phan',
        'first_name': 'Thành Long',
        'role': StaffProfile.Role.LAB_TECHNICIAN,
        'employee_code': 'XN0003',
        'department': 'Khoa Xét nghiệm',
        'phone': '0901000043',
        'laboratory_unit': 'Vi sinh',
        'license': 'CC-XN-0003',
    },
    {
        'username': 'xetnghiem.quynh',
        'last_name': 'Lê',
        'first_name': 'Như Quỳnh',
        'role': StaffProfile.Role.LAB_TECHNICIAN,
        'employee_code': 'XN0004',
        'department': 'Khoa Xét nghiệm',
        'phone': '0901000044',
        'laboratory_unit': 'Miễn dịch',
        'license': 'CC-XN-0004',
    },
]

CLINICAL_CASES = [
    {
        'reason': 'Ho, đau họng và sốt nhẹ',
        'diagnosis': 'Viêm họng cấp',
        'plan': 'Điều trị triệu chứng, uống đủ nước và theo dõi nhiệt độ.',
        'medicines': [
            ('Paracetamol 500 mg', '1 viên', '2 lần/ngày khi sốt', '3 ngày', 'Uống sau ăn'),
            ('Natri clorid 0,9%', '10 ml', '3 lần/ngày', '5 ngày', 'Súc họng'),
        ],
        'tests': [('Công thức máu', 'Bạch cầu 8,2 G/L; Hemoglobin 138 g/L; Tiểu cầu 265 G/L.')],
    },
    {
        'reason': 'Đau đầu, huyết áp tăng',
        'diagnosis': 'Tăng huyết áp nguyên phát',
        'plan': 'Điều chỉnh chế độ ăn giảm muối, theo dõi huyết áp tại nhà.',
        'medicines': [
            ('Amlodipine 5 mg', '1 viên', '1 lần/ngày', '30 ngày', 'Uống buổi sáng'),
        ],
        'tests': [
            ('Đường huyết lúc đói', 'Glucose: 5,4 mmol/L.'),
            ('Chức năng thận', 'Creatinine: 82 µmol/L; eGFR: 92 mL/phút/1,73m².'),
        ],
    },
    {
        'reason': 'Đau thượng vị, đầy bụng sau ăn',
        'diagnosis': 'Viêm dạ dày',
        'plan': 'Ăn đúng giờ, hạn chế đồ cay nóng, tái khám nếu đau tăng.',
        'medicines': [
            ('Omeprazole 20 mg', '1 viên', '1 lần/ngày', '14 ngày', 'Uống trước ăn sáng 30 phút'),
            ('Phosphalugel 20 g', '1 gói', '2 lần/ngày', '7 ngày', 'Uống sau ăn'),
        ],
        'tests': [('Test Helicobacter pylori', 'Âm tính.')],
    },
    {
        'reason': 'Hắt hơi, nghẹt mũi kéo dài',
        'diagnosis': 'Viêm mũi dị ứng',
        'plan': 'Hạn chế tiếp xúc dị nguyên, vệ sinh mũi hằng ngày.',
        'medicines': [
            ('Loratadine 10 mg', '1 viên', '1 lần/ngày', '7 ngày', 'Uống buổi tối'),
        ],
        'tests': [],
    },
    {
        'reason': 'Khát nhiều, tiểu nhiều và mệt mỏi',
        'diagnosis': 'Đái tháo đường type 2',
        'plan': 'Tư vấn dinh dưỡng, vận động và kiểm soát đường huyết.',
        'medicines': [
            ('Metformin 500 mg', '1 viên', '2 lần/ngày', '30 ngày', 'Uống sau ăn'),
        ],
        'tests': [
            ('HbA1c', 'HbA1c: 7,1%.'),
            ('Đường huyết lúc đói', 'Glucose: 7,8 mmol/L.'),
        ],
    },
    {
        'reason': 'Đau vùng thắt lưng sau vận động',
        'diagnosis': 'Đau lưng cơ học',
        'plan': 'Nghỉ ngơi tương đối, tập giãn cơ nhẹ và tránh mang vật nặng.',
        'medicines': [
            ('Paracetamol 500 mg', '1 viên', '2 lần/ngày', '5 ngày', 'Uống sau ăn'),
            ('Eperisone 50 mg', '1 viên', '2 lần/ngày', '5 ngày', 'Uống sau ăn'),
        ],
        'tests': [],
    },
    {
        'reason': 'Ho có đờm, tức ngực nhẹ',
        'diagnosis': 'Viêm phế quản cấp',
        'plan': 'Theo dõi hô hấp, uống ấm và tái khám khi khó thở.',
        'medicines': [
            ('Acetylcysteine 200 mg', '1 gói', '3 lần/ngày', '7 ngày', 'Hòa tan trong nước'),
            ('Paracetamol 500 mg', '1 viên', '2 lần/ngày khi sốt', '3 ngày', 'Uống sau ăn'),
        ],
        'tests': [('Công thức máu', 'Bạch cầu 10,1 G/L; CRP 8 mg/L.')],
    },
    {
        'reason': 'Chóng mặt khi thay đổi tư thế',
        'diagnosis': 'Rối loạn tiền đình ngoại biên',
        'plan': 'Nghỉ ngơi, thay đổi tư thế chậm và theo dõi triệu chứng.',
        'medicines': [
            ('Betahistine 16 mg', '1 viên', '2 lần/ngày', '10 ngày', 'Uống sau ăn'),
        ],
        'tests': [('Công thức máu', 'Các chỉ số huyết học trong giới hạn tham chiếu.')],
    },
]

FAMILY_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ']
MIDDLE_NAMES = ['Văn', 'Thị', 'Minh', 'Ngọc', 'Thanh', 'Quốc', 'Gia', 'Hoài', 'Đức', 'Phương']
MALE_NAMES = ['Hùng', 'Nam', 'Tuấn', 'Khang', 'Phúc', 'Duy', 'Long', 'Bảo', 'Khôi', 'Thành']
FEMALE_NAMES = ['Anh', 'Linh', 'Mai', 'Hương', 'Trang', 'Thảo', 'Vy', 'Nhi', 'Ngân', 'Yến']
ADDRESSES = [
    'Quận Hải Châu, Thành phố Đà Nẵng',
    'Quận Thanh Khê, Thành phố Đà Nẵng',
    'Quận Sơn Trà, Thành phố Đà Nẵng',
    'Quận Liên Chiểu, Thành phố Đà Nẵng',
    'Quận Cẩm Lệ, Thành phố Đà Nẵng',
    'Huyện Hòa Vang, Thành phố Đà Nẵng',
    'Thành phố Hội An, Tỉnh Quảng Nam',
    'Thị xã Điện Bàn, Tỉnh Quảng Nam',
]
ALLERGIES = [
    None,
    None,
    None,
    'Dị ứng Penicillin.',
    'Dị ứng hải sản.',
    'Dị ứng phấn hoa.',
    'Chưa ghi nhận dị ứng thuốc.',
]
MEDICAL_HISTORIES = [
    'Chưa ghi nhận bệnh nền.',
    'Tiền sử tăng huyết áp.',
    'Tiền sử viêm dạ dày.',
    'Tiền sử đái tháo đường type 2.',
    'Tiền sử hen phế quản thời thơ ấu.',
    'Gia đình có người mắc bệnh tim mạch.',
]


def seed_departments():
    departments = {}
    for name, description in DEPARTMENT_DATA:
        department, _ = Department.objects.update_or_create(
            name=name,
            defaults={
                'description': description,
                'active': True,
            },
        )
        departments[name] = department
    return departments


def seed_medications():
    medications = {}
    for code, name, ingredient, strength, dosage_form, unit, route in MEDICATION_DATA:
        medication, _ = Medication.objects.update_or_create(
            code=code,
            defaults={
                'name': name,
                'active_ingredient': ingredient,
                'strength': strength,
                'dosage_form': dosage_form,
                'unit': unit,
                'route': route,
                'active': True,
            },
        )
        medications[f'{name} {strength}'] = medication
    return medications


def seed_staff(departments):
    staff_by_role = {
        StaffProfile.Role.ADMIN: [],
        StaffProfile.Role.RECEPTIONIST: [],
        StaffProfile.Role.NURSE: [],
        StaffProfile.Role.DOCTOR: [],
        StaffProfile.Role.LAB_TECHNICIAN: [],
    }

    for data in STAFF_DATA:
        role_position = len(staff_by_role[data['role']])
        user, _ = User.objects.update_or_create(
            username=data['username'],
            defaults={
                'first_name': data['first_name'],
                'last_name': data['last_name'],
                'email': f"{data['username']}@emr.local",
                'is_active': True,
                'is_staff': data['role'] == StaffProfile.Role.ADMIN,
                'is_superuser': data['role'] == StaffProfile.Role.ADMIN,
            },
        )
        user.set_password(SEED_PASSWORD)
        user.save(update_fields=['password'])

        staff, _ = StaffProfile.objects.update_or_create(
            user=user,
            defaults={
                'department': departments.get(data['department']),
                'role': data['role'],
                'employee_code': data['employee_code'],
                'phone': data['phone'],
                'active': True,
            },
        )
        staff_by_role[data['role']].append(staff)

        if data['role'] == StaffProfile.Role.RECEPTIONIST:
            ReceptionistProfile.objects.update_or_create(
                staff=staff,
                defaults={
                    'counter_number': data['counter_number'],
                    'shift': data['shift'],
                    'assigned_area': data.get('assigned_area', data['counter_number']),
                    'handles_health_insurance': role_position % 2 == 0,
                    'career_start_date': date(2017 + role_position, 3, 1),
                    'active': True,
                },
            )
        elif data['role'] == StaffProfile.Role.NURSE:
            NurseProfile.objects.update_or_create(
                staff=staff,
                defaults={
                    'nursing_license_number': data['license'],
                    'care_unit': data['care_unit'],
                    'professional_qualification': (
                        'Cử nhân Điều dưỡng'
                        if role_position % 2 == 0
                        else 'Cao đẳng Điều dưỡng'
                    ),
                    'professional_rank': (
                        'Điều dưỡng hạng III'
                        if role_position % 2 == 0
                        else 'Điều dưỡng hạng IV'
                    ),
                    'practice_start_date': date(2014 + role_position, 6, 1),
                    'shift': ['Ca sáng', 'Ca chiều', 'Ca tối'][role_position % 3],
                    'active': True,
                },
            )
        elif data['role'] == StaffProfile.Role.DOCTOR:
            DoctorProfile.objects.update_or_create(
                staff=staff,
                defaults={
                    'specialty': data['specialty'],
                    'license_number': data['license'],
                    'academic_title': data['academic_title'],
                    'degree': (
                        'Bác sĩ chuyên khoa I'
                        if role_position % 3 == 0
                        else 'Bác sĩ đa khoa'
                    ),
                    'license_issue_date': date(2011 + role_position, 5, 15),
                    'license_issued_by': 'Bộ Y tế',
                    'practice_start_date': date(2010 + role_position, 1, 10),
                    'scope_of_practice': f'Khám và điều trị chuyên khoa {data["specialty"]}.',
                    'consultation_room': f'Phòng khám {role_position + 1:02d}',
                    'active': True,
                },
            )
        elif data['role'] == StaffProfile.Role.LAB_TECHNICIAN:
            LabTechnicianProfile.objects.update_or_create(
                staff=staff,
                defaults={
                    'laboratory_unit': data['laboratory_unit'],
                    'certification_number': data['license'],
                    'specialization': data['laboratory_unit'],
                    'professional_qualification': (
                        'Cử nhân Kỹ thuật xét nghiệm y học'
                        if role_position % 2 == 0
                        else 'Cao đẳng Kỹ thuật xét nghiệm y học'
                    ),
                    'practice_start_date': date(2015 + role_position, 8, 1),
                    'active': True,
                },
            )

    return staff_by_role


def build_patient_name(index):
    gender = Patient.Gender.MALE if index % 2 == 0 else Patient.Gender.FEMALE
    given_names = MALE_NAMES if gender == Patient.Gender.MALE else FEMALE_NAMES
    full_name = (
        f'{FAMILY_NAMES[index % len(FAMILY_NAMES)]} '
        f'{MIDDLE_NAMES[(index * 3) % len(MIDDLE_NAMES)]} '
        f'{given_names[(index * 7) % len(given_names)]}'
    )
    return full_name, gender


def seed_patients_and_records(receptionists):
    patients = []
    for index in range(50):
        number = index + 1
        full_name, gender = build_patient_name(index)
        birth_year = 1952 + ((index * 7) % 64)
        birth_date = date(birth_year, (index % 12) + 1, ((index * 5) % 27) + 1)
        citizen_id = f'0792{number:08d}'

        patient, _ = Patient.objects.update_or_create(
            citizen_id=citizen_id,
            defaults={
                'full_name': full_name,
                'date_of_birth': birth_date,
                'gender': gender,
                'phone': f'09{number + 10000000:08d}',
                'email': f'benhnhan{number:03d}@example.test',
                'address': ADDRESSES[index % len(ADDRESSES)],
                'health_insurance_code': f'DN401{number:010d}',
                'emergency_contact_name': f'Người nhà của {full_name}',
                'emergency_contact_phone': f'08{number + 20000000:08d}',
                'active': True,
            },
        )
        record, _ = MedicalRecord.objects.update_or_create(
            patient=patient,
            defaults={
                'record_number': f'EMR-2026-{number:05d}',
                'blood_type': ['A+', 'A-', 'B+', 'B-', 'AB+', 'O+', 'O-'][index % 7],
                'allergies': ALLERGIES[index % len(ALLERGIES)],
                'medical_history': MEDICAL_HISTORIES[index % len(MEDICAL_HISTORIES)],
                'created_by': receptionists[index % len(receptionists)],
                'active': True,
            },
        )
        patients.append((patient, record))
    return patients


def decimal_value(value):
    return Decimal(str(round(value, 1)))


def seed_encounter_details(encounter, case, doctor, technician, medications):
    prescription, _ = Prescription.objects.update_or_create(
        encounter=encounter,
        note='Đơn thuốc điều trị ngoại trú.',
        defaults={
            'prescribed_by': doctor,
            'status': Prescription.Status.ISSUED,
            'active': True,
        },
    )
    Prescription.objects.filter(pk=prescription.pk).update(
        created_at=encounter.visit_date + timedelta(minutes=30),
    )
    for medicine_name, dosage, frequency, duration, instruction in case['medicines']:
        medication = medications[medicine_name]
        PrescriptionItem.objects.update_or_create(
            prescription=prescription,
            medication=medication,
            defaults={
                'dosage': dosage,
                'frequency': frequency,
                'duration': duration,
                'quantity': MEDICATION_QUANTITIES[medicine_name],
                'instruction': instruction,
                'active': True,
            },
        )

    for test_name, result in case['tests']:
        lab_test, _ = LabTest.objects.update_or_create(
            encounter=encounter,
            test_name=test_name,
            defaults={
                'ordered_by': doctor,
                'performed_by': technician,
                'performed_at': encounter.visit_date + timedelta(hours=2),
                'result': result,
                'status': LabTest.Status.COMPLETED,
                'active': True,
            },
        )
        LabTest.objects.filter(pk=lab_test.pk).update(
            ordered_at=encounter.visit_date + timedelta(minutes=20),
        )


def seed_encounters(patients, staff_by_role, medications):
    receptionists = staff_by_role[StaffProfile.Role.RECEPTIONIST]
    nurses = staff_by_role[StaffProfile.Role.NURSE]
    doctors = [
        staff.doctor_profile
        for staff in staff_by_role[StaffProfile.Role.DOCTOR]
    ]
    technicians = [
        staff.lab_technician_profile
        for staff in staff_by_role[StaffProfile.Role.LAB_TECHNICIAN]
    ]

    for patient_index, (patient, record) in enumerate(patients):
        visit_count = 1 + patient_index % 4
        for visit_index in range(visit_count):
            case = CLINICAL_CASES[(patient_index + visit_index) % len(CLINICAL_CASES)]
            doctor = doctors[(patient_index + visit_index) % len(doctors)]
            nurse = nurses[(patient_index + visit_index) % len(nurses)]
            technician = technicians[(patient_index + visit_index) % len(technicians)]
            receptionist = receptionists[patient_index % len(receptionists)]

            days_ago = (visit_count - visit_index) * 70 + patient_index * 3
            visit_at = ANCHOR_TIME - timedelta(days=days_ago)
            encounter_status = Encounter.Status.COMPLETED
            appointment_status = Appointment.Status.COMPLETED

            if patient_index == 0 and visit_index == visit_count - 1:
                visit_at = ANCHOR_TIME
                encounter_status = Encounter.Status.CHECKED_IN
                appointment_status = Appointment.Status.CHECKED_IN
            elif patient_index == 1 and visit_index == visit_count - 1:
                visit_at = ANCHOR_TIME + timedelta(minutes=30)
                encounter_status = Encounter.Status.IN_PROGRESS
                appointment_status = Appointment.Status.CHECKED_IN

            appointment, _ = Appointment.objects.update_or_create(
                patient=patient,
                scheduled_at=visit_at,
                defaults={
                    'doctor': doctor,
                    'reason': case['reason'],
                    'status': appointment_status,
                    'note': 'Dữ liệu lịch hẹn phục vụ kiểm thử.',
                    'created_by': receptionist,
                    'checked_in_by': receptionist,
                    'active': True,
                },
            )
            Appointment.objects.filter(pk=appointment.pk).update(
                created_at=visit_at - timedelta(days=2),
            )

            is_completed = encounter_status == Encounter.Status.COMPLETED
            encounter, _ = Encounter.objects.update_or_create(
                medical_record=record,
                visit_date=visit_at,
                defaults={
                    'appointment': appointment,
                    'doctor': doctor,
                    'encounter_type': (
                        Encounter.EncounterType.EMERGENCY
                        if patient_index % 13 == 0
                        else Encounter.EncounterType.OUTPATIENT
                    ),
                    'status': encounter_status,
                    'chief_complaint': case['reason'],
                    'diagnosis': case['diagnosis'] if is_completed else None,
                    'treatment_plan': case['plan'] if is_completed else None,
                    'follow_up_date': (
                        (visit_at + timedelta(days=14)).date()
                        if is_completed
                        else None
                    ),
                    'created_by': receptionist,
                    'active': True,
                },
            )
            Encounter.objects.filter(pk=encounter.pk).update(created_at=visit_at)

            vital_sign, _ = VitalSign.objects.update_or_create(
                encounter=encounter,
                recorded_by=nurse,
                defaults={
                    'temperature': decimal_value(36.4 + RANDOM.random() * 1.4),
                    'pulse': 66 + (patient_index * 7 + visit_index) % 34,
                    'systolic_bp': 108 + (patient_index * 5 + visit_index) % 35,
                    'diastolic_bp': 68 + (patient_index * 3 + visit_index) % 22,
                    'respiratory_rate': 16 + (patient_index + visit_index) % 6,
                    'height_cm': decimal_value(150 + (patient_index * 3.7) % 31),
                    'weight_kg': decimal_value(45 + (patient_index * 2.9) % 38),
                    'active': True,
                },
            )
            VitalSign.objects.filter(pk=vital_sign.pk).update(
                created_at=visit_at + timedelta(minutes=10),
            )

            if is_completed:
                seed_encounter_details(
                    encounter,
                    case,
                    doctor,
                    technician,
                    medications,
                )

            if patient_index % 5 == 0 and visit_index == 0:
                attachment, _ = MedicalAttachment.objects.update_or_create(
                    encounter=encounter,
                    title='Phiếu kết quả khám tổng hợp',
                    defaults={
                        'uploaded_by': doctor.staff,
                        'description': 'Tệp minh họa dùng để kiểm thử giao diện.',
                        'active': True,
                    },
                )
                if not attachment.file or not attachment.file.storage.exists(attachment.file.name):
                    attachment.file.save(
                        f'ket-qua-{record.record_number}.txt',
                        ContentFile(
                            (
                                f'PHIẾU KẾT QUẢ KHÁM\n'
                                f'Mã hồ sơ: {record.record_number}\n'
                                f'Bệnh nhân: {patient.full_name}\n'
                                f'Ngày khám: {visit_at:%d/%m/%Y %H:%M}\n'
                                f'Chẩn đoán: {case["diagnosis"]}\n'
                                f'Kế hoạch điều trị: {case["plan"]}\n'
                            ).encode('utf-8')
                        ),
                        save=True,
                    )

    for index, (patient, _) in enumerate(patients[:20]):
        doctor = doctors[index % len(doctors)]
        receptionist = receptionists[index % len(receptionists)]
        scheduled_at = ANCHOR_TIME + timedelta(days=7 + index, hours=index % 5)
        status = Appointment.Status.CANCELLED if index % 7 == 0 else Appointment.Status.SCHEDULED
        Appointment.objects.update_or_create(
            patient=patient,
            scheduled_at=scheduled_at,
            defaults={
                'doctor': doctor,
                'reason': CLINICAL_CASES[index % len(CLINICAL_CASES)]['reason'],
                'status': status,
                'note': 'Lịch hẹn tái khám.',
                'created_by': receptionist,
                'checked_in_by': None,
                'active': True,
            },
        )


def print_summary():
    print('\nSeed dữ liệu EMR thành công.')
    print(f'  Khoa/phòng:       {Department.objects.count()}')
    print(f'  Nhân viên:        {StaffProfile.objects.count()}')
    print(f'  Bệnh nhân:        {Patient.objects.count()}')
    print(f'  Hồ sơ EMR:        {MedicalRecord.objects.count()}')
    print(f'  Lịch hẹn:         {Appointment.objects.count()}')
    print(f'  Lần khám:         {Encounter.objects.count()}')
    print(f'  Bản ghi sinh hiệu:{VitalSign.objects.count():>9}')
    print(f'  Danh mục thuốc:   {Medication.objects.count()}')
    print(f'  Đơn thuốc:        {Prescription.objects.count()}')
    print(f'  Thuốc trong đơn:  {PrescriptionItem.objects.count()}')
    print(f'  Xét nghiệm:       {LabTest.objects.count()}')
    print(f'  Tệp đính kèm:     {MedicalAttachment.objects.count()}')
    print('\nTài khoản quản trị demo:')
    print('  Username: admin_emr')
    print(f'  Password: {SEED_PASSWORD}')
    print(f'\nMật khẩu chung của tất cả tài khoản nhân viên: {SEED_PASSWORD}')


@transaction.atomic
def run():
    departments = seed_departments()
    medications = seed_medications()
    staff_by_role = seed_staff(departments)
    patients = seed_patients_and_records(
        staff_by_role[StaffProfile.Role.RECEPTIONIST]
    )
    seed_encounters(patients, staff_by_role, medications)
    print_summary()


if __name__ == '__main__':
    run()
