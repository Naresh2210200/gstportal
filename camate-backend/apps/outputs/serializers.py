from rest_framework import serializers
from .models import GSTR1Output, VerificationRun, VerificationError


class GSTR1OutputSerializer(serializers.ModelSerializer):
    class Meta:
        model = GSTR1Output
        fields = [
            'id', 'customer_id', 'customer_name', 'financial_year',
            'month', 'file_name', 'status', 'generated_at', 'generated_by'
        ]


class VerificationErrorSerializer(serializers.ModelSerializer):
    class Meta:
        model = VerificationError
        fields = [
            'id', 'gstin', 'trade_name', 'invoice_no', 'invoice_date',
            'taxable_value', 'tax_amount', 'error_type', 'cancel_date',
            'pan_number', 'pan_valid', 'action_taken', 'hsn_adjusted'
        ]


class VerificationRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = VerificationRun
        fields = [
            'id', 'customer_id', 'customer_name', 'gstr1_output_id',
            'financial_year', 'month', 'total_checked', 'total_moved',
            'total_pan_errors', 'corrected_key', 'error_report_key',
            'status', 'run_at'
        ]