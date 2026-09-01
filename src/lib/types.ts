export type DivisionCode = 'HOTEL' | 'WATERPARK' | 'GOLF';

export type UserRole = 'super_admin' | 'management' | 'admin_input' | 'auditor';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Division {
  id: string;
  name: string;
  code: DivisionCode;
}

export interface BusinessUnit {
  id: string;
  division_id: string;
  name: string;
  code: string;
  active: boolean;
  division?: Division;
}

export interface DailyReport {
  id: string;
  business_unit_id: string;
  report_date: string;
  period_type: 'daily' | 'mtd' | 'ytd';
  source: string;
  raw_text: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  business_unit?: BusinessUnit;
  metrics?: ReportMetric[];
}

export interface ReportMetric {
  id: string;
  daily_report_id: string;
  metric_name: string;
  metric_category: string;
  actual_value: number | null;
  budget_value: number | null;
  variance_value: number | null;
  achievement_percent: number | null;
  unit: string;
  created_at: string;
}

export interface Budget {
  id: string;
  business_unit_id: string;
  year: number;
  month: number;
  day: number | null;
  metric_name: string;
  budget_value: number;
  period_type: 'daily' | 'monthly' | 'yearly';
}

export interface ReportImport {
  id: string;
  business_unit_id: string;
  report_date: string;
  raw_text: string;
  parsed_data: Record<string, unknown>;
  status: 'parsed' | 'saved' | 'error' | 'need_review';
  created_by: string;
  created_at: string;
  business_unit?: BusinessUnit;
  created_by_user?: User;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string;
  details: Record<string, unknown>;
  created_at: string;
  user?: User;
}

// Parsed report data for preview
export interface ParsedReportData {
  unit_name: string;
  unit_code: string;
  division_code: DivisionCode;
  report_date: string;
  metrics: ParsedMetric[];
  warnings: string[];
  confidence: number;
}

export interface ParsedMetric {
  name: string;
  category: string;
  actual: number | null;
  budget: number | null;
  variance: number | null;
  achievement: number | null;
  unit: string;
}

// Dashboard aggregated data
export interface DashboardKPI {
  label: string;
  value: number;
  budget: number | null;
  variance: number | null;
  achievement: number | null;
  trend: number | null;
  unit: string;
  format: 'currency' | 'percent' | 'number';
}

export interface ChartDataPoint {
  date: string;
  label: string;
  actual: number;
  budget: number | null;
  [key: string]: string | number | null;
}

export interface UnitPerformance {
  unit_id: string;
  unit_name: string;
  division: string;
  revenue_actual: number;
  revenue_budget: number | null;
  achievement: number | null;
  rank: number;
}

export type DateFilter = 'today' | 'yesterday' | 'this_month' | 'previous_month' | 'ytd' | 'custom';

export interface DateRange {
  start: string;
  end: string;
}
