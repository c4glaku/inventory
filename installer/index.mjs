import { input, password } from '@inquirer/prompts';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import { randomBytes } from 'node:crypto';
import { access, chmod, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Client } = pg;
const installerDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(installerDirectory, '..');
const backendDirectory = path.join(projectRoot, 'backend');
const environmentPath = path.join(backendDirectory, '.env');
const schemaPath = path.join(backendDirectory, 'src', 'db', 'schema.sql');

function quoteIdentifier(value) {
    return `"${value.replaceAll('"', '""')}"`;
}

function quoteLiteral(value) {
    return `'${value.replaceAll("'", "''")}'`;
}

function validateIdentifier(value, label) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/.test(value)) {
        throw new Error(`${label} must use letters, numbers, and underscores, and start with a letter or underscore.`);
    }
    return value;
}

function dotenvValue(value) {
    return JSON.stringify(value);
}

async function requireNewEnvironmentFile() {
    try {
        await access(environmentPath);
        throw new Error('backend/.env already exists. Keep it and start with npm run dev, or move it aside before running setup again.');
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }
}

async function setupDatabase({ host, port, adminUser, adminPassword, databaseName, appUser, appPassword }) {
    const adminConfig = {
        host,
        port,
        user: adminUser,
        password: adminPassword,
        database: 'postgres',
        connectionTimeoutMillis: 5_000,
    };

    const admin = new Client(adminConfig);
    let databaseCreated = false;
    let roleCreated = false;

    try {
        await admin.connect();
        const roleExists = await admin.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [appUser]);
        if (roleExists.rowCount > 0) {
            throw new Error(`PostgreSQL role "${appUser}" already exists. Use another role name or configure the existing installation manually.`);
        }

        const databaseExists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [databaseName]);
        await admin.query(
            `CREATE ROLE ${quoteIdentifier(appUser)} LOGIN PASSWORD ${quoteLiteral(appPassword)}`
        );
        roleCreated = true;

        if (databaseExists.rowCount === 0) {
            await admin.query(
                `CREATE DATABASE ${quoteIdentifier(databaseName)} OWNER ${quoteIdentifier(appUser)}`
            );
            databaseCreated = true;
        }
    } catch (error) {
        if (roleCreated) {
            await admin.query(`DROP ROLE IF EXISTS ${quoteIdentifier(appUser)}`).catch(() => {});
        }
        throw error;
    } finally {
        await admin.end().catch(() => {});
    }

    const databaseAdmin = new Client({ ...adminConfig, database: databaseName });
    try {
        await databaseAdmin.connect();
        const schema = await readFile(schemaPath, 'utf8');
        await databaseAdmin.query(schema);
        await databaseAdmin.query(`GRANT CONNECT ON DATABASE ${quoteIdentifier(databaseName)} TO ${quoteIdentifier(appUser)}`);
        await databaseAdmin.query(`GRANT USAGE ON SCHEMA public TO ${quoteIdentifier(appUser)}`);
        await databaseAdmin.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${quoteIdentifier(appUser)}`);
        await databaseAdmin.query(`GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO ${quoteIdentifier(appUser)}`);
        await databaseAdmin.query(
            `ALTER DEFAULT PRIVILEGES FOR ROLE ${quoteIdentifier(adminUser)} IN SCHEMA public
             GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${quoteIdentifier(appUser)}`
        );
        await databaseAdmin.query(
            `ALTER DEFAULT PRIVILEGES FOR ROLE ${quoteIdentifier(adminUser)} IN SCHEMA public
             GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO ${quoteIdentifier(appUser)}`
        );

        const { rows } = await databaseAdmin.query('SELECT COUNT(*)::int AS count FROM users');
        if (rows[0].count > 0) {
            return { createdAdmin: false, databaseCreated };
        }

        const username = (await input({
            message: 'Initial admin username',
            validate: value => value.trim().length >= 3 && value.trim().length <= 50
                ? true
                : 'Use between 3 and 50 characters.',
        })).trim();
        const adminPassword = await password({
            message: 'Initial admin password (12–72 bytes)',
            mask: '*',
            validate: value => Buffer.byteLength(value, 'utf8') >= 12 && Buffer.byteLength(value, 'utf8') <= 72
                ? true
                : 'Use a password between 12 and 72 UTF-8 bytes.',
        });
        const passwordConfirmation = await password({ message: 'Confirm admin password', mask: '*' });
        if (adminPassword !== passwordConfirmation) {
            throw new Error('Admin passwords did not match. Run setup again to finish the initial account setup.');
        }

        const passwordHash = await bcrypt.hash(adminPassword, 12);
        await databaseAdmin.query(
            'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
            [username, passwordHash]
        );
        return { createdAdmin: true, databaseCreated };
    } catch (error) {
        if (databaseCreated) {
            await databaseAdmin.end().catch(() => {});
            const cleanup = new Client(adminConfig);
            try {
                await cleanup.connect();
                await cleanup.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(databaseName)}`);
                await cleanup.query(`DROP ROLE IF EXISTS ${quoteIdentifier(appUser)}`);
            } catch {
                // Keep the original setup error; the database administrator can clean up if needed.
            } finally {
                await cleanup.end().catch(() => {});
            }
        }
        throw error;
    } finally {
        await databaseAdmin.end().catch(() => {});
    }
}

async function main() {
    await requireNewEnvironmentFile();
    console.log('This setup creates an application database role and preserves existing database objects.');

    const host = (await input({ message: 'PostgreSQL host', default: 'localhost' })).trim();
    const portText = await input({
        message: 'PostgreSQL port',
        default: '5432',
        validate: value => /^\d+$/.test(value) && Number(value) > 0 && Number(value) <= 65_535
            ? true
            : 'Enter a valid TCP port.',
    });
    const adminUser = validateIdentifier(
        (await input({ message: 'PostgreSQL administrator username', default: 'postgres' })).trim(),
        'Administrator username'
    );
    const adminPassword = await password({ message: 'PostgreSQL administrator password', mask: '*' });
    const databaseName = validateIdentifier(
        (await input({ message: 'Application database name', default: 'inventory_db' })).trim(),
        'Database name'
    );
    const appUser = validateIdentifier(
        (await input({ message: 'Application database role', default: 'inventory_app' })).trim(),
        'Application role'
    );

    const appPassword = randomBytes(48).toString('base64url');
    const jwtSecret = randomBytes(48).toString('base64url');
    const setup = await setupDatabase({
        host,
        port: Number(portText),
        adminUser,
        adminPassword,
        databaseName,
        appUser,
        appPassword,
    });

    const environment = [
        'PORT=3000',
        'HOST=127.0.0.1',
        `DB_HOST=${dotenvValue(host)}`,
        `DB_PORT=${portText}`,
        `DB_NAME=${dotenvValue(databaseName)}`,
        `DB_USER=${dotenvValue(appUser)}`,
        `DB_PASSWORD=${dotenvValue(appPassword)}`,
        `JWT_SECRET=${dotenvValue(jwtSecret)}`,
        'CORS_ORIGINS=http://localhost:5173',
        'COOKIE_SAME_SITE=strict',
        '',
    ].join('\n');

    await writeFile(environmentPath, environment, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
    if (process.platform !== 'win32') await chmod(environmentPath, 0o600);

    console.log(setup.createdAdmin
        ? 'Database and initial admin account are ready.'
        : 'Database role is ready. Existing admin accounts were preserved.');
    console.log('Run npm run dev to launch the API and web app.');
}

main().catch(error => {
    console.error(`Setup failed: ${error.message}`);
    process.exitCode = 1;
});
