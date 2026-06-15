const sql = require('mssql');

const config = {
    server: 'HARINI-PC\\SQLEXPRESS',
    database: 'LoginSystem',
    user: 'app_user',
    password: 'Test@123',
    options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true
    }
};

async function test() {
    try {
        console.log('Testing SQL Authentication...');
        console.log('Server:', config.server);
        console.log('User:', config.user);
        const pool = await sql.connect(config);
        console.log('✅ CONNECTION SUCCESSFUL!');
        const result = await pool.request().query('SELECT @@VERSION as version');
        console.log('SQL Version:', result.recordset[0].version);
        await pool.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ CONNECTION FAILED:', err.message);
        process.exit(1);
    }
}

test();