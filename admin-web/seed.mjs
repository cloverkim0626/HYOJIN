import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const initialClasses = [
    '[WOODOK] 아라고2 반',
    '[WOODOK] 고3 수능&내신 리바운드반',
    '[WOODOK] 아라고1 반',
    '[WOODOK] 원당고1 반'
];

const studentsMap = {
    '[WOODOK] 아라고2 반': [
        { name: '이동기', password: '2921' },
        { name: '임다은', password: '6894' },
        { name: '민채이', password: '9102' }
    ],
    '[WOODOK] 고3 수능&내신 리바운드반': [
        { name: '김가빈', password: '1234' },
        { name: '이은서', password: '1234' },
        { name: '이예윤', password: '1234' },
        { name: '박시연', password: '1234' },
        { name: '김가연', password: '1234' },
        { name: '장서현', password: '1234' }
    ],
    '[WOODOK] 아라고1 반': [],
    '[WOODOK] 원당고1 반': []
};

const arago2DailyTemplate = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>High-Res Magazine Report</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css" />
    <style>
        :root {
            --brand-color: #1a365d;
            --point-red: #b91c1c;
            --neutral-black: #111827;
            --neutral-gray: #6b7280;
            --bg-soft: #f9fafb;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-font-smoothing: antialiased; }
        
        body { 
            background-color: #ffffff;
            font-family: 'Pretendard', -apple-system, sans-serif; 
            color: var(--neutral-black);
            padding: 40px 20px;
            display: flex; justify-content: center;
        }

        .wrapper { width: 100%; max-width: 380px; }

        .header { 
            border-bottom: 6px solid var(--neutral-black); 
            padding-bottom: 24px; 
            margin-bottom: 40px;
        }
        .header-tag { 
            font-size: 11px; font-weight: 900; color: var(--brand-color); 
            letter-spacing: 0.15em; margin-bottom: 8px;
        }
        .header-name { 
            font-size: 32px; font-weight: 800; line-height: 1.1; 
            letter-spacing: -0.05em; margin-bottom: 12px;
        }
        .header-meta { 
            display: flex; justify-content: space-between; 
            font-size: 13px; font-weight: 600; color: var(--neutral-gray);
        }

        .section { margin-bottom: 40px; }
        .section-label { 
            font-size: 11px; font-weight: 900; border-top: 1px solid var(--neutral-black); 
            padding-top: 8px; margin-bottom: 16px; display: block; color: var(--neutral-gray);
        }

        .content-h { font-size: 19px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.03em; }
        .content-p { font-size: 15px; line-height: 1.75; color: #374151; font-weight: 400; }
        
        .status-wrap { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .badge { 
            font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 2px;
        }
        .badge-red { background: #fef2f2; color: var(--point-red); border: 1px solid #fecaca; }
        .badge-blue { background: #eff6ff; color: var(--brand-color); border: 1px solid #bfdbfe; }
        .plan-box { font-size: 13px; color: var(--point-red); font-weight: 600; line-height: 1.5; margin-top: 8px; }

        .test-item { margin-bottom: 35px; }
        .test-flex { display: flex; justify-content: space-between; align-items: flex-end; }
        .test-title { font-size: 17px; font-weight: 800; color: var(--neutral-black); }
        .test-desc { font-size: 12px; color: var(--neutral-gray); margin-top: 3px; }
        
        .score-group { text-align: right; }
        .score-big { font-size: 40px; font-weight: 900; line-height: 0.8; color: var(--brand-color); letter-spacing: -0.04em; }
        .score-small { font-size: 14px; color: #d1d5db; font-weight: 600; margin-left: 2px; }

        .chart-bg { height: 3px; background: #f3f4f6; position: relative; margin: 18px 0 10px 0; }
        .chart-bar { height: 100%; background: var(--brand-color); transition: width 0.8s ease; }
        .avg-dot { 
            position: absolute; top: -5px; width: 12px; height: 12px; 
            background: #fff; border: 3px solid var(--neutral-black); border-radius: 50%;
        }
        .chart-info { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: var(--neutral-gray); }

        .comment-card { background: var(--bg-soft); padding: 24px; border-radius: 4px; border-left: 4px solid var(--brand-color); }
        .comment-to { font-size: 19px; font-weight: 800; margin-bottom: 14px; display: block; color: var(--brand-color); }
        .comment-body { font-size: 15px; line-height: 1.8; color: #1f2937; white-space: pre-wrap; }
        .comment-body b { color: var(--brand-color); font-weight: 800; }

        .footer { margin-top: 50px; border-top: 1px solid #f3f4f6; padding-top: 30px; text-align: center; }
        .btn-consult { 
            display: block; background: var(--neutral-black); color: #fff; 
            text-decoration: none; padding: 20px; font-size: 14px; font-weight: 800;
            letter-spacing: 0.05em; margin-bottom: 25px; transition: 0.2s;
        }
        .btn-consult:hover { opacity: 0.9; }
        .copy { font-size: 10px; font-weight: 700; color: #d1d5db; letter-spacing: 0.15em; }
    </style>
</head>
<body>

<div class="wrapper">
    <header class="header">
        <p class="header-tag">HIGH-RESOLUTION ANALYSIS</p>
        <h1 class="header-name">{{student_name}} 학생<br>학습 보고서</h1>
        <div class="header-meta">
            <span>{{class_name}}</span>
            <span>{{published_date_kr}}</span>
        </div>
    </header>

    <section class="section">
        <span class="section-label">01 / 출결 및 오늘 학습 내용</span>
        <div class="content-h" style="color:var(--brand-color)">● {{attendance_status}}</div>
        <div class="content-p" style="white-space: pre-wrap;">{{lesson_content}}</div>
    </section>

    <section class="section">
        <span class="section-label">02 / 과제 완료 현황</span>
        <div class="status-wrap">
            <span class="content-h">{{hw_name}}</span>
            <span class="badge {{hw_badge_class}}">{{hw_status}}</span>
        </div>
        <p class="plan-box" style="display: {{hw_plan_display}}">→ 보완계획: {{hw_plan}}</p>
    </section>

    <section class="section">
        <span class="section-label">03 / 테스트 성취도 분석</span>
        {{tests_html}}
    </section>

    <section class="section">
        <span class="section-label">04 / 다음 차시 안내</span>
        <div class="content-h">{{next_date_str}}</div>
        <div class="content-p" style="font-weight: 500; white-space: pre-wrap;">{{next_content}}</div>
    </section>

    <section class="section">
        <span class="section-label">05 / 선생님 코멘트</span>
        <div class="comment-card">
            <span class="comment-to">To. {{student_name}} 학부모님</span>
            <p class="comment-body">안녕하세요, 우독학원 영어 효진T 입니다.<br><br>{{teacher_comment}}<br><br>궁금하신 사항은 편하게 문의주세요. 감사합니다. :)</p>
        </div>
    </section>

    <footer class="footer">
        <a href="{{contact_link}}" class="btn-consult">선생님과 직접 상담하기</a>
        <p class="copy">KIM HYOJIN ENGLISH / HD ANALYSIS</p>
    </footer>
</div>

</body>
</html>`;

const testItemTemplate = `
        <div class="test-item">
            <div class="test-flex">
                <div>
                    <p class="test-title" style="{{test_title_style}}">{{test_name}}</p>
                    <p class="test-desc">{{test_desc}}</p>
                </div>
                <div class="score-group">
                    <span class="score-big" style="{{test_score_style}}">{{score_now}}</span><span class="score-small">/{{score_total}}</span>
                </div>
            </div>
            <div class="chart-bg">
                <div class="chart-bar" style="width: {{score_percent}}%; {{test_bar_style}}"></div>
                <div class="avg-dot" style="left: {{avg_percent}}%;"></div>
            </div>
            <div class="chart-info">
                <span style="{{test_info_style}}">{{test_status_text}}</span>
                <span>반 평균: {{avg_score}}점</span>
            </div>
        </div>
`;

async function seed() {
    console.log('Clearing old classes and students...');
    await supabase.from('report_classes').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    for (const className of initialClasses) {
        console.log(\`Creating class: \${className}\`);
        const { data: classData, error: classError } = await supabase
            .from('report_classes')
            .insert({ name: className })
            .select()
            .single();

        if (classError) {
            console.error(classError);
            continue;
        }

        const students = studentsMap[className as keyof typeof studentsMap];
        if (students && students.length > 0) {
            const inserts = students.map(s => ({
                class_id: classData.id,
                name: s.name,
                password: s.password
            }));
            const { error: stuError } = await supabase.from('students_list').insert(inserts);
            if (stuError) console.error(stuError);
        }

        if (className === '[WOODOK] 아라고2 반') {
            const { error: tplError } = await supabase.from('report_templates').insert({
                class_id: classData.id,
                report_type: 'daily',
                template_html: arago2DailyTemplate
            });
            if (tplError) {
                console.error('Template insert Error:', tplError);
            }
        }
    }
    
    console.log('Seed completed successfully!');
}

seed();
