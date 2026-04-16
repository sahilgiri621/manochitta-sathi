from rest_framework import serializers

from .models import MoodEntry


class MoodEntrySerializer(serializers.ModelSerializer):
    mood_label = serializers.CharField(source="get_mood_display", read_only=True)
    mood_score = serializers.IntegerField(read_only=True)

    class Meta:
        model = MoodEntry
        fields = (
            "id",
            "entry_date",
            "mood",
            "mood_label",
            "mood_score",
            "stress_level",
            "energy_level",
            "notes",
            "created_at",
            "updated_at",
        )

    def validate_entry_date(self, value):
        user = self.context["request"].user
        queryset = MoodEntry.objects.filter(user=user, entry_date=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("You already created a mood entry for this date.")
        return value
