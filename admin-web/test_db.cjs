const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const supabaseKeyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = supabaseUrlMatch ? supabaseUrlMatch[1].trim() : '';
const supabaseAnonKey = supabaseKeyMatch ? supabaseKeyMatch[1].trim() : '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    console.log("Checking report_classes...");
    const { data: c, error: ce } = await supabase.from('report_classes').select('*');
    if (ce) console.error("Error classes:", ce);
    else console.log(`Found ${c.length} classes`);

    console.log("Checking students_list...");
    const { data: s, error: se } = await supabase.from('students_list').select('*');
    if (se) console.error("Error students:", se);
    else console.log(`Found ${s.length} students`);
}

check();
