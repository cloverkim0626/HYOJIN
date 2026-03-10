const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://ysjcifbfkjkumuldkjbo.supabase.co', 'sb_publishable_eol6OhPNrWXC0fiRAY0NGg_xPmEfKVX');

async function run() {
    const { data: stu } = await supabase.from('students_list').select('id, name').eq('name', '김우독');
    const stuId = stu[0].id;
    const { data: reps } = await supabase.from('student_reports')
        .select('id, published_date, final_html, raw_data_json')
        .eq('student_id', stuId)
        .order('published_date', { ascending: false });
    const rep = reps[0];

    let tHtml = rep.final_html;
    const raw = rep.raw_data_json;

    let hwHtml = '';
    raw.homeworks.forEach((hw, idx) => {
        if (!hw.name || hw.isWordOrTest) return;
        const sts = raw.hw_statuses[idx];
        if (!sts) return;
        if (hw.assignees.length > 0 && !hw.assignees.includes(stuId)) return;

        const isComplete = sts.status === '확인완료' || sts.status === '미완 후 보충완료';
        const badgeClass = isComplete ? 'badge-blue b-b' : 'badge-red b-r';
        const badgeStyle = isComplete ? 'background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe;' : 'background:#fef2f2;color:#dc2626;border:1px solid #fecaca;';

        // Match the inline injection logic I added earlier
        hwHtml += `
        <div style="margin-bottom: 12px;">
            <div class="status-wrap" style="display:flex; justify-content:space-between; align-items:center;">
                <span class="content-h" style="font-size:14px; font-weight:800;">${hw.name}</span>
                <span class="badge ${badgeClass}" style="font-size:10px; font-weight:800; padding:3px 8px; border-radius:3px; ${badgeStyle}">${sts.status}</span>
            </div>
            ${!isComplete && sts.plan ? '<p class="plan-box" style="font-size:13px; color:#dc2626; font-weight:600; margin-top:6px;">→ 보완계획: ' + sts.plan + '</p>' : ''}
        </div>`;
    });

    // Replace the old hardcoded block.
    // We already know it looks like this:
    /*
        <div class="status-wrap">
            <span class="content-h">수능특강 7강 워크북 모두 풀기</span>
            <span class="badge badge-red">교재미지참</span>
        </div>
        <p class="plan-box" style="display: block">→ 보완계획: 3/11(수)까지 카톡으로 찍어서 올리기.</p>
    */

    // Use regex to locate the 02 section and replace the contents safely
    const newHtml = tHtml.replace(
        /(<span class="section-label">02 \/ 과제 완료 현황<\/span>)(.*?)<\/section>/s,
        `$1\n${hwHtml}\n    </section>`
    );

    await supabase.from('student_reports').update({ final_html: newHtml }).eq('id', rep.id);
    console.log('Re-baked report', rep.id);
}
run();
