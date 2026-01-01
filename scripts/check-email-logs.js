const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            process.env[key] = value;
        }
    });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log('🔍 Checking latest email logs...\n');

    const { data: logs, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('❌ DB Query Error:', error.message);
        return;
    }

    if (!logs || logs.length === 0) {
        console.log('⚠️ No email logs found.');
        return;
    }

    console.table(logs.map(log => ({
        Time: new Date(log.created_at).toLocaleString(),
        To: log.destinatario,
        Type: log.tipo,
        Status: log.status,
        Error: log.erro ? log.erro.substring(0, 50) + '...' : ''
    })));
}

main();
