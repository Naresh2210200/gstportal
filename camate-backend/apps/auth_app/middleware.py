import jwt
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin
from services.db_router import set_current_ca_code

def get_current_user_payload(request):
    """
    Utility to decode JWT from headers and return payload.
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    try:
        # Decode using the simplejwt signing key
        payload = jwt.decode(
            token, 
            settings.SIMPLE_JWT['SIGNING_KEY'], 
            algorithms=['HS256']
        )
        return payload
    except Exception:
        return None

class TenantMiddleware(MiddlewareMixin):
    """
    Middleware that identifies the tenant (CA Firm) from the JWT 
    and sets the routing context for the database router.
    """
    def process_request(self, request):
        payload = get_current_user_payload(request)
        if payload and 'ca_code' in payload:
            set_current_ca_code(payload['ca_code'])
        else:
            set_current_ca_code(None)
