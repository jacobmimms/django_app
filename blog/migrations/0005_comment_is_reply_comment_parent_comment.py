# Generated by Django 4.1.5 on 2023-01-20 10:26

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('blog', '0004_rename_users_downvoted_comment_comment_users_downvoted_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='comment',
            name='is_reply',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='comment',
            name='parent_comment',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='blog.comment'),
        ),
    ]
