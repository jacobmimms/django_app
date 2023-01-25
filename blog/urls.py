from django.urls import path
from . import views
from django.contrib.auth.views import LogoutView, PasswordChangeView

app_name = "blog"
urlpatterns = [
    path('', views.index, name='index'),
    path('3d/', views.three, name='3d'),

    path('login/', views.Login.as_view(template_name='blog/login.html'), name='login'),
    path('logout/', LogoutView.as_view(next_page='blog:index'), name='logout'),
    path("register/", views.register, name="register"),
    path('change_password/', PasswordChangeView.as_view(template_name='blog/change_password.html'), name='change_password'),
    
    path('profile/<int:pk>/', views.profile, name='profile'),
    path('profile/friends/', views.friends, name='friends'),

    path('<int:pk>/post/comment', views.comment, name='comment'),
    path('<int:pk>/post/comment/vote', views.vote, name='vote'),

    path('new_post/', views.new_post, name='new_post'),
    path('<int:pk>/post/', views.post, name='post'), 


    path('vote', views.vote, name='vote'), 
]