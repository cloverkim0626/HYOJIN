const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

console.log('URL:', supabaseUrl);
console.log('KEY:', supabaseKey.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('\n=== report_classes ===');
    const { data: classes, error: ce } = await supabase.from('report_classes').select('*');
    if (ce) console.error('ERROR:', JSON.stringify(ce));
    else {
        console.log('Count:', classes.length);
        classes.forEach(c => console.log(`  - ${c.id} | ${c.name}`));
    }

    console.log('\n=== students_list ===');
    const { data: students, error: se } = await supabase.from('students_list').select('*');
    if (se) console.error('ERROR:', JSON.stringify(se));
    else {
        console.log('Count:', students.length);
        students.forEach(s => console.log(`  - ${s.id} | ${s.name} | class: ${s.class_id} | pw: ${s.password}`));
    }

    console.log('\n=== report_templates ===');
    const { data: templates, error: te } = await supabase.from('report_templates').select('id, class_id, report_type');
    if (te) console.error('ERROR:', JSON.stringify(te));
    else {
        console.log('Count:', templates.length);
        templates.forEach(t => console.log(`  - ${t.id} | type: ${t.report_type} | class: ${t.class_id}`));
    }

    console.log('\n=== student_reports ===');
    const { data: reports, error: re } = await supabase.from('student_reports').select('id, student_id, report_type, published_date');
    if (re) console.error('ERROR:', JSON.stringify(re));
    else {
        console.log('Count:', reports.length);
        reports.forEach(r => console.log(`  - ${r.id} | student: ${r.student_id} | ${r.report_type} | ${r.published_date}`));
    }
}

check();
