from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("feedback", "0003_rename_feedback_fe_therapi_5bec02_idx_feedback_fe_therapi_bfa0b3_idx_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="feedback",
            name="service_rating",
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddConstraint(
            model_name="feedback",
            constraint=models.CheckConstraint(
                check=models.Q(("service_rating__isnull", True))
                | (models.Q(("service_rating__gte", 1)) & models.Q(("service_rating__lte", 5))),
                name="feedback_service_rating_range",
            ),
        ),
    ]
