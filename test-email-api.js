/**
 * Test Script for Email API
 * Run with: node test-email-api.js
 * 
 * Prerequisites:
 * - Dev server running (npm run dev)
 * - SMTP configured in .env.local
 */

const testEmailAPI = async () => {
    console.log('🧪 Testing Email API...\n');

    const testData = {
        tipo: 'welcome',
        destinatario: 'robson@teste.com', // Change to your real email
        dados: {
            nome: 'Robson Teste',
            loginUrl: 'http://localhost:3000/login'
        },
        internalCall: true // Bypass auth requirement
    };

    try {
        console.log('📤 Sending test email to:', testData.destinatario);

        const response = await fetch('http://localhost:3000/api/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData),
        });

        const result = await response.json();

        console.log('\n✅ Response Status:', response.status);
        console.log('📊 Result:', JSON.stringify(result, null, 2));

        if (result.success) {
            console.log('\n🎉 SUCCESS! Email sent successfully!');
            console.log(`📧 Check inbox at: ${testData.destinatario}`);
            console.log(`🔄 Attempts: ${result.attempts}`);
        } else {
            console.log('\n❌ FAILED to send email');
            console.log('Error:', result.error);

            if (result.error?.includes('SMTP')) {
                console.log('\n💡 TIP: Configure SMTP variables in .env.local:');
                console.log('   - SMTP_HOST');
                console.log('   - SMTP_PORT');
                console.log('   - SMTP_USER');
                console.log('   - SMTP_PASS');
                console.log('   - SMTP_FROM');
            }
        }

        // Test logging in database
        console.log('\n📝 Check email_logs table in Supabase for this entry');

    } catch (error) {
        console.error('\n💥 Error:', error.message);
        console.log('\n❗ Make sure:');
        console.log('   1. Dev server is running (npm run dev)');
        console.log('   2. Server is accessible at http://localhost:3000');
    }
};

testEmailAPI();
