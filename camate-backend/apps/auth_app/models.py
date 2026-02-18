import uuid
from django.db import models

class CAFirm(models.Model):
    """
    Model representing a CA Firm in the master database.
    This model stores registration and tenant information.
    """
    PLAN_CHOICES = [
        ('starter', 'Starter'),
        ('pro', 'Pro'),
        ('enterprise', 'Enterprise'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ca_code = models.CharField(max_length=20, unique=True, help_text="Unique identifier used for tenant DB routing.")
    username = models.CharField(max_length=100, unique=True)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255)
    full_name = models.CharField(max_length=255)
    firm_name = models.CharField(max_length=255, blank=True)
    gstin = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=15, blank=True)
    plan = models.CharField(max_length=20, default='starter', choices=PLAN_CHOICES)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ca_firms'
        app_label = 'auth_app'

    def __str__(self):
        return self.firm_name or self.ca_code

    @property
    def db_name(self):
        """
        Returns the derived database name for this CA firm.
        """
        return f"ca_{self.ca_code.lower()}_db"

    @property
    def is_pro(self):
        """
        Checks if the firm is on a Pro or Enterprise plan.
        """
        return self.plan in ['pro', 'enterprise']
