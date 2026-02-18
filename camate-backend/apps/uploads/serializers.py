from rest_framework import serializers
from .models import Upload

class UploadPresignSerializer(serializers.Serializer):
    file_name = serializers.CharField(max_length=255)
    file_size = serializers.IntegerField()
    financial_year = serializers.CharField(max_length=10)
    month = serializers.CharField(max_length=20)

class UploadConfirmSerializer(serializers.ModelSerializer):
    class Meta:
        model = Upload
        fields = ['storage_key', 'file_name', 'file_size', 'financial_year', 'month', 'note']

class UploadListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Upload
        fields = '__all__'

class MapSheetSerializer(serializers.Serializer):
    GSTR_SHEETS = [
        'b2b', 'b2cl', 'b2cs', 'export', 'cdnr', 'cdnur',
        'hsn', 'Nil_exempt_NonGST', 'adv_tax', 'adv_tax_adjusted',
        'Docs_issued'
    ]
    gstr_sheet = serializers.ChoiceField(choices=GSTR_SHEETS)
