import uuid
from datetime import timedelta
from django.db import models
from django.utils import timezone

class Upload(models.Model):
    """
    Model representing a file upload from a customer in the tenant-specific database.
    Files are stored in Cloudflare R2; this model tracks metadata and expiration.
    """
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Received', 'Received'),
        ('Processing', 'Processing'),
        ('Completed', 'Completed'),
        ('Error', 'Error'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer_id = models.UUIDField(help_text="Reference to Customer.id (no FK)")
    customer_name = models.CharField(max_length=255)
    file_name = models.CharField(max_length=255)
    storage_key = models.TextField(help_text="Full R2 object path/key")
    file_size = models.BigIntegerField(default=0)
    financial_year = models.CharField(max_length=10)
    month = models.CharField(max_length=20)
    gstr_sheet = models.CharField(max_length=50, blank=True, null=True, help_text="Target GSTR sheet (e.g., b2b, hsn)")
    note = models.TextField(blank=True)
    status = models.CharField(max_length=20, default='Pending', choices=STATUS_CHOICES)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'uploads'
        app_label = 'uploads'

    def save(self, *args, **kwargs):
        # Auto-set expires_at to 90 days after upload if not set
        if not self.expires_at:
            # For new records, uploaded_at is None until first save. 
            # We use timezone.now() as a fallback for the calculation.
            base_date = self.uploaded_at if self.uploaded_at else timezone.now()
            self.expires_at = base_date + timedelta(days=90)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.file_name} ({self.customer_name})"
