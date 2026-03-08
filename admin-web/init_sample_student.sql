-- 1. Create the Sample Class if it doesn't exist
INSERT INTO report_classes (name)
SELECT '[공개용] 리포트 샘플'
WHERE NOT EXISTS (
    SELECT 1 FROM report_classes WHERE name = '[공개용] 리포트 샘플'
);

-- 2. Get the ID of the Sample Class
DO $$
DECLARE
    sample_class_id UUID;
BEGIN
    SELECT id INTO sample_class_id FROM report_classes WHERE name = '[공개용] 리포트 샘플' LIMIT 1;

    -- 3. Create the Sample Student (Kim Woodog) if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM students_list 
        WHERE class_id = sample_class_id AND name = '김우독'
    ) THEN
        INSERT INTO students_list (class_id, name, password)
        VALUES (sample_class_id, '김우독', NULL);
    END IF;
END $$;
