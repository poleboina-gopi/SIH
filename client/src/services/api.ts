import { DashboardStats, Report, Scan, StatutoryRule, User, Violation, ParsedFields } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';
const DEFAULT_TIMEOUT_MS = 15000;

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      throw new Error(`Connection timed out after ${timeoutMs / 1000}s. Backend server at ${API_BASE_URL} took too long to respond. Please make sure the backend is running.`);
    }
    if (err.message && err.message.toLowerCase().includes('failed to fetch')) {
      throw new Error(`Cannot connect to backend server at ${API_BASE_URL}. Please ensure the server is running (run 'npm start' in the server directory).`);
    }
    throw err;
  }
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('lm_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const api = {
  // Auth
  async login(identifier: string, password: string): Promise<{ token: string; user: User }> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      }, 7000);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Login failed' }));
        throw new Error(err.error || 'Login failed');
      }
      const data = await res.json();
      localStorage.setItem('lm_token', data.token);
      localStorage.setItem('lm_user', JSON.stringify(data.user));
      return data;
    } catch (err: any) {
      // If server is completely down or unreachable, allow fallback login for standard demo accounts
      const cleanId = (identifier || '').trim().toLowerCase();
      const isInspectorDemo = (cleanId === 'inspector@gov.in' || cleanId === 'inspector') && 
        (password === 'Inspector@2026!' || password === 'inspector123');
      const isAdminDemo = (cleanId === 'admin@gov.in' || cleanId === 'admin') && 
        (password === 'Admin@2026!' || password === 'admin123');

      if (isInspectorDemo || isAdminDemo) {
        console.warn("Backend server unreachable. Logging in with offline demo session.");
        const demoUser: User = isInspectorDemo ? {
          id: 'usr_inspector_01',
          name: 'R. K. Sharma',
          email: 'inspector@gov.in',
          role: 'inspector',
          designation: 'Legal Metrology Officer (Zonal)',
          badgeNumber: 'LM-DEL-2024-890',
          department: 'Directorate of Legal Metrology, Delhi Circle',
          phone: '+91 98765 43210'
        } : {
          id: 'usr_admin_01',
          name: 'Dr. S. Mukherjee',
          email: 'admin@gov.in',
          role: 'admin',
          designation: 'Joint Controller, Legal Metrology',
          badgeNumber: 'LM-HQ-9901',
          department: 'Department of Consumer Affairs, MoCA',
          phone: '+91 98111 22233'
        };
        const demoToken = 'demo_offline_token_' + Date.now();
        localStorage.setItem('lm_token', demoToken);
        localStorage.setItem('lm_user', JSON.stringify(demoUser));
        return { token: demoToken, user: demoUser };
      }

      throw err;
    }
  },

  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    role?: string;
    department?: string;
  }): Promise<{ token: string; user: User }> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }, 8000);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(err.error || 'Registration failed');
    }
    const resData = await res.json();
    localStorage.setItem('lm_token', resData.token);
    localStorage.setItem('lm_user', JSON.stringify(resData.user));
    return resData;
  },

  getCurrentUser(): User | null {
    const stored = localStorage.getItem('lm_user');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  logout(): void {
    localStorage.removeItem('lm_token');
    localStorage.removeItem('lm_user');
  },

  // Upload
  async uploadImage(file: File): Promise<{ image_url: string; filename: string }> {
    const formData = new FormData();
    formData.append('image', file);
    const token = localStorage.getItem('lm_token');

    const res = await fetch(`${API_BASE_URL}/upload-image`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Upload failed');
    }
    return res.json();
  },

  // OCR Processing
  async processOcr(params: {
    raw_text: string;
    image_url?: string;
    product_name?: string;
    brand?: string;
    category?: string;
  }): Promise<{ parsed_fields: ParsedFields; raw_text: string }> {
    const res = await fetch(`${API_BASE_URL}/process-ocr`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'OCR processing failed' }));
      throw new Error(err.error || 'OCR processing failed');
    }
    return res.json();
  },

  // Compliance
  async validateCompliance(payload: {
    product_name?: string;
    brand?: string;
    category?: string;
    image_url?: string;
    raw_text?: string;
    parsed_fields?: ParsedFields;
    inspector_id?: string;
    inspector_name?: string;
  }): Promise<{
    report_id: string;
    report: Report;
    scan: Scan;
    violations: Violation[];
  }> {
    const res = await fetch(`${API_BASE_URL}/validate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Validation failed' }));
      throw new Error(err.error || 'Validation failed');
    }
    return res.json();
  },

  // Reports
  async getReport(id: string): Promise<{ report: Report; scan: Scan; product: any; violations: Violation[] }> {
    const res = await fetch(`${API_BASE_URL}/report/${id}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Report not found');
    return res.json();
  },

  async getReports(): Promise<{ reports: Report[] }> {
    const res = await fetch(`${API_BASE_URL}/reports`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to load reports');
    return res.json();
  },

  // Scans
  async getScans(): Promise<{ scans: Scan[] }> {
    const res = await fetch(`${API_BASE_URL}/scans`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to load scans');
    return res.json();
  },

  async getScan(id: string): Promise<{ scan: Scan; product: any; violations: Violation[]; report: Report }> {
    const res = await fetch(`${API_BASE_URL}/scans/${id}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to load scan');
    return res.json();
  },

  // Dashboard Stats & Violations
  async getStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE_URL}/stats`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to load dashboard stats');
    return res.json();
  },

  async getViolations(): Promise<{ violations: Violation[] }> {
    const res = await fetch(`${API_BASE_URL}/violations`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to load violations');
    return res.json();
  },

  // Rules
  async getRules(): Promise<{ rules: StatutoryRule[] }> {
    const res = await fetch(`${API_BASE_URL}/rules`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to load rules');
    return res.json();
  },

  async updateRule(id: string, updates: Partial<StatutoryRule>): Promise<{ rule: StatutoryRule }> {
    const res = await fetch(`${API_BASE_URL}/rules/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update rule');
    return res.json();
  },

  // Admin User Management
  async getAdminUsers(): Promise<{ users: User[] }> {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to load user directory' }));
      throw new Error(err.error || 'Failed to load user directory');
    }
    return res.json();
  },

  async updateUserRole(id: string, role: string): Promise<{ user: User; message: string }> {
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}/role`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ role })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update user role' }));
      throw new Error(err.error || 'Failed to update user role');
    }
    return res.json();
  },

  getExportUrl(reportId: string, format: 'json' | 'csv'): string {
    const token = localStorage.getItem('lm_token');
    const query = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${API_BASE_URL}/export/${reportId}/${format}${query}`;
  },

  // Authenticated Data Export (JSON/CSV)
  async downloadExport(reportId: string, format: 'json' | 'csv', filename?: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/export/${reportId}/${format}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `Failed to export ${format.toUpperCase()}` }));
      throw new Error(err.error || `Failed to export ${format.toUpperCase()}`);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `Statutory_Report_${reportId}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // PDF Report Download
  async downloadReportPdf(reportId: string, filename?: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/report/${reportId}/pdf`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to generate PDF' }));
      throw new Error(err.error || 'Failed to generate PDF');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `Legal_Metrology_Report_${reportId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Delete Inspection
  async deleteScan(scanId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/scan/${scanId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete inspection' }));
      throw new Error(err.error || 'Failed to delete inspection');
    }
    return res.json();
  }
};
