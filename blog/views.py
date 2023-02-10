from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponseRedirect, JsonResponse
from django.contrib import messages
from django.contrib.auth import login, logout
from django.contrib.auth.views import LoginView  
from django.contrib.auth.forms import PasswordChangeForm
from django.views import generic
from django.views.generic import CreateView, TemplateView, RedirectView, View
from django.urls import reverse, reverse_lazy
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str # force_text on older versions of Django
from .forms import PostForm, ProfilePictureForm, SignUpForm, token_generator, user_model
from .models import  Post, Comment, User
from pathlib import Path
import requests
import os
import environ
env = environ.Env()
environ.Env.read_env() 

modelDict = dict(
    post=Post,
    comment=Comment
)


def index(request):
    latest_posts_list = Post.objects.order_by('-created_at')[:5]
    latest_posts_comments = []
    if latest_posts_list:
        latest_posts_comments = [Comment.objects.filter(post=post) for post in latest_posts_list]
    context = {'latest_posts_list': latest_posts_list, 'latest_posts_comments': latest_posts_comments}
    return render(request, 'blog/index.html', context)


def three(request):
    users = User.objects.all()
    posts = Post.objects.all()
    user_to_posts = {}
    for user in users:
        user_to_posts[user] = [Post.objects.all().filter(author=user)]
    print(user_to_posts)
    return render(request, 'blog/3d/3d.html', {'users': users, 'posts': posts, 'user_to_posts': user_to_posts})


def three_profile(request, pk):
    user = get_object_or_404(User, pk=pk)
    posts = Post.objects.filter(author=user)
    comments = Comment.objects.filter(author=user)
    return render(request, 'blog/3d/3d_profile.html', {'user': user, 'posts': posts, 'comments': comments})


class Login(LoginView):
    redirect_authenticated_user = True
    template_name = 'blog/auth/login.html'

    def get_success_url(self):
        return reverse_lazy('blog:index') 
    
    def form_invalid(self, form):
        messages.error(self.request,'Invalid username or password')
        return self.render_to_response(self.get_context_data(form=form))


class Logout(generic.RedirectView):
    url = reverse_lazy('blog:login')
    template_name = 'logout.html'

    def get(self, request, *args, **kwargs):
        logout(request)
        return super().get(request, *args, **kwargs)


class ChangePassword(generic.FormView):
    form_class = PasswordChangeForm
    success_url = reverse_lazy('blog:login')
    template_name = 'change_password.html'

    def form_valid(self, form):
        form.save()
        return super().form_valid(form)


def profile(req, pk):
    if not req.user.is_authenticated:
        return HttpResponseRedirect(reverse('blog:login'))
    form = ProfilePictureForm(req.POST, req.FILES)
    if req.method == 'POST':
        if form.is_valid():
            user = get_object_or_404(User, pk=pk)
            user.profile_picture = req.FILES.get('profile_picture')
            print(req.FILES.get('profile_picture'))
            user.save()
            return HttpResponseRedirect(reverse('blog:profile', args=(user.id,)))
    user = get_object_or_404(User, pk=pk)
    posts = Post.objects.filter(author=user)
    comments = Comment.objects.filter(author=user)
    return render(req, 'blog/profile.html', {'user': user, 'posts': posts, 'comments': comments, 'form': form})


class Spotify(View):
    api_url = 'https://api.spotify.com/v1/'

    def get(self, req):
        if not req.user.is_authenticated:
            return HttpResponseRedirect(reverse('blog:login'))
        if not req.user.spotify_access_token:
            return HttpResponseRedirect(reverse('blog:spotify_login'))
        # make query for user's top artists
        # make query for user's top tracks
        # make query for user's top genres
        context = {}
        top_artists = 'me/top/artists?time_range=medium_term&limit=100'
        top_tracks = 'me/top/tracks?time_range=medium_term&limit=100'
        # make query for user's top artists
        top = requests.get(self.api_url + top_artists, headers={'Authorization': 'Bearer ' + req.user.spotify_access_token})
        if top.status_code == 401:
            return HttpResponseRedirect(reverse('blog:spotify_login'))
        top_tracks = requests.get(self.api_url + top_tracks, headers={'Authorization': 'Bearer ' + req.user.spotify_access_token})
        top = top.json()
        top_artists = []
        for artist in top['items']:
            top_artists.append(artist['name'])

        top_tracks_json = top_tracks.json()
        top_tracks = []
        for track in top_tracks_json['items']:
            track_info = {}
            track_info['name'] = track['name']
            track_info['artist'] = track['artists'][0]['name']
            track_info['album_art'] = track['album']['images'][0]['url']
            top_tracks.append(track_info)
        
        context['top_artists'] = top_artists
        context['top_tracks'] = top_tracks
        return render(req, 'blog/spotify.html', context)

            
class SpotifyLogin(RedirectView):
    scope = 'user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing user-read-recently-played user-top-read playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public user-read-playback-position user-top-read user-read-recently-played user-library-modify user-library-read app-remote-control streaming'
    url = 'https://accounts.spotify.com/authorize?client_id={}&response_type=code&redirect_uri={}&scope={}'.format(
        env('SPOTIFY_CLIENT_ID'),
        env('SPOTIFY_REDIRECT_URI'),
        scope
    )

    def get(self, req):
        if not req.user.is_authenticated:
            return HttpResponseRedirect(reverse('blog:login'))
        return super().get(req)



class SpotifyCallback(RedirectView):
    # get access token
    # save access token to user
    # redirect to spotify page
    url = reverse_lazy('blog:Spotify')
    def get(self, req):
        # save access token to user
        if not req.user.is_authenticated:
            return HttpResponseRedirect(reverse('blog:login'))
        code = req.GET.get('code')
        if code:
            data = {
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': env('SPOTIFY_REDIRECT_URI'),
                'client_id': env('SPOTIFY_CLIENT_ID'),
                'client_secret': env('SPOTIFY_CLIENT_SECRET')
            }
            r = requests.post('https://accounts.spotify.com/api/token', data=data)
            if r.status_code == 200:
                req.user.spotify_access_token = r.json().get('access_token')
                req.user.spotify_refresh_token = r.json().get('refresh_token')
                req.user.save()
                return super().get(req)




class SpotifyProfile(View):
    def get(self, req):
        return render(req, 'blog/spotify.html')


class SignUpView(CreateView):
    form_class = SignUpForm 
    template_name = 'blog/auth/signup.html'
    success_url = reverse_lazy('blog:check_email')
    def form_valid(self, form):
        to_return = super().form_valid(form)
        user = form.save()
        user.is_active = False # Turns the user status to inactive
        user.save()
        form.send_activation_email(self.request, user)
        return to_return


class ActivateView(RedirectView):
    url = reverse_lazy('blog:success')
    def get(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = user_model.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, user_model.DoesNotExist):
            user = None
        if user is not None and token_generator.check_token(user, token):
            user.is_active = True
            user.save()
            login(request, user)
            return super().get(request, uidb64, token)
        else:
            return render(request, 'blog/auth/activate_account_invalid.html')

class CheckEmailView(TemplateView):
    template_name = 'blog/auth/check_email.html'

class SuccessView(TemplateView):
    template_name = 'blog/auth/success.html'


def new_post(request):
    if not request.user.is_authenticated:
        return HttpResponseRedirect(reverse('blog:login'))
    if request.method == 'POST':
        form = PostForm(request.POST)
        if form.is_valid():
            new_post = form.save(commit=False)
            post = Post.objects.create(title=new_post.title, content=new_post.content, author=request.user)
            post.save()
            return HttpResponseRedirect(reverse('blog:post', args=(post.id,)))
    else:
        form = PostForm()
    return render(request, 'blog/new_post.html', {'form': form})


def friends(request):
    if not request.user.is_authenticated:
        return HttpResponseRedirect(reverse('blog:login'))
    if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
        email = request.GET.get('email')
        if email:
            users = User.objects.filter(email__contains=email)
            if request.user in users:
                users = users.exclude(email=request.user.email)
            if not users:
                return JsonResponse('', safe=False)
            html = render_to_string('blog/friend_search_results.html', {'users': users})
            return JsonResponse(html, safe=False, status=200)
        return JsonResponse({'error': 'no email provided'}, status=400)
    friends = request.user.friends.all()
    return render(request, 'blog/friends.html', {'friends': friends, 'user': request.user})


def post(request, pk):
    post = get_object_or_404(Post, pk=pk)
    comments = Comment.objects.filter(post=post).filter(parent_comment=None).order_by('-created_at')
    return render(request, 'blog/post.html', {'post': post, 'comments': comments, 'user': request.user})


def comment(request, pk):
    if not request.user.is_authenticated:
        return JsonResponse("fail", safe=False, status=200)
    if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
        post = get_object_or_404(Post, pk=pk)
        content = request.POST.get('comment')
        if request.POST.get('is_reply') == 'true':
            parent_id = request.POST.get('parent_id')
            parent_comment = get_object_or_404(Comment, pk=parent_id)
            reply = Comment.objects.create(post=post,content=content, author=request.user, parent_comment=parent_comment)
            reply.save()
            html = render_to_string('blog/comment_frag.html', {'comment': reply, 'csrf_token': request.META['CSRF_COOKIE']})
            return JsonResponse({'html':html,'parent_id':parent_id}, safe=False, status=200)
        comment = Comment.objects.create(post=post,content=content, author=request.user, parent_comment=None)
        comment.save()
        html = render_to_string('blog/comment_frag.html', {'comment': comment, 'csrf_token': request.META['CSRF_COOKIE']})
        return JsonResponse(html, safe=False, status=200)
    return JsonResponse({'error': 'somehting broke'}, status=400)

def vote(request):
    if not request.user.is_authenticated:
        return HttpResponseRedirect(reverse('blog:login'))
    if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
        id = request.POST.get('id')
        vote_type = request.POST.get('vote_type')
        obj_type = request.POST.get('obj_type')
        obj = get_object_or_404(modelDict[obj_type], pk=id)
        if request.user in obj.users_upvoted.all():
            if vote_type == 'up':
                obj.users_upvoted.remove(request.user)
                obj.votes -= 1
                obj.save()
                return JsonResponse({'votes': obj.votes, 'id': id, "upvote":True, "vote_type":vote_type, 'was_active':True, 'flip':False}, status=200)
            if vote_type == 'down':
                obj.users_upvoted.remove(request.user)
                obj.users_downvoted.add(request.user)
                obj.votes -= 2
                obj.save()
                return JsonResponse({'votes': obj.votes, 'id': id,  "upvote":False,  "vote_type":vote_type, 'was_active': False, 'flip':True}, status=200)
        elif request.user in obj.users_downvoted.all():
            if vote_type == 'up':
                obj.users_downvoted.remove(request.user)
                obj.users_upvoted.add(request.user)
                obj.votes += 2
                obj.save()
                return JsonResponse({'votes': obj.votes, 'id': id,  "upvote":True,  "vote_type":vote_type, 'was_active': False, 'flip':True}, status=200)
            if vote_type == 'down':
                obj.users_downvoted.remove(request.user)
                obj.votes += 1
                obj.save()
                return JsonResponse({'votes': obj.votes, 'id': id,  "upvote":False,  "vote_type":vote_type, 'was_active':True, 'flip':False}, status=200)
        else:
            if vote_type == 'up':
                obj.users_upvoted.add(request.user)
                obj.votes += 1
                obj.save()
                return JsonResponse({'votes': obj.votes, 'id': id,  "upvote":True,  "vote_type":vote_type, 'was_active':False, 'flip':False}, status=200)
            if vote_type == 'down':
                obj.users_downvoted.add(request.user)
                obj.votes -= 1
                obj.save()
                return JsonResponse({'votes': obj.votes, 'id': id,  "upvote":False, "vote_type":vote_type, 'was_active':False, 'flip':False}, status=200)