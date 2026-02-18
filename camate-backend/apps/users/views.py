"""
Users app views — CA-facing endpoints.
GET /api/users/customers/  → list all customers registered under the CA's ca_code
"""
from rest_framework import views, status, permissions
from rest_framework.response import Response
from apps.auth_app.middleware import get_current_user_payload
from .models import Customer


class IsCA(permissions.BasePermission):
    def has_permission(self, request, view):
        payload = get_current_user_payload(request)
        return payload and payload.get('role') == 'ca'


class CustomerListView(views.APIView):
    """
    Returns all customers registered under the authenticated CA's tenant database.
    The TenantMiddleware already routes DB queries to the correct tenant DB,
    so a simple Customer.objects.all() returns only this CA's customers.
    """
    permission_classes = [IsCA]

    def get(self, request):
        customers = Customer.objects.all().order_by('full_name')
        data = [
            {
                "id": str(c.id),
                "full_name": c.full_name,
                "username": c.username,
                "email": c.email,
                "gstin": c.gstin or '',
            }
            for c in customers
        ]
        return Response(data, status=status.HTTP_200_OK)