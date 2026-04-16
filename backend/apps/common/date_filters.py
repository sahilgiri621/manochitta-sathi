from datetime import datetime, time, timedelta

from django.db.models import QuerySet
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework.exceptions import ValidationError


def parse_filter_date(raw_value: str | None):
    if not raw_value:
        return None

    parsed = parse_date(raw_value)
    if parsed is None:
        raise ValidationError({"date": "Use YYYY-MM-DD for date filters."})
    return parsed


def filter_queryset_by_date(queryset: QuerySet, field_name: str, raw_value: str | None, *, is_datetime: bool = True):
    selected_date = parse_filter_date(raw_value)
    if selected_date is None:
        return queryset

    if not is_datetime:
        return queryset.filter(**{field_name: selected_date})

    tz = timezone.get_current_timezone()
    start_of_day = timezone.make_aware(datetime.combine(selected_date, time.min), tz)
    end_of_day = start_of_day + timedelta(days=1)
    return queryset.filter(**{f"{field_name}__gte": start_of_day, f"{field_name}__lt": end_of_day})
