// Test database connection
const Database = require('./src/database/mock-database');

async function testDatabase() {
    try {
        console.log('Testing database connection...');
        
        // Test user registration
        const testUser = {
            username: 'testuser123',
            email: 'test@example.com',
            fullName: 'Test User',
            password: 'password123'
        };
        
        console.log('Attempting to register test user...');
        const result = await Database.registerUser(testUser);
        console.log('✅ Registration successful:', result);
        
        // Test user login
        console.log('Testing login...');
        const loginResult = await Database.loginUser({
            username: 'testuser123',
            password: 'password123'
        });
        console.log('✅ Login successful:', loginResult);
        
        console.log('🎉 Database connection test PASSED!');
        
    } catch (error) {
        console.error('❌ Database test FAILED:', error.message);
        console.error('Full error:', error);
    }
    
    process.exit(0);
}

testDatabase();
