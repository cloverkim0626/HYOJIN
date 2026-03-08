const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ysjcifbfkjkumuldkjbo.supabase.co';
const supabaseKey = 'sb_publishable_eol6OhPNrWXC0fiRAY0NGg_xPmEfKVX';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Fetching student reports...");
    const { data, error } = await supabase.from('student_reports').select('id, student_id, raw_data_json');
    if (error) { console.error(error); return; }

    let found = false;
    for (const r of data) {
        if (r.raw_data_json?.attendance_status === '결석' && r.raw_data_json?.makeupStatus !== '보강완료') {
            console.log('--- Found unresolved absence ---');
            console.log('Report ID:', `[${r.id}]`);
            console.log('Makeup Status:', r.raw_data_json.makeupStatus);
            console.log('Makeup Type:', r.raw_data_json.makeupType);
            console.log('Postpone Count:', r.raw_data_json.postponeCount);
            console.log('Makeup Date:', r.raw_data_json.makeupDate);
            found = true;
        }
    }
    if (!found) console.log('No unresolved absences found in DB!');
}

check();
