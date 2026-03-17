const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://ysjcifbfkjkumuldkjbo.supabase.co', 'sb_publishable_eol6OhPNrWXC0fiRAY0NGg_xPmEfKVX');
async function update() {
   const { data, error } = await supabase.from('replay_classes').update({ name: 'GO3' }).eq('name', 'REBOUND 03');
   if (error) console.error(error);
   else console.log('Updated REBOUND 03 to GO3');
}
update();
