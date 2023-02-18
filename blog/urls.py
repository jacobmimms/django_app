from django.urls import path
from . import views
from django.contrib.auth.views import LogoutView, PasswordChangeView
app_name = "blog"
urlpatterns = [
    path('', views.index, name='index'),
    path('spotify/', views.Spotify.as_view(), name='Spotify'),
    path('spotify/login/', views.SpotifyLogin.as_view(), name='spotify_login'),
    path('spotify/redirect/', views.SpotifyCallback.as_view(), name='spotify_redirect'),
    path('spotify/<str:artist_name>/<str:song_name>/<str:song_id>', views.SpotifySongView.as_view(), name='spotify_song_view'),

    path('3d/', views.three, name='3d'),
    path('profile/<int:pk>/3d', views.three_profile, name='3d_profile'),
    path('signup/', views.SignUpView.as_view(), name="signup"),
    path('activate/<uidb64>/<token>/', views.ActivateView.as_view(), name="activate"),
    path('check_email/', views.CheckEmailView.as_view(), name="check_email"),
    path('success/', views.SuccessView.as_view(), name="success"),
    path('login/', views.Login.as_view(template_name='blog/auth/login.html'), name='login'),
    path('logout/', LogoutView.as_view(next_page='blog:index'), name='logout'),
    path('change_password/', PasswordChangeView.as_view(template_name='blog/auth/change_password.html'), name='change_password'),
    path('profile/<int:pk>/', views.profile, name='profile'),
    path('profile/friends/', views.friends, name='friends'),
    path('<int:pk>/post/comment', views.comment, name='comment'),
    path('<int:pk>/post/comment/vote', views.vote, name='vote'),
    path('new_post/', views.new_post, name='new_post'),
    path('<int:pk>/post/', views.post, name='post'), 
    path('vote', views.vote, name='vote'), 
]