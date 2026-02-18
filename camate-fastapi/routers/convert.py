"""
Format Conversion Router
=========================
POST /convert/{format}
  - Downloads a raw file from R2
  - Converts Tally/Zoho/SAP exports to standard GSTR1 CSV format
  - Uploads the converted CSV back to R2
  - Returns the new storage key
"""
import io
import time
import logging
from typing import Literal
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

import storage

logger = logging.getLogger(__name__)
router = APIRouter()

SupportedFormat = Literal['tally', 'zoho', 'sap', 'busy']


class ConvertRequest(BaseModel):
    storage_key: str
    ca_code: str
    target_sheet: str  # e.g. 'b2b', 'b2cl', 'hsn'


class ConvertResponse(BaseModel):
    converted_key: str
    rows_converted: int
    status: str = "success"


# ─── Column mapping templates ─────────────────────────────────────────────────
FORMAT_MAPPINGS = {
    "tally": {
        "Party GSTIN/UIN": "GSTIN/UIN of Recipient",
        "Voucher No.": "Invoice Number",
        "Voucher Date": "Invoice date",
        "Taxable Amount": "Taxable Value",
        "GST Rate": "Rate",
        "IGST Amount": "Integrated Tax Amount",
        "CGST Amount": "Central Tax Amount",
        "SGST Amount": "State/UT Tax Amount",
        "Cess Amount": "Cess Amount",
        "Place of Supply": "Place Of Supply",
    },
    "zoho": {
        "Customer GSTIN": "GSTIN/UIN of Recipient",
        "Invoice Number": "Invoice Number",
        "Invoice Date": "Invoice date",
        "Sub Total": "Taxable Value",
        "Tax Rate": "Rate",
        "IGST": "Integrated Tax Amount",
        "CGST": "Central Tax Amount",
        "SGST": "State/UT Tax Amount",
        "Place of Supply": "Place Of Supply",
    },
    "sap": {
        "GSTIN_PARTNER": "GSTIN/UIN of Recipient",
        "BELNR": "Invoice Number",
        "BUDAT": "Invoice date",
        "DMBTR": "Taxable Value",
        "MWSKZ": "Rate",
    },
    "busy": {
        "Party GSTIN": "GSTIN/UIN of Recipient",
        "Bill No.": "Invoice Number",
        "Bill Date": "Invoice date",
        "Taxable Amt": "Taxable Value",
        "GST%": "Rate",
    }
}


def convert_csv(content: str, format_name: str) -> tuple[str, int]:
    """
    Renames columns in a CSV from the source format to standard GSTR1 column names.
    Returns (converted_csv_string, row_count).
    """
    mapping = FORMAT_MAPPINGS.get(format_name, {})
    lines = content.strip().split('\n')
    if len(lines) < 2:
        return content, 0

    # Parse header
    original_headers = [h.strip().strip('"') for h in lines[0].split(',')]
    new_headers = [mapping.get(h, h) for h in original_headers]

    result_lines = [','.join(f'"{h}"' for h in new_headers)]
    for line in lines[1:]:
        if line.strip():
            result_lines.append(line)

    return '\n'.join(result_lines), len(lines) - 1


@router.post("/{format}", response_model=ConvertResponse)
async def convert_format(format: SupportedFormat, payload: ConvertRequest):
    """
    Convert a raw accounting export CSV to standard GSTR1 column names.
    """
    logger.info(f"Converting {payload.storage_key} from {format} format")

    try:
        content = storage.read_file(payload.storage_key)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    converted_content, row_count = convert_csv(content, format)

    # Save converted file
    timestamp = int(time.time())
    original_name = payload.storage_key.split('/')[-1]
    converted_key = payload.storage_key.replace(
        original_name,
        f"converted_{format}_{timestamp}_{original_name}"
    )

    storage.save_file(converted_key, converted_content.encode('utf-8'), 'text/csv')

    logger.info(f"Conversion complete: {row_count} rows → {converted_key}")
    return ConvertResponse(converted_key=converted_key, rows_converted=row_count)
