const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ysjcifbfkjkumuldkjbo.supabase.co';
const supabaseKey = 'sb_publishable_eol6OhPNrWXC0fiRAY0NGg_xPmEfKVX';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const reportId = 'baade307-2831-483c-b1e8-7ca71e1cd2ee';

    // Simulate what handleTrackerUpdate does:
    const { data: reportData, error } = await supabase.from('student_reports').select('id, raw_data_json').eq('id', reportId);
    if (error || !reportData) { console.error('Cannot find report', error); return; }
    console.log(reportData.length);
    console.log(reportData[0]);

    const rawJson = reportData.raw_data_json || {};

    console.log("Before update:", rawJson.makeupStatus, rawJson.postponeCount, rawJson.makeupDate);

    // Simulating POSTPONE
    rawJson.postponeCount = (rawJson.postponeCount || 0) + 1;
    rawJson.makeupDate = '2026-03-09';

    console.log("After update locally:", rawJson.makeupStatus, rawJson.postponeCount, rawJson.makeupDate);

    const { error: updateError } = await supabase.from('student_reports').update({ raw_data_json: rawJson }).eq('id', reportId);

    if (updateError) { console.error('updateError', updateError); }
    else { console.log('Successfully updated Supabase row.'); }
}

check();
