const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://ysjcifbfkjkumuldkjbo.supabase.co', 'sb_publishable_eol6OhPNrWXC0fiRAY0NGg_xPmEfKVX');

async function run() {
    const { data: tpls } = await supabase.from('report_templates').select('id, template_html');
    for (const t of tpls) {
        if (t.template_html.includes('{{hw_name}}') && !t.template_html.includes('{{homeworks_html}}')) {
            console.log('Found bad template:', t.id);

            // Replaces the entire hardcoded block for the first homework with {{homeworks_html}}
            let newHtml = t.template_html.replace(
                /<div class="status-wrap">\s*<span class="content-h">\{\{hw_name\}\}<\/span>\s*<span class="badge \{\{hw_badge_class\}\}">\{\{hw_status\}\}<\/span>\s*<\/div>\s*<p class="plan-box".*?\{\{hw_plan\}\}<\/p>/,
                '{{homeworks_html}}'
            );

            // To be safe against slightly modified templates, also try replacing just the name part if the full match fails
            if (newHtml === t.template_html) {
                newHtml = t.template_html.replace(
                    /<div class="status-wrap">\s*<span class="content-h">\{\{hw_name\}\}<\/span>\s*<span class="badge \{\{hw_badge_class\}\}">\{\{hw_status\}\}<\/span>\s*<\/div>/,
                    '{{homeworks_html}}'
                );
            }

            await supabase.from('report_templates').update({ template_html: newHtml }).eq('id', t.id);
            console.log('Fixed', t.id);
        }
    }
    console.log('Done');
}
run();
