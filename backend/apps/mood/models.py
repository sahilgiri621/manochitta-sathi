from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel
from .constants import MOOD_CHOICES, MOOD_SCORES


class MoodEntry(TimeStampedModel):
    MOOD_CHOICES = MOOD_CHOICES
    MOOD_SCORES = MOOD_SCORES

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="mood_entries")
    entry_date = models.DateField()
    mood = models.CharField(max_length=20, choices=MOOD_CHOICES)
    stress_level = models.PositiveSmallIntegerField(default=1)
    energy_level = models.PositiveSmallIntegerField(default=1)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ("-entry_date",)
        constraints = [
            models.UniqueConstraint(fields=["user", "entry_date"], name="unique_mood_entry_per_day"),
            models.CheckConstraint(check=models.Q(stress_level__gte=1) & models.Q(stress_level__lte=5), name="stress_level_range"),
            models.CheckConstraint(check=models.Q(energy_level__gte=1) & models.Q(energy_level__lte=5), name="energy_level_range"),
        ]

    @property
    def mood_score(self):
        return self.MOOD_SCORES.get(self.mood, 0)
