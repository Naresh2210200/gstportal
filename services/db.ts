import { User, FileUpload, ProcessingLog } from '../types';

const DB_KEY = 'ca_app_db_v1';

interface DBStructure {
  users: User[];
  uploads: FileUpload[];
  logs: ProcessingLog[];
}

const initialDB: DBStructure = {
  users: [],
  uploads: [],
  logs: []
};

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const db = {
  get: (): DBStructure => {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : initialDB;
  },
  
  save: (data: DBStructure) => {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  },

  getUsers: () => db.get().users,
  
  addUser: (user: User) => {
    const store = db.get();
    store.users.push(user);
    db.save(store);
  },

  updateUser: (id: string, updates: Partial<User>) => {
    const store = db.get();
    const index = store.users.findIndex(u => u.id === id);
    if (index !== -1) {
      store.users[index] = { ...store.users[index], ...updates };
      db.save(store);
    }
  },

  getUploads: () => db.get().uploads,
  
  addUpload: (upload: FileUpload) => {
    const store = db.get();
    store.uploads.push(upload);
    db.save(store);
  },

  updateUploadStatus: (id: string, status: FileUpload['status']) => {
    const store = db.get();
    const index = store.uploads.findIndex(u => u.id === id);
    if (index !== -1) {
      store.uploads[index].status = status;
      db.save(store);
    }
  },

  getLogs: () => db.get().logs,
  
  addLog: (log: ProcessingLog) => {
    const store = db.get();
    store.logs.push(log);
    db.save(store);
  }
};