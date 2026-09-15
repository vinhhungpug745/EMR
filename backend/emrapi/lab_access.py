LAB_UNIT_CATEGORY_ALIASES = {
    'Huyết học': ['Huyết học', 'Đông máu'],
    'Hóa sinh': ['Sinh hóa', 'Hóa sinh', 'Nội tiết', 'Nước tiểu'],
    'Vi sinh': ['Vi sinh', 'Ký sinh trùng'],
    'Miễn dịch': ['Miễn dịch'],
}


def get_lab_categories_for_staff(staff):
    technician_profile = getattr(staff, 'lab_technician_profile', None)
    laboratory_unit = getattr(technician_profile, 'laboratory_unit', None)
    if not laboratory_unit:
        return []
    return LAB_UNIT_CATEGORY_ALIASES.get(laboratory_unit, [laboratory_unit])
