from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.auth_app.urls')),
    path('api/users/', include('apps.users.urls')),
    path('api/uploads/', include('apps.uploads.urls')),
    path('api/outputs/', include('apps.outputs.urls')),
]
