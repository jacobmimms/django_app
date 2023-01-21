from django.db import models
from django.utils import timezone
from django.contrib import admin
from django.contrib.auth.models import User, AbstractUser

class User(AbstractUser):
    friends = models.ManyToManyField('self', blank=True)

    def __str__(self):
        return self.username

    def get_friends(self):
        return self.friends.all()

    def get_posts(self):
        return self.post_set.all()

    def get_all_posts(self):
        return Post.objects.filter(author__in=self.get_friends()).order_by('-created_at')

    def add_friend(self, new_friend):
        self.friends.add(new_friend)

    def remove_friend(self, friend_to_remove):
        self.friends.remove(friend_to_remove)

    @classmethod
    def create_user(cls, email):
        new_blog_user = cls(email=email)
        new_blog_user.save()
        return new_blog_user

class Post(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    votes = models.IntegerField(default=0)
    users_upvoted = models.ManyToManyField(User, blank=True, related_name='users_upvoted_post')
    users_downvoted = models.ManyToManyField(User, blank=True, related_name='users_downvoted_post')

    
    def __str__(self):
        return self.title

class Comment(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, blank=True, null=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    votes = models.IntegerField(default=0)
    users_upvoted = models.ManyToManyField(User, blank=True, related_name='users_upvoted_comment')
    users_downvoted = models.ManyToManyField(User, blank=True, related_name='users_downvoted_comment')
    parent_comment = models.ForeignKey('self', on_delete=models.CASCADE, blank=True, null=True)


    def __str__(self):
        return self.content

