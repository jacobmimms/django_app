# Generated by Django 4.1.5 on 2023-02-26 11:57

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('blog', '0003_user_spotify_token_expires_at'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='spotify_token_expires_at',
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
    ]
