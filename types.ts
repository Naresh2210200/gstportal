
export type UserRole = 'ca' | 'customer';

export interface User {
  id: string;
  username: string;
  email?: string; // Optional for customer, required for CA
  passwordHash: string;
  fullName: string;
  role: UserRole;
  caCode: string; // For CA, it's their unique code; for customer, it's their link
  firmName?: string; // CA or fetched for Customer
  gstin?: string; // Customer only
  address?: string; // Fetched via GST
  registrationDate?: string; // Fetched via GST
}

export type UploadStatus = 'Pending' | 'Received' | 'Processing' | 'Completed' | 'Error';

export interface FileUpload {
  id: string;
  customerId: string;
  customerName: string;
  caId: string;
  fileName: string;
  fileType: string;
  uploadedDate: string;
  financialYear: string;
  month: string;
  note: string;
  status: UploadStatus;
  content?: string; // Raw CSV text for processing
}

export interface ProcessingLog {
  id: string;
  uploadId: string;
  caId: string;
  customerId: string;
  date: string;
  action: string;
  result: string;
  status: 'success' | 'failure';
  errorReport?: string[];
  changesMade?: string[];
  finalFileName?: string;
}

export interface AppState {
  users: User[];
  uploads: FileUpload[];
  logs: ProcessingLog[];
  currentUser: User | null;
}
