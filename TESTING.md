# Testing Strategy

## 1. Multi-Tenancy Isolation
**Test Case**: Ensure CA "A" cannot see data from CA "B".
- **Step**: Register two CAs (`CA_ALPHA` and `CA_BETA`).
- **Step**: Upload a file as a customer of `CA_ALPHA`.
- **Verify**: Check `ca_beta_db` physical tables; they must be empty.
- **Verify**: Accessing the API with `CA_BETA`'s JWT token should return 404 for `CA_ALPHA`'s file IDs.

## 2. AI Data Mapping (Gemini)
**Test Case**: Validate format detection.
- **Step**: Use the "Data Automation Tool" in the Party Workspace.
- **Step**: Input a "Tally" formatted CSV snippet.
- **Verify**: Gemini should return `mappingRules` containing specific transformation steps (e.g., "Rename 'Voucher No' to 'Invoice Number'").

## 3. Storage & Presigned URLs
**Test Case**: R2 secure upload.
- **Step**: Trigger a file upload from the Customer Dashboard.
- **Verify**: The browser should receive a 200 response from a `PUT` request to `*.r2.cloudflarestorage.com`.
- **Verify**: The backend `confirm/` endpoint should only save the `storage_key` once the upload is successful.

## 4. GSTR1 Generation
**Test Case**: Excel file integrity.
- **Step**: Select a month with 5+ uploaded files and click "Convert & Verify".
- **Verify**: A `.xlsx` file should download.
- **Verify**: Open the file; headers must match the official GSTR1 offline utility template.

## 5. Backend Automated Tests
Run the suite using:
```bash
cd camate-backend
# Test master logic
python manage.py test apps.auth_app
# Test tenant logic (requires a test tenant DB)
python manage.py test apps.uploads --database=default
```
