-- ============================================================
-- LABERSA GROUP BUSINESS INTELLIGENCE (LGBIS) - Database Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- DIVISIONS
-- ============================================================
CREATE TABLE divisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO divisions (id, name, code) VALUES
  ('div-hotel', 'Hotel Division', 'HOTEL'),
  ('div-waterpark', 'Waterpark Division', 'WATERPARK'),
  ('div-golf', 'Golf Division', 'GOLF');

-- ============================================================
-- BUSINESS UNITS
-- ============================================================
CREATE TABLE business_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  division_id UUID NOT NULL REFERENCES divisions(id),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO business_units (id, division_id, name, code) VALUES
  ('bu-hotel-pku', 'div-hotel', 'Labersa Hotel Pekanbaru', 'HOTEL_PKU'),
  ('bu-hotel-toba', 'div-hotel', 'Labersa Hotel Toba', 'HOTEL_TOBA'),
  ('bu-hotel-samosir', 'div-hotel', 'Labersa Hotel Samosir', 'HOTEL_SAMOSIR'),
  ('bu-wp-htn', 'div-waterpark', 'Waterpark HTN', 'WP_HTN'),
  ('bu-wp-rifan', 'div-waterpark', 'Waterpark RIFAN', 'WP_RIFAN'),
  ('bu-wp-tofan', 'div-waterpark', 'Waterpark TOFAN', 'WP_TOFAN'),
  ('bu-wp-sifan', 'div-waterpark', 'Waterpark SIFAN', 'WP_SIFAN'),
  ('bu-golf', 'div-golf', 'Labersa Golf', 'GOLF');

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'management', 'admin_input', 'auditor')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), COALESCE(NEW.raw_user_meta_data->>'role', 'admin_input'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- DAILY REPORTS
-- ============================================================
CREATE TABLE daily_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID NOT NULL REFERENCES business_units(id),
  report_date DATE NOT NULL,
  period_type VARCHAR(10) NOT NULL DEFAULT 'daily' CHECK (period_type IN ('daily', 'mtd', 'ytd')),
  source VARCHAR(50) DEFAULT 'whatsapp',
  raw_text TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_unit_id, report_date, period_type)
);

-- ============================================================
-- REPORT METRICS
-- ============================================================
CREATE TABLE report_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_report_id UUID NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
  metric_name VARCHAR(100) NOT NULL,
  metric_category VARCHAR(50) NOT NULL DEFAULT 'general',
  actual_value NUMERIC,
  budget_value NUMERIC,
  variance_value NUMERIC,
  achievement_percent NUMERIC,
  unit VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_metrics_daily_report ON report_metrics(daily_report_id);
CREATE INDEX idx_report_metrics_name ON report_metrics(metric_name);

-- ============================================================
-- BUDGETS
-- ============================================================
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID NOT NULL REFERENCES business_units(id),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  day INTEGER CHECK (day BETWEEN 1 AND 31),
  metric_name VARCHAR(100) NOT NULL,
  budget_value NUMERIC NOT NULL,
  period_type VARCHAR(10) NOT NULL CHECK (period_type IN ('daily', 'monthly', 'yearly')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_budgets_unit_date ON budgets(business_unit_id, year, month);
CREATE INDEX idx_budgets_metric ON budgets(metric_name);

-- ============================================================
-- REPORT IMPORTS
-- ============================================================
CREATE TABLE report_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_unit_id UUID NOT NULL REFERENCES business_units(id),
  report_date DATE NOT NULL,
  raw_text TEXT NOT NULL,
  parsed_data JSONB DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'parsed' CHECK (status IN ('parsed', 'saved', 'error', 'need_review')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_imports_status ON report_imports(status);
CREATE INDEX idx_report_imports_unit_date ON report_imports(business_unit_id, report_date);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  record_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Super admins can manage all users
CREATE POLICY "Super admins can manage users" ON users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Everyone can read divisions and business units
CREATE POLICY "Authenticated users can view divisions" ON divisions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view business units" ON business_units
  FOR SELECT USING (auth.role() = 'authenticated');

-- Management and Auditor can read all reports
CREATE POLICY "Management and Auditor can view reports" ON daily_reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('management', 'auditor', 'super_admin'))
  );

-- Admin Input can manage their own reports
CREATE POLICY "Admin can manage own reports" ON daily_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin_input', 'super_admin'))
  );

-- Report metrics follow same policy as their parent report
CREATE POLICY "Authenticated users can view metrics" ON report_metrics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage metrics" ON report_metrics
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin_input', 'super_admin'))
  );

-- Budgets
CREATE POLICY "Authenticated users can view budgets" ON budgets
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Super admin can manage budgets" ON budgets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Report imports
CREATE POLICY "Authenticated users can view imports" ON report_imports
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage imports" ON report_imports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin_input', 'super_admin'))
  );

-- Audit logs
CREATE POLICY "Super admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Authenticated users can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Get report with metrics
CREATE OR REPLACE FUNCTION get_report_with_metrics(p_business_unit_id UUID, p_report_date DATE)
RETURNS TABLE (
  report_id UUID,
  metric_name VARCHAR,
  metric_category VARCHAR,
  actual_value NUMERIC,
  budget_value NUMERIC,
  variance_value NUMERIC,
  achievement_percent NUMERIC,
  unit VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rm.daily_report_id,
    rm.metric_name,
    rm.metric_category,
    rm.actual_value,
    rm.budget_value,
    rm.variance_value,
    rm.achievement_percent,
    rm.unit
  FROM report_metrics rm
  JOIN daily_reports dr ON rm.daily_report_id = dr.id
  WHERE dr.business_unit_id = p_business_unit_id
    AND dr.report_date = p_report_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
