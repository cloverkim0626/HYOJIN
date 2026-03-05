-- Create or replace report_classes table
CREATE TABLE IF NOT EXISTS report_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create or replace report_students table
CREATE TABLE IF NOT EXISTS report_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES report_classes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255),
    daily_html TEXT,
    weekly_html TEXT,
    monthly_html TEXT,
    daily_link VARCHAR(255),
    weekly_link VARCHAR(255),
    monthly_link VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE report_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_students ENABLE ROW LEVEL SECURITY;

-- Development permissive policies
CREATE POLICY "Enable dev access classes" ON report_classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable dev access students" ON report_students FOR ALL USING (true) WITH CHECK (true);
