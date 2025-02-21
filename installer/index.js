const inquirer = require('inquirer');
const shell = require('shelljs');
const { setupDatabase } = require('./setup-database');
const axios = require('axios');
const { spawn } = require('child_process');

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

async function startServerTemporarily() {
    return new Promise((resolve, reject) => {
        const server = spawn(npmCmd, ['run', 'start'], { cwd: './backend', stdio: 'pipe' }); // Use npm start, more reliable

        server.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(`Server Output: ${output}`);
            if (output.includes('Server is running on port 3000')) {
                resolve(server);
            }
        });

        server.stderr.on('data', (data) => {
            console.error(`Server Error: ${data.toString()}`);
        });


        server.on('error', (err) => {
            reject(err);
        });

        server.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Server exited with code ${code}`));
            }
        })
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
]).then(async (answers) => {
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
    let tempServer;
    try {
        tempServer = await startServerTemporarily();
    } catch (error) {
        console.error("Failed to start temporary server:", error)
        process.exit(1);
    }


    const { username, password } = await inquirer.prompt([
        { type: 'input', name: 'username', message: 'Admin username:' },
        { type: 'password', name: 'password', message: 'Admin password:' }
    ]);

    try {
        await axios.post('http://localhost:3000/api/auth/register', { username, password });
        console.log('Admin user registered successfully!');
    } catch (err) {
        console.error('Registration failed:', err.message);
        if (err.response) {
            console.error('Server response:', err.response.data);
        }
        tempServer.kill();  
        process.exit(1); 
    } finally {
        if (tempServer) { 
            tempServer.kill(); 
        }
    }

    console.log('Starting the application...');

    const startBackend = spawn(npmCmd, ['start'], { cwd: './backend', stdio: 'inherit', shell: true });  // Inherit stdio for full output
    const startFrontend = spawn(npmCmd, ['start'], { cwd: './frontend', stdio: 'inherit', shell: true });

    startBackend.on('error', (err) => {
        console.error('Backend start error:', err);
    });

    startFrontend.on('error', (err) => {
        console.error('Frontend start error:', err);
    });


}).catch(err => {
    console.error("Prompt error:", err);
});