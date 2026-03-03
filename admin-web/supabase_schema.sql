-- 0. Drop existing tables if re-running
DROP TABLE IF EXISTS point_transactions CASCADE;
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS test_sessions CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS set_questions CASCADE;
DROP TABLE IF EXISTS exam_sets CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS passages CASCADE;
DROP TABLE IF EXISTS folders CASCADE;
DROP TABLE IF EXISTS folder_passages CASCADE;
DROP TABLE IF EXISTS vocab_lists CASCADE;
DROP TABLE IF EXISTS vocab_words CASCADE;
DROP TYPE IF EXISTS question_category CASCADE;
DROP TYPE IF EXISTS difficulty_level CASCADE;

-- 1. Enum Types for Enforcing Specific Values
CREATE TYPE question_category AS ENUM ('mock_exam', 'textbook', 'ebs', 'private');
CREATE TYPE difficulty_level AS ENUM ('high', 'medium', 'low');

-- 2. Master Passages Table (지문 창고 - 엑셀 컬럼 1:1 매칭)
CREATE TABLE IF NOT EXISTS passages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 기본 분류
    category question_category NOT NULL, -- 구분 (모의고사 등)
    grade INTEGER,                       -- 학년
    exam_year INTEGER,                   -- 년도
    exam_month VARCHAR(20),              -- 월
    question_number INTEGER,             -- 번호
    passage_type VARCHAR(50),            -- 유형 (어법 등)
    
    -- 원문 정보
    title_ko VARCHAR(255),               -- 제목
    content TEXT NOT NULL,               -- 지문
    korean_translation TEXT,             -- 한글 해석
    
    -- 분석 데이터
    korean_summary TEXT,                 -- 한글 요약
    english_summary TEXT,                -- 영어 요약
    structure_analysis TEXT,             -- 구조 분석 (기존 jsonb 대신 텍스트로 저장)
    
    -- 부가 메타데이터
    error_rate VARCHAR(50),              -- 오답률
    author VARCHAR(100),                 -- 저자
    keywords TEXT,                       -- 키워드 (쉼표 구분)
    word_count INTEGER,                  -- 단어 수
    sentence_count INTEGER,              -- 문장 수
    
    -- 기타 교과서/EBS용 예비 필드
    revised_year INTEGER,
    publisher VARCHAR(100),
    subject_name VARCHAR(100),
    unit VARCHAR(100),
    book_name VARCHAR(200),
    chapter VARCHAR(100),
    page INTEGER,
    vendor VARCHAR(100),
    part VARCHAR(100)
);

-- 3. Derived Questions Table (파생 문제)
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passage_id UUID REFERENCES passages(id) ON DELETE CASCADE,
    question_type VARCHAR(100) NOT NULL, -- 예: "단어 테스트", "빈칸추론 변형", "서술형 영작"
    instruction TEXT, -- 지시문 (예: 다음 빈칸에 알맞은 말을 고르시오)
    question_text TEXT, -- 문제 본문 (지문의 변형본이 있을 경우)
    options_json JSONB, -- 객관식 보기 (배열 형태)
    correct_answer TEXT, -- 정답 (객관식 번호 혹은 주관식 텍스트)
    points INTEGER DEFAULT 5,
    difficulty difficulty_level DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Sub-folders / Exam Sets (생성된 문제지 폴더)
-- 단어테스트, 변형문제지 등 유형에 맞춰 관리
CREATE TABLE IF NOT EXISTS exam_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    folder_type VARCHAR(100), -- 예: "단어테스트", "기말고사대비"
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Set_Questions Junction Table
CREATE TABLE IF NOT EXISTS set_questions (
    set_id UUID REFERENCES exam_sets(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    PRIMARY KEY (set_id, question_id)
);

-- 6. Students Table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    class_group VARCHAR(100),
    current_points INTEGER DEFAULT 0,
    user_id UUID, -- For future Auth linking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Test Sessions
CREATE TABLE IF NOT EXISTS test_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    set_id UUID REFERENCES exam_sets(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    total_score INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'in_progress'
);

-- 8. Answers
CREATE TABLE IF NOT EXISTS answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES test_sessions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    student_text_response TEXT,
    ai_prompt_used TEXT,
    ai_feedback TEXT,
    is_correct BOOLEAN,
    is_verified_by_teacher BOOLEAN DEFAULT false,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Point Transactions Ledger
CREATE TABLE IF NOT EXISTS point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Folders
CREATE TABLE IF NOT EXISTS folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    is_temporary BOOLEAN DEFAULT false,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Folder_Passages
CREATE TABLE IF NOT EXISTS folder_passages (
    folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    passage_id UUID REFERENCES passages(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (folder_id, passage_id)
);

-- 12. Vocab Lists
CREATE TABLE IF NOT EXISTS vocab_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Vocab Words
CREATE TABLE IF NOT EXISTS vocab_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID REFERENCES vocab_lists(id) ON DELETE CASCADE,
    passage_id UUID REFERENCES passages(id) ON DELETE CASCADE,
    word VARCHAR(100) NOT NULL,
    pos VARCHAR(50),
    phonetics VARCHAR(100),
    importance INTEGER DEFAULT 1,
    cefr_level VARCHAR(20),
    meanings JSONB,
    synonyms JSONB,
    antonyms JSONB,
    example_original TEXT,
    example_ko TEXT,
    example_generated TEXT,
    collocations JSONB,
    verb_forms JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX idx_passages_category ON passages(category);
CREATE INDEX idx_questions_passage ON questions(passage_id);
CREATE INDEX idx_sessions_student ON test_sessions(student_id);

-- ==============================================================================
-- RLS (Row Level Security) 설정 및 Policy
-- ==============================================================================
ALTER TABLE passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE set_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocab_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocab_words ENABLE ROW LEVEL SECURITY;

-- Development permissive policies
CREATE POLICY "Enable dev access" ON passages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable dev access" ON questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable dev access" ON exam_sets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable dev access" ON set_questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable dev access" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable dev access" ON test_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable dev access" ON answers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable dev access" ON point_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable dev access" ON folders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable dev access" ON folder_passages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable dev access" ON vocab_lists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable dev access" ON vocab_words FOR ALL USING (true) WITH CHECK (true);
