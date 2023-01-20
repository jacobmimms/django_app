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
from django.template.loader import render_to_string

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
    comments = Comment.objects.filter(post=post)
    return render(request, 'blog/post.html', {'post': post, 'comments': comments, 'user': request.user})


def comment(request, pk):
    if not request.user.is_authenticated:
        return HttpResponseRedirect(reverse('blog:login'))
    if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
        post = get_object_or_404(Post, pk=pk)
        parent_id = request.POST.get('parent_id')
        parent = None
        try:
            parent = Post.objects.get(pk=parent_id)
        except Post.DoesNotExist:
            parent = Comment.objects.get(pk=parent_id)
        content = request.POST.get('comment')
        if not content or not parent:
            return JsonResponse({'error': 'shit is whack yo'}, status=400)
        if isinstance(parent, Post):
            comment = Comment.objects.create(post=post, content=content, author=request.user)
            comment.save()
            comments = Comment.objects.filter(post=post)
            html = render_to_string('blog/comment_fragment.html', {'comments': comments, 'csrf_token': request.META['CSRF_COOKIE']})
            return JsonResponse(html, safe=False, status=200)
        else:
            print("got gere dogs")
            parent_comment = get_object_or_404(Comment, pk=parent_id)
            comment = Comment.objects.create(parent_comment=parent_comment, content=content, author=request.user)
            comment.save()
            parent_comment.children_comments.add(comment)
            parent_comment.save()
            comments = Comment.objects.filter(post=post)
            html = render_to_string('blog/comment_fragment.html', {'comments': comments, 'csrf_token': request.META['CSRF_COOKIE']})
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