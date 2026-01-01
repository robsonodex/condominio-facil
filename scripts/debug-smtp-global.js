const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
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
            // Remove quotes if present
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            process.env[key] = value;
        }
    });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ENCRYPTION_KEY = process.env.SMTP_ENCRYPTION_KEY || 'default-key-change-in-production!';

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

// Crypto Functions (Copied from src/lib/smtp-crypto.ts)
function getKey() {
    return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
}

function decryptPassword(encryptedData) {
    try {
        const key = getKey();
        const parts = encryptedData.split(':');

        if (parts.length !== 3) throw new Error('Invalid format');

        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];

        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('Decryption failed:', error.message);
        throw error;
    }
}

async function main() {
    console.log('🔍 Debugging Global SMTP Configuration...\n');
    // Sanitize Key for log
    const secureKeyLog = ENCRYPTION_KEY === 'default-key-change-in-production!' ? 'DEFAULT' : 'CUSTOM (***)';
    console.log(`🔑 Using Encryption Key: ${secureKeyLog}`);

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Fetch Global Config
    console.log('📡 Fetching config from DB...');
    const { data: globalConfig, error } = await supabase
        .from('configuracoes_smtp')
        .select('*')
        .is('condominio_id', null)
        .eq('is_active', true)
        .single();

    if (error) {
        console.error('❌ DB Query Error:', error.message);
        return;
    }

    if (!globalConfig) {
        console.error('❌ No Global SMTP config found (condominio_id = NULL)');
        return;
    }

    console.log(`✅ Found Global Config for email: ${globalConfig.smtp_from_email}`);
    console.log(`   Host: ${globalConfig.smtp_host}:${globalConfig.smtp_port}`);
    console.log(`   User: ${globalConfig.smtp_user}`);

    // Decrypt Password
    let password;
    try {
        password = decryptPassword(globalConfig.smtp_password);
        console.log('✅ Password decrypted successfully');
    } catch (e) {
        console.error('❌ Failed to decrypt password. Check if ENCRYPTION_KEY matches what was used to encrypt.');
        return;
    }

    // Verify SMTP
    console.log('\n🔌 Connecting to SMTP Server...');
    const useSecure = globalConfig.smtp_port === 465;
    const transporter = nodemailer.createTransport({
        host: globalConfig.smtp_host,
        port: globalConfig.smtp_port,
        secure: useSecure,
        auth: {
            user: globalConfig.smtp_user,
            pass: password,
        },
        tls: { rejectUnauthorized: false }, // Mimic app config
        connectionTimeout: 10000
    });

    try {
        await transporter.verify();
        console.log('🎉 SMTP Connection SUCCESSFUL!');
        console.log('   The credentials in the database are valid.');
    } catch (smtpError) {
        console.error('❌ SMTP Connection FAILED:');
        console.error(smtpError.message);
        if (smtpError.response) console.error('Response:', smtpError.response);

        console.log('\nPossible causes:');
        console.log('1. Wrong password (decrypted value might be wrong if key changed).');
        console.log('2. Firewall / Port blocking.');
        console.log('3. Email provider blocked the IP.');
    }
}

main();
