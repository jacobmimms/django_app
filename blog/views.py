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
            blog_user = User.objects.create(user=user)
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


def post_vote(req, pk):
    if not req.user.is_authenticated:
        return HttpResponseRedirect(reverse('blog:login'))
    post = get_object_or_404(Post, pk=pk)
    if req.POST.get('vote') == 'up':
        if post.users_downvoted_post.contains(req.user):
            post.votes += 2
            post.users_downvoted_post.remove(req.user)
            post.users_upvoted_post.add(req.user)
            post.save()
            return redirect(req.META['HTTP_REFERER'])
        if post.users_upvoted_post.contains(req.user):
            post.votes -= 1
            post.users_upvoted_post.remove(req.user)
            post.save()
            return redirect(req.META['HTTP_REFERER'])
        post.users_upvoted_post.add(req.user)
        post.votes += 1
    elif req.POST.get('vote') == 'down':
        if post.users_upvoted_post.contains(req.user):
            post.votes -= 2
            post.users_upvoted_post.remove(req.user)
            post.users_downvoted_post.add(req.user)
            post.save()
            return redirect(req.META['HTTP_REFERER'])
        if post.users_downvoted_post.contains(req.user):
            post.votes += 1
            post.users_downvoted_post.remove(req.user)
            post.save()
            return redirect(req.META['HTTP_REFERER'])
        post.users_downvoted_post.add(req.user)
        post.votes -= 1
    post.save()
    return redirect(req.META['HTTP_REFERER'])


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

