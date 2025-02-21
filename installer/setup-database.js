const shell = require('shelljs');

async function setupDatabase(dbPassword) {
    if (!shell.which('psql')) {
        console.error('PostgreSQL not found! Install it first.');
        process.exit(1);
    }

    process.env.PGPASSWORD = dbPassword;

    console.log('Attempting to create database...');
    const createDb = shell.exec('psql -U postgres -h localhost -c "CREATE DATABASE inventory_db;"');

    if (createDb.code !== 0) {
        console.error('Database creation failed');
        console.error('Error:', createDb.stderr);
        process.exit(1);
    }

    console.log('Database created successfully, attempting to run schema...');

    await new Promise(resolve => setTimeout(resolve, 1000));

    const schemaCommand = `psql -U postgres -h localhost -d inventory_db -f "backend/src/db/schema.sql"`;
    console.log('Executing command:', schemaCommand);

    const runSchema = shell.exec(schemaCommand, {silent: false});

    if (runSchema.code !== 0) {
        console.error('Schema initialization failed');
        console.error('Error:', runSchema.stderr);
        process.exit(1);
    }
    
    delete process.env.PGPASSWORD;
    console.log('Database setup completed successfully!');
}

module.exports = { setupDatabase };