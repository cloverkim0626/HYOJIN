import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Fetching student reports...");
    const { data, error } = await supabase.from('student_reports').select('id, student_id, raw_data_json');
    if (error) { console.error(error); return; }

    let found = false;
    for (const r of data) {
        if (r.raw_data_json?.attendance_status === '결석' && r.raw_data_json?.makeupStatus !== '보강완료') {
            console.log('Found unresolved absence:', r.id);
            console.log('Student ID:', r.student_id);
            console.log('Raw JSON type check:', typeof r.raw_data_json);
            console.log(JSON.stringify(r.raw_data_json, null, 2));
            found = true;
        }
    }
    if (!found) console.log('No unresolved absences found in DB!');
}

check();
