# Generated by Django 4.1.5 on 2023-01-20 11:41

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('blog', '0005_comment_is_reply_comment_parent_comment'),
    ]

    operations = [
        migrations.AddField(
            model_name='comment',
            name='children_comments',
            field=models.ManyToManyField(blank=True, to='blog.comment'),
        ),
    ]
