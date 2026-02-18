from django.urls import path
from .views import (
    TriggerGSTR1GenerationView,
    DownloadGSTR1View,
    TriggerVerificationView,
    VerificationResultView,
)

urlpatterns = [
    path('generate/',          TriggerGSTR1GenerationView.as_view(), name='gstr1-generate'),
    path('<uuid:output_id>/download/', DownloadGSTR1View.as_view(),  name='gstr1-download'),
    path('verify/',            TriggerVerificationView.as_view(),    name='gstr1-verify'),
    path('verify/<uuid:run_id>/', VerificationResultView.as_view(),  name='verification-result'),
]