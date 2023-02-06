from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import Post, User
from django.contrib.sites.shortcuts import get_current_site
from django.contrib.auth import get_user_model
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.template.loader import render_to_string
from .token import token_generator
from django.conf import settings

class ProfilePictureForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['profile_picture']
		
user_model = get_user_model()
class SignUpForm(UserCreationForm):
	email = forms.EmailField(required=True, max_length=254, help_text='Enter a valid email address')
	class Meta:
		model = user_model
		fields = ["username", "email", "password1", "password2"]

	def duplicate_email(self):
		email = self.cleaned_data.get('email')
		if User.objects.filter(email=email).exists():
			return True
		return False
	
	def send_activation_email(self, request, user):
		current_site = get_current_site(request)
		subject = 'Activate Your BrosCode Account'
		message = render_to_string(
            'blog/auth/activate_account.html',
            {
                'user': user,
                'domain': current_site.domain,
                'uid': urlsafe_base64_encode(force_bytes(user.pk)),
                'token': token_generator.make_token(user),
            }
        )
		user.email_user(subject, message, settings.DEFAULT_FROM_EMAIL, html_message=message)




class PostForm(forms.ModelForm):
	class Meta:
		model = Post
		fields = ['title', 'content']
