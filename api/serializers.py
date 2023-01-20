from rest_framework import serializers
from blog.models import Post, Comment, User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'email', 'first_name', 'last_name', 'id')

class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer()
    class Meta:
        model = Comment
        fields = ('author', 'content', 'created_at', 'updated_at', 'votes', 'id')