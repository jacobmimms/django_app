from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponseRedirect
from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from django.views import generic
from django.urls import reverse
from django.contrib.auth.views import LoginView  
from django.contrib.auth.forms import (
    PasswordChangeForm
)
from .forms import NewUserForm, PostForm
from .models import  Post, Comment, User
from django.urls import reverse_lazy
from django.contrib import messages
from django.http import JsonResponse
from django.core import serializers
from django.template.loader import render_to_string


def index(request):
    latest_posts_list = Post.objects.order_by('-created_at')[:5]
    latest_posts_comments = []
    if latest_posts_list:
        latest_posts_comments = [Comment.objects.filter(post=post) for post in latest_posts_list]
    context = {'latest_posts_list': latest_posts_list, 'latest_posts_comments': latest_posts_comments}
    return render(request, 'blog/index.html', context)

class Login(LoginView):
    redirect_authenticated_user = True
    template_name = 'blog/login.html'

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
    success_url = reverse_lazy('blog/login')
    template_name = 'change_password.html'

    def form_valid(self, form):
        form.save()
        return super().form_valid(form)


def profile(req, pk):
    user = get_object_or_404(User, pk=pk)
    posts = Post.objects.filter(author=user)
    comments = Comment.objects.filter(author=user)
    return render(req, 'blog/profile.html', {'user': user, 'posts': posts, 'comments': comments})


class ProfileUpdate(generic.UpdateView):
    model = User
    template_name = 'blog/profile_update.html'
    fields = ['username', 'email']
    success_url = reverse_lazy('blog:profile')


def register(req):
    if req.method == "POST":
        form = NewUserForm(req.POST)
        if form.is_valid():
            user = form.save()
            blog_user = User.create_user(user.email)
            blog_user.save()
            login(req, user)
            return redirect('blog:index')
        messages.error(req, "Unsuccessful registration. Invalid information.")
    else:
        form = NewUserForm()
    return render(req, 'blog/register.html', {'form': form})

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
    # ajax requeset for searchign users by email
    if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
        email = request.GET.get('email')
        if email:
            users = User.objects.filter(email__contains=email)
            if request.user in users:
                users = users.exclude(email=request.user.email)
            if not users:
                return JsonResponse('', safe=False)
            html = render_to_string('blog/friend_search_results.html', {'users': users})
            return JsonResponse(html, safe=False)
        return JsonResponse({'error': 'no email provided'}, status=400)
    if not request.user.is_authenticated:
        return HttpResponseRedirect(reverse('blog:login'))
    friends = request.user.friends.all()
    return render(request, 'blog/friends.html', {'friends': friends, 'user': request.user})

def post(request, pk):
    post = get_object_or_404(Post, pk=pk)
    comments = Comment.objects.filter(post=post)
    return render(request, 'blog/post.html', {'post': post, 'comments': comments, 'user': request.user})

def comment(request, pk):
    print(request.POST, pk)
    post = get_object_or_404(Post, pk=pk)
    new_comment =  request.POST.get('comment')
    if not new_comment:
        comments = Comment.objects.filter(post=post).order_by('-created_at')
        return render(request, 'blog/post.html', {'post': post, 'comments': comments})
    author = request.user
    comment = Comment.objects.create(post=post, content=new_comment, author=author)
    comment.save()
    comments = Comment.objects.filter(post=post).order_by('-created_at')
    return HttpResponseRedirect(reverse('blog:post', args=(post.id,)))



def upvote_post(request):
    if not request.user.is_authenticated:
        return HttpResponseRedirect(reverse('blog:login'))
    if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
        post_id = request.GET.get('post_id')
        post = get_object_or_404(Post, pk=post_id)
        if request.user in post.users_upvoted_post.all():
            post.users_upvoted_post.remove(request.user)
            post.votes -= 1
            post.save()
            return JsonResponse({'votes': post.votes, 'id': post_id, "upvote":True, 'was_active':True, 'flip':False}, status=200)
        elif request.user in post.users_downvoted_post.all():
            post.users_downvoted_post.remove(request.user)
            post.users_upvoted_post.add(request.user)
            post.votes += 2
            post.save()
            return JsonResponse({'votes': post.votes, 'id': post_id,  "upvote":True, 'was_active': False, 'flip':True}, status=200)
        else:
            post.users_upvoted_post.add(request.user)
            post.votes += 1
            post.save()
            return JsonResponse({'votes': post.votes, 'id': post_id,  "upvote":True, 'was_active':False, 'flip':False}, status=200)

def downvote_post(request):
    if not request.user.is_authenticated:
        return HttpResponseRedirect(reverse('blog:login'))
    if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
        post_id = request.GET.get('post_id')
        post = get_object_or_404(Post, pk=post_id)
        if request.user in post.users_downvoted_post.all():
            post.users_downvoted_post.remove(request.user)
            post.votes += 1
            post.save()
            return JsonResponse({'votes': post.votes, 'id': post_id,  "upvote":False, 'was_active':True, 'flip':False}, status=200)
        elif request.user in post.users_upvoted_post.all():
            post.users_upvoted_post.remove(request.user)
            post.users_downvoted_post.add(request.user)
            post.votes -= 2
            post.save()
            return JsonResponse({'votes': post.votes, 'id': post_id,  "upvote":False, 'was_active': False, 'flip':True}, status=200)
        else:
            post.users_downvoted_post.add(request.user)
            post.votes -= 1
            post.save()
            return JsonResponse({'votes': post.votes, 'id': post_id, "upvote":False, 'was_active':False, 'flip':False}, status=200)


def comment_vote(req, pk):
    if not req.user.is_authenticated:
        return HttpResponseRedirect(reverse('blog:login'))
    comment = get_object_or_404(Comment, pk=pk)
    if req.POST.get('vote') == 'up':
        if comment.users_downvoted_comment.contains(req.user):
            comment.votes += 2
            comment.users_downvoted_comment.remove(req.user)
            comment.users_upvoted_comment.add(req.user)
            comment.save()
            return redirect(req.META['HTTP_REFERER'])
        if comment.users_upvoted_comment.contains(req.user):
            comment.votes -= 1
            comment.users_upvoted_comment.remove(req.user)
            comment.save()
            return redirect(req.META['HTTP_REFERER'])
        comment.users_upvoted_comment.add(req.user)
        comment.votes += 1
    elif req.POST.get('vote') == 'down':
        if comment.users_upvoted_comment.contains(req.user):
            comment.votes -= 2
            comment.users_upvoted_comment.remove(req.user)
            comment.users_downvoted_comment.add(req.user)
            comment.save()
            return redirect(req.META['HTTP_REFERER'])
        if comment.users_downvoted_comment.contains(req.user):
            comment.votes += 1
            comment.users_downvoted_comment.remove(req.user)
            comment.save()
            return redirect(req.META['HTTP_REFERER'])
        comment.users_downvoted_comment.add(req.user)
        comment.votes -= 1
    comment.save()
    return redirect(req.META['HTTP_REFERER'])

