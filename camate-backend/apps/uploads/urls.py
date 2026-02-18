from django.urls import path
from .views import (
    PresignUploadView, ConfirmUploadView, 
    MyUploadsView, CACustomerUploadsView, MapSheetView
)

urlpatterns = [
    path('presign/', PresignUploadView.as_view(), name='presign_upload'),
    path('confirm/', ConfirmUploadView.as_view(), name='confirm_upload'),
    path('my/', MyUploadsView.as_view(), name='my_uploads'),
    path('customer/<uuid:customer_id>/', CACustomerUploadsView.as_view(), name='ca_customer_uploads'),
    path('<uuid:upload_id>/map-sheet/', MapSheetView.as_view(), name='map_sheet'),
]
