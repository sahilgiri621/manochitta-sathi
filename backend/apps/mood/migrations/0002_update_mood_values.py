from django.db import migrations, models


LEGACY_MOOD_MAP = {
    "Mood 1": "happy",
    "Mood 2": "calm",
    "Mood 3": "sad",
    "Mood 4": "anxious",
    "Mood 5": "stressed",
    "Mood 6": "angry",
    "Mood 7": "tired",
    "Mood 8": "motivated",
    "1": "happy",
    "2": "calm",
    "3": "sad",
    "4": "anxious",
    "5": "stressed",
    "6": "angry",
    "7": "tired",
    "8": "motivated",
    "very_low": "sad",
    "low": "tired",
    "neutral": "calm",
    "good": "happy",
    "excellent": "motivated",
    "Happy": "happy",
    "Calm": "calm",
    "Motivated": "motivated",
    "Tired": "tired",
    "Anxious": "anxious",
    "Stressed": "stressed",
    "Sad": "sad",
    "Angry": "angry",
}


def normalize_mood_values(apps, schema_editor):
    MoodEntry = apps.get_model("mood", "MoodEntry")
    for legacy_value, normalized_value in LEGACY_MOOD_MAP.items():
        MoodEntry.objects.filter(mood=legacy_value).update(mood=normalized_value)


class Migration(migrations.Migration):
    dependencies = [
        ("mood", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(normalize_mood_values, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="moodentry",
            name="mood",
            field=models.CharField(
                choices=[
                    ("happy", "Happy"),
                    ("calm", "Calm"),
                    ("motivated", "Motivated"),
                    ("tired", "Tired"),
                    ("anxious", "Anxious"),
                    ("stressed", "Stressed"),
                    ("sad", "Sad"),
                    ("angry", "Angry"),
                ],
                max_length=20,
            ),
        ),
    ]
