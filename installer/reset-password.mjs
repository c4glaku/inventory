import { input, password, select } from '@inquirer/prompts';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import pg from 'pg';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Client } = pg;
const installerDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(installerDirectory, '..');
const environmentPath = path.join(projectRoot, 'backend', '.env');

function databaseConfig() {
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl) {
        return { connectionString: databaseUrl, connectionTimeoutMillis: 5_000 };
    }

    if (!process.env.DB_PASSWORD) {
        throw new Error('No database configuration found. Run npm run setup or configure backend/.env first.');
    }

    return {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME || 'inventory_db',
        user: process.env.DB_USER || 'inventory_app',
        password: process.env.DB_PASSWORD,
        ...(process.env.DB_SSL === 'true'
            ? { ssl: { rejectUnauthorized: true } }
            : {}),
        connectionTimeoutMillis: 5_000,
    };
}

function validUsername(value) {
    return typeof value === 'string' && value.trim().length >= 3 && value.trim().length <= 50;
}

function validPassword(value) {
    const size = Buffer.byteLength(value, 'utf8');
    return size >= 12 && size <= 72;
}

async function promptForPassword() {
    const newPassword = await password({
        message: 'New password (12–72 bytes)',
        mask: '*',
        validate: value => validPassword(value)
            ? true
            : 'Use a password between 12 and 72 UTF-8 bytes.',
    });
    const confirmation = await password({ message: 'Confirm new password', mask: '*' });
    if (newPassword !== confirmation) {
        throw new Error('Passwords did not match. Run the command again to retry.');
    }
    return newPassword;
}

async function main() {
    const environment = dotenv.config({ path: environmentPath, quiet: true });
    if (environment.error && environment.error.code !== 'ENOENT') {
        throw new Error(`Could not read backend/.env: ${environment.error.message}`);
    }

    const client = new Client(databaseConfig());
    let connected = false;
    try {
        await client.connect();
        connected = true;
        const { rows: users } = await client.query(
            'SELECT id, username FROM users ORDER BY lower(username), id'
        );

        let userId;
        let username;
        let createInitialAccount = false;
        if (users.length > 0) {
            userId = await select({
                message: 'Choose the account to reset',
                choices: users.map(user => ({ name: user.username, value: user.id })),
            });
            username = users.find(user => user.id === userId)?.username;
        } else {
            console.log('No accounts exist yet. Create the initial admin account.');
            username = (await input({
                message: 'Initial admin username',
                validate: value => validUsername(value.trim())
                    ? true
                    : 'Use between 3 and 50 characters.',
            })).trim();
            createInitialAccount = true;
        }

        const newPassword = await promptForPassword();
        const passwordHash = await bcrypt.hash(newPassword, 12);

        await client.query('BEGIN');
        try {
            if (createInitialAccount) {
                await client.query('SELECT pg_advisory_xact_lock(41823, 1)');
                const { rows } = await client.query('SELECT COUNT(*)::int AS count FROM users');
                if (rows[0].count > 0) {
                    throw new Error('An account was created while setup was running. Run this command again.');
                }
                const result = await client.query(
                    'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id',
                    [username, passwordHash]
                );
                userId = result.rows[0].id;
            } else {
                const result = await client.query(
                    'UPDATE users SET password_hash = $1 WHERE id = $2',
                    [passwordHash, userId]
                );
                if (result.rowCount !== 1) {
                    throw new Error('The selected account no longer exists. Run this command again.');
                }
            }
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK').catch(() => {});
            throw error;
        }

        console.log(createInitialAccount
            ? `Initial admin account "${username}" is ready. You can now sign in.`
            : `Password updated for "${username}". You can now sign in.`);
    } finally {
        if (connected) await client.end();
    }
}

main().catch(error => {
    console.error(`Password recovery failed: ${error.message}`);
    process.exitCode = 1;
});
