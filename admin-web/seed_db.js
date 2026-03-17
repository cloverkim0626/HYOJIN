const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://ysjcifbfkjkumuldkjbo.supabase.co';
const supabaseKey = 'sb_publishable_eol6OhPNrWXC0fiRAY0NGg_xPmEfKVX';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log("Seeding database...");
    
    // 1. Ensure season 2026 FIRST DRIVE
    let { data: season } = await supabase.from('replay_seasons').select('*').eq('name', '2026 FIRST DRIVE').single();
    if (!season) {
        const { data: newSeason, error: sErr } = await supabase.from('replay_seasons')
            .insert({ name: '2026 FIRST DRIVE', is_active: true }).select().single();
        if (sErr) throw sErr;
        season = newSeason;
        console.log("Created season: 2026 FIRST DRIVE");
    }

    const classData = [
        { name: 'ARAGO 01', file: 'arago1.html' },
        { name: 'ARAGO 02', file: 'arago2.html' },
        { name: 'REBOUND 03', file: 'rebound3.html' },
        { name: 'WONDANG 01', file: 'wondang1.html' },
    ];

    for (let cls of classData) {
        let { data: dbCls } = await supabase.from('replay_classes')
            .select('*').eq('name', cls.name).eq('season_id', season.id).single();
        
        if (!dbCls) {
            const { data: newCls, error: cErr } = await supabase.from('replay_classes')
                .insert({ season_id: season.id, name: cls.name }).select().single();
            if (cErr) throw cErr;
            dbCls = newCls;
            console.log(`Created class: ${cls.name}`);
        }

        const html = fs.readFileSync(path.join(__dirname, 'public', 'syllabus', cls.file), 'utf8');
        const regex = /WEEK (\d+)<span[^>]*>(.*?)<\/span>/g;
        let match;
        
        while ((match = regex.exec(html)) !== null) {
            const weekNum = parseInt(match[1]);
            const dateRange = match[2].trim();

            let { data: dbWeek } = await supabase.from('replay_weeks')
                .select('*').eq('class_id', dbCls.id).eq('week_number', weekNum).single();
            
            const defaultPassword = `${cls.name.split(' ')[0].toLowerCase()}${weekNum}`;
            
            if (!dbWeek) {
                const { error: wErr } = await supabase.from('replay_weeks').insert({
                    class_id: dbCls.id,
                    week_number: weekNum,
                    title: `수특 심화독해`, // Default title based on mockups
                    date_range: dateRange,
                    password: defaultPassword
                });
                if (wErr) throw wErr;
                console.log(`Inserted ${cls.name} - Week ${weekNum} (${dateRange})`);
            } else {
                await supabase.from('replay_weeks').update({ date_range: dateRange }).eq('id', dbWeek.id);
                console.log(`Updated ${cls.name} - Week ${weekNum} (${dateRange})`);
            }
        }
    }
}

seed().then(() => console.log('Seeding Complete')).catch(console.error);
