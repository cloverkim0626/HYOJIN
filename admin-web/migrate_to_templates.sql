-- Drop old tables if replacing entirely
DROP TABLE IF EXISTS report_students CASCADE;
DROP TABLE IF EXISTS report_classes CASCADE;

-- Create report_classes table (remains mostly the same, add some defaults if needed)
CREATE TABLE IF NOT EXISTS report_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create report_templates table
CREATE TABLE IF NOT EXISTS report_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES report_classes(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly'
    template_html TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, report_type)
);

-- Create students table (just the student info and password now, no report data)
CREATE TABLE IF NOT EXISTS students_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES report_classes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) DEFAULT '1234',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student_reports table (the actual generated reports)
CREATE TABLE IF NOT EXISTS student_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students_list(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly'
    published_date DATE NOT NULL DEFAULT CURRENT_DATE,
    final_html TEXT,
    raw_data_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE report_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE students_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_reports ENABLE ROW LEVEL SECURITY;

-- Development permissive policies
CREATE POLICY "Enable dev access classes" ON report_classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable dev access templates" ON report_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable dev access students_list" ON students_list FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable dev access student_reports" ON student_reports FOR ALL USING (true) WITH CHECK (true);
