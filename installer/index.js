const inquirer = require('inquirer');
const shell = require('shelljs');
const { setupDatabase } = require('./setup-database');
const axios = require('axios');
const { spawn } = require('child_process');
const { start } = require('repl');

shell.exec('npm install concurrently --save-dev');
shell.cd('backend');
shell.exec('npm install');
shell.cd('../frontend');
shell.exec('npm install');
shell.cd('..');

async function startServerTemporarily() {
    return new Promise((resolve, reject) => {
        const server = spawn('node', ['server.js'], { cwd: './backend' });

        server.stdout.on('data', (data) => {
            if (data.toString().includes('Server is running on port 3000')) {
                resolve(server);
            }
        });

        server.on('error', (err) => {
            reject(err);
        });
    });
}


inquirer.prompt([
    {
        type: 'password',
        name: 'DB_PASSWORD',
        message: 'Enter PostgreSQL database password:',
    },
    {
        type: 'password',
        name: 'JWT_SECRET',
        message: 'Enter JWT secret key:',
    }
]).then(async (answers) =>{
    const backendEnv = `
        PORT=3000
        DB_HOST=localhost
        DB_NAME=inventory_db
        DB_USER=postgres
        DB_PASSWORD=${answers.DB_PASSWORD}
        JWT_SECRET=${answers.JWT_SECRET}
    `;
    const frontendEnv = `
        FAST_REFRESH=true
        REACT_APP_API_URL=http://localhost:3000
    `;

    shell.echo(backendEnv).to('backend/.env');
    shell.echo(frontendEnv).to('frontend/.env');

    await setupDatabase(answers.DB_PASSWORD);

    console.log('Starting temporary server for registration...');
    const tempServer = await startServerTemporarily();

    const { username, password } = await inquirer.prompt([
        { type: 'input', name: 'username', message: 'Admin username:' },
        { type: 'password', name: 'password', message: 'Admin password:' }
    ]);

    try {
        await axios.post('http://localhost:3000/api/auth/register', { username, password });
        console.log('Admin user registered successfully!');

        tempServer.kill();

        console.log('Starting the application...');
        shell.exec('npx concurrently "cd backend && npm start" "cd frontend && npm start"');
    } catch (err) {
        console.error('Registration failed:', err.message);
        if (err.response) {
            console.error('Server response:', err.response.data);
        }
        tempServer.kill();
        process.exit(1);
    }
});
