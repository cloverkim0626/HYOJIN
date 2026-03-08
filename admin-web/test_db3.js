const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ysjcifbfkjkumuldkjbo.supabase.co';
const supabaseKey = 'sb_publishable_eol6OhPNrWXC0fiRAY0NGg_xPmEfKVX';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    // 1. mimic fetchStudentReports
    console.log("Fetching all student reports to find target...");
    const { data: list, error: err1 } = await supabase.from('student_reports').select('*');
    if (err1) { console.error(err1); return; }
    console.log("Found reports:", list.length);

    const targetReport = list.find(r => r.raw_data_json?.attendance_status === '결석' && r.raw_data_json?.makeupStatus !== '보강완료');
    if (!targetReport) { console.log('No absent report found!'); return; }

    console.log("Target report ID:", targetReport.id);
    console.log(JSON.stringify(targetReport.raw_data_json, null, 2));

    // 2. mimic handleTrackerUpdate query
    console.log("Fetching by id...");
    const { data: singleReport, error: err2 } = await supabase.from('student_reports').select('*').eq('id', targetReport.id).single();
    if (err2) { console.error("Single fetch error:", err2); }
    else { console.log("Single fetch SUCCESS!"); }
}

check();
