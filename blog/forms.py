from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import Post, User

class NewUserForm(UserCreationForm):
	email = forms.EmailField(required=True)
	class Meta:
		model = User
		fields = ("username", "email", "password1", "password2")

	def save(self, commit=True):
		user = super(NewUserForm, self).save(commit=False)
		user.email = self.cleaned_data['email']
		if commit:
			user.save()
		return user

class RegisterForm(UserCreationForm):
    email = forms.EmailField()
    class Meta:
        model = User
        fields = ["username", "password1", "password2"]

class PostForm(forms.ModelForm):
	class Meta:
		model = Post
		fields = ['title', 'content']
