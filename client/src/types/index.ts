export type UserRole = 'inspector' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designation?: string;
  badgeNumber?: string;
  department?: string;
}

export interface Product {
  id: string;
  product_name: string;
  brand: string;
  category: string;
  image_url: string;
  uploaded_by: string;
  created_at: string;
}

export interface ParsedNetQuantity {
  value: number;
  unit: string;
  standardized_unit?: string;
  raw: string;
  is_standard: boolean;
  error?: string | null;
}

export interface ParsedMRP {
  value: number;
  raw: string;
  includes_taxes: boolean;
  error?: string | null;
}

export interface ParsedConsumerCare {
  phone: string | null;
  email: string | null;
  address: string | null;
  is_complete: boolean;
}

export interface ParsedManufacturer {
  raw: string;
  name: string;
  address: string;
  has_pincode: boolean;
}

export interface ParsedDate {
  date: string;
  is_compliant: boolean;
  error?: string | null;
}

export interface ParsedFields {
  manufacturer: ParsedManufacturer | null;
  commodity_name: string;
  net_quantity: ParsedNetQuantity | null;
  mfg_date: ParsedDate | null;
  mrp: ParsedMRP | null;
  consumer_care: ParsedConsumerCare | null;
  country_of_origin: string | null;
  unit_sale_price: { value: number; unit: string; raw: string } | null;
  readability: {
    clarity: 'HIGH' | 'MEDIUM' | 'LOW';
    estimated_font_size: string;
    word_count: number;
    line_count: number;
  };
}

export interface Violation {
  id?: string;
  scan_id?: string;
  rule_code: string;
  rule_id?: string;
  violation_type: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  description: string;
  statutory_provision: string;
  suggested_action?: string;
  penalty_fine?: string;
  field?: string;
  product_name?: string;
  brand?: string;
  category?: string;
  scan_date?: string;
}

export interface StatutoryNotice {
  noticeNumber: string;
  noticeDate: string;
  recipient: string;
  address: string;
  subject: string;
  commodityName: string;
  violationsCount: number;
  statutoryProvisionsViolated: string;
  penalSectionApplicable: string;
  compoundingFeeProposed: string;
  noticePeriodDays: number;
  legalDirectives: string[];
}

export interface Report {
  id: string;
  scan_id: string;
  report_number: string;
  product_id?: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'BORDERLINE';
  score: number;
  inspector_name: string;
  generated_at: string;
  rule_checks_summary?: {
    total_rules_checked: number;
    rules_passed: number;
    rules_failed: number;
  };
  statutory_notice?: StatutoryNotice | null;
  product_name?: string;
  brand?: string;
  image_url?: string | null;
  violations_count?: number;
}

export interface Scan {
  id: string;
  product_id: string;
  extracted_text: string;
  parsed_fields: ParsedFields;
  compliance_status: 'COMPLIANT' | 'NON_COMPLIANT' | 'BORDERLINE';
  compliance_score: number;
  inspector_id: string;
  created_at: string;
  product?: Product;
}

export interface StatutoryRule {
  id: string;
  ruleCode: string;
  title: string;
  category: string;
  description: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  penaltySection: string;
  fineRange: string;
  isActive: boolean;
}

export interface DashboardStats {
  total_scans: number;
  compliant_scans: number;
  non_compliant_scans: number;
  borderline_scans: number;
  compliance_rate: number;
  total_violations: number;
  total_penalties_estimated: number;
  violations_by_rule: Record<string, number>;
  violations_by_severity: {
    CRITICAL: number;
    MAJOR: number;
    MINOR: number;
  };
  category_distribution: Record<string, number>;
  recent_inspections: Array<{
    scan_id: string;
    product_name: string;
    brand: string;
    category: string;
    image_url: string | null;
    compliance_status: 'COMPLIANT' | 'NON_COMPLIANT' | 'BORDERLINE';
    compliance_score: number;
    violations_count: number;
    created_at: string;
  }>;
}
