from django.utils import timezone


def calculate_years_of_experience(start_date):
    if not start_date:
        return None

    today = timezone.localdate()
    return today.year - start_date.year - (
        (today.month, today.day) < (start_date.month, start_date.day)
    )
