from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("therapists", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="therapistprofile",
            name="bio",
            field=models.TextField(blank=True),
        ),
    ]
