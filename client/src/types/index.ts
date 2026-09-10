export type UserRole = 'inspector' | 'admin';

export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  phone?: string;
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
  has_currency_symbol?: boolean;
  currency?: string;
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
  raw?: string;
  is_compliant: boolean;
  error?: string | null;
}

export interface ParsedIngredients {
  raw: string;
  items?: string[];
  count?: number;
  has_heading?: boolean;
}

export interface ParsedNutritionalInfo {
  is_declared: boolean;
  per_unit?: string;
  energy?: string | null;
  protein?: string | null;
  carbohydrate?: string | null;
  total_sugars?: string | null;
  added_sugars?: string | null;
  total_fat?: string | null;
  saturated_fat?: string | null;
  trans_fat?: string | null;
  sodium?: string | null;
  raw?: string;
}

export interface ParsedVegNonVeg {
  type: 'VEG' | 'NON_VEG';
  symbol?: string;
  is_declared: boolean;
  raw?: string;
}

export interface ParsedFssaiLicense {
  license_number: string | null;
  is_valid_14_digit: boolean;
  has_fssai_logo: boolean;
  raw: string;
  error?: string | null;
}

export interface ParsedExpiryDate {
  expiry_or_period: string;
  raw: string;
  type?: string;
  is_compliant: boolean;
}

export interface ParsedBatchNumber {
  value: string;
  raw: string;
  is_compliant: boolean;
}

export interface ParsedAllergenDeclaration {
  is_declared: boolean;
  has_allergens: boolean;
  statement?: string;
  raw?: string;
}

export interface ParsedStorageInstructions {
  is_declared: boolean;
  instructions?: string;
  raw?: string;
}

export interface ParsedCountryOfOrigin {
  country: string;
  is_imported: boolean;
  raw?: string;
}

export interface RuleCheckItem {
  id?: string;
  rule_code: string;
  title: string;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'NOT_APPLICABLE';
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  statutory_provision?: string;
  extracted_value?: string;
  defect?: string | null;
  suggested_remedy?: string;
}

export interface ParsedFields {
  // 14 Mandatory FSSAI Food Packaging Declarations
  commodity_name: string;
  ingredients?: ParsedIngredients | null;
  nutritional_info?: ParsedNutritionalInfo | null;
  net_quantity: ParsedNetQuantity | null;
  veg_non_veg?: ParsedVegNonVeg | null;
  fssai_license?: ParsedFssaiLicense | null;
  mfg_date: ParsedDate | null;
  expiry_date?: ParsedExpiryDate | null;
  batch_number?: ParsedBatchNumber | null;
  manufacturer: ParsedManufacturer | null;
  consumer_care: ParsedConsumerCare | null;
  allergen_declaration?: ParsedAllergenDeclaration | null;
  storage_instructions?: ParsedStorageInstructions | null;
  country_of_origin: string | ParsedCountryOfOrigin | null;

  // Legacy fields
  mrp?: ParsedMRP | null;
  unit_sale_price?: { value: number; unit: string; raw: string } | null;
  readability?: {
    clarity: 'HIGH' | 'MEDIUM' | 'LOW';
    estimated_font_size?: string;
    word_count: number;
    line_count?: number;
  };
}

export interface Violation {
  id?: string;
  scan_id?: string;
  rule_code: string;
  rule_id?: string;
  title?: string;
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
  rule_checks_matrix?: RuleCheckItem[];
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
