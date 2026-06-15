const sql = require('mssql');

const config = {
    server: '127.0.0.1',
    port: 1433,
    database: 'LoginSystem',
    user: 'app_user',
    password: 'Test@123',
    options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true,
        connectionTimeout: 30000,
        requestTimeout: 30000
    }
};

console.log('Connecting with SQL Authentication...');
console.log(`Server: ${config.server}:${config.port}`);
console.log(`Database: ${config.database}`);
console.log(`User: ${config.user}`);

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('✅ Connected to SQL Server Database: LoginSystem');
        return pool;
    })
    .catch(err => {
        console.error('❌ Database Connection Failed:', err.message);
        process.exit(1);
    });

module.exports = { sql, poolPromise };