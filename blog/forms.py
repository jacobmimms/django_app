from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import Post, User

class ProfilePictureForm(forms.ModelForm):
	
    class Meta:
        model = User
        fields = ['profile_picture']

class NewUserForm(UserCreationForm):
	email = forms.EmailField(required=True)
	class Meta:
		model = User
		fields = ("username", "email", "password1", "password2")

	def duplicate_email(self):
		email = self.cleaned_data.get('email')
		if User.objects.filter(email=email).exists():
			return True
		return False


class PostForm(forms.ModelForm):
	class Meta:
		model = Post
		fields = ['title', 'content']
