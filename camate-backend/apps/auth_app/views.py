import bcrypt
from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .models import CAFirm
from .serializers import CARegistrationSerializer, CustomerRegistrationSerializer, LoginSerializer
from apps.users.models import Customer
from services.db_router import get_ca_db_alias, create_ca_database, _is_sqlite
from django.db import DEFAULT_DB_ALIAS

def generate_tokens(user_data):
    refresh = RefreshToken()
    refresh['user_id'] = str(user_data['id'])
    refresh['role'] = user_data['role']
    refresh['ca_code'] = user_data['ca_code']
    refresh['username'] = user_data['username']
    refresh['full_name'] = user_data['full_name']
    if user_data.get('firm_name'):
        refresh['firm_name'] = user_data['firm_name']

    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class CARegistrationView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CARegistrationSerializer(data=request.data)
        if serializer.is_valid():
            ca_firm = serializer.save()

            # Provision tenant DB synchronously (instant in SQLite/dev mode)
            # In production with Celery, swap this for:
            #   provision_tenant_database.delay(ca_firm.ca_code)
            create_ca_database(ca_firm.ca_code)

            return Response({
                "ca_code": ca_firm.ca_code,
                "username": ca_firm.username,
                "message": "CA registered successfully."
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CustomerRegistrationView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CustomerRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            customer = serializer.save()
            return Response({
                "username": customer.username,
                "full_name": customer.full_name,
                "ca_code": customer.ca_code,
                "message": "Customer registered successfully. Please login."
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        role = serializer.validated_data['role']
        identifier = serializer.validated_data['identifier']
        password = serializer.validated_data['password']

        user_data = None
        
        if role == 'ca':
            ca = CAFirm.objects.filter(username=identifier).first() or \
                 CAFirm.objects.filter(email=identifier).first()
            
            if ca and bcrypt.checkpw(password.encode('utf-8'), ca.password_hash.encode('utf-8')):
                user_data = {
                    "id": ca.id,
                    "role": "ca",
                    "ca_code": ca.ca_code,
                    "username": ca.username,
                    "full_name": ca.full_name,
                    "firm_name": ca.firm_name
                }
        else:
            ca_code = serializer.validated_data['ca_code']
            db_alias = DEFAULT_DB_ALIAS if _is_sqlite() else get_ca_db_alias(ca_code)

            customer = Customer.objects.using(db_alias).filter(username=identifier).first() or \
                       Customer.objects.using(db_alias).filter(email=identifier).first()
            
            if customer and bcrypt.checkpw(password.encode('utf-8'), customer.password_hash.encode('utf-8')):
                user_data = {
                    "id": customer.id,
                    "role": "customer",
                    "ca_code": customer.ca_code,
                    "username": customer.username,
                    "full_name": customer.full_name
                }

        if user_data:
            tokens = generate_tokens(user_data)
            return Response({
                **tokens,
                "user": user_data
            }, status=status.HTTP_200_OK)

        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)