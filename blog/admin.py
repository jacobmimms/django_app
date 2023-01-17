from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Post, Comment, User

class UserAdmin(BaseUserAdmin):
    inlines = (User,)

admin.site.register(Post)
admin.site.register(Comment)
admin.site.register(User)
