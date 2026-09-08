import { DashboardStats, Report, Scan, StatutoryRule, User, Violation, ParsedFields } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('lm_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(err.error || 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem('lm_token', data.token);
    localStorage.setItem('lm_user', JSON.stringify(data.user));
    return data;
  },

  async register(userData: Partial<User> & { password: string }): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(err.error || 'Registration failed');
    }
    const data = await res.json();
    localStorage.setItem('lm_token', data.token);
    localStorage.setItem('lm_user', JSON.stringify(data.user));
    return data;
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

  getExportUrl(reportId: string, format: 'json' | 'csv'): string {
    return `${API_BASE_URL}/export/${reportId}/${format}`;
  }
};
