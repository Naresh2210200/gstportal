from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CARegistrationView, CustomerRegistrationView, LoginView, LogoutView

urlpatterns = [
    path('register/ca/', CARegistrationView.as_view(), name='register_ca'),
    path('register/customer/', CustomerRegistrationView.as_view(), name='register_customer'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
