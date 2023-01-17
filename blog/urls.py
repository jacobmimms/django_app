from django.urls import path
from django.conf.urls import include
from . import views
from .views import Login, Logout, ProfileUpdate
from django.contrib.auth.views import LogoutView, PasswordChangeView

app_name = "blog"
urlpatterns = [
    # path("__reload__/", include("django_browser_reload.urls")),

    path('', views.index, name='index'),

    path('login/', Login.as_view(template_name='blog/login.html'), name='login'),
    path('logout/', LogoutView.as_view(next_page='blog:index'), name='logout'),
    # path('register/', Register.as_view(template_name='register.html'), name='register'),
    path("register/", views.register, name="register"),
    path('profile/<int:pk>/', views.profile, name='profile'),
    path('profile/<int:pk>/update/', ProfileUpdate.as_view(template_name='blog/profile_update.html'), name='profile_update'),
    path('change_password/', PasswordChangeView.as_view(template_name='blog/change_password.html'), name='change_password'),


    path('<int:pk>/post/comment', views.comment, name='comment'),
    path('<int:pk>/post/comment/vote', views.comment_vote, name='comment_vote'),

    path('new_post/', views.new_post, name='new_post'),
    path('<int:pk>/post/', views.post, name='post'),
    path('<int:pk>/post/vote', views.post_vote, name='post_vote'),

]