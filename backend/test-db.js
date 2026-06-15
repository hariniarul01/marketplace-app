const { poolPromise } = require('./config/db');

async function testQuery() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT COUNT(*) as Count FROM Products');
        console.log('Products count:', result.recordset[0].Count);
        
        const products = await pool.request().query('SELECT TOP 5 * FROM Products');
        console.log('Products:', products.recordset);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testQuery();