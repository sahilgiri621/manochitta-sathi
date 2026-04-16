from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="google_sub",
            field=models.CharField(blank=True, max_length=255, null=True, unique=True),
        ),
        migrations.AddIndex(
            model_name="user",
            index=models.Index(fields=["google_sub"], name="accounts_us_google__3a6c13_idx"),
        ),
    ]
