# Password recovery

## Recover a local account

From the project root, run:

```sh
npm run reset-password
```

The command reads the database connection from `backend/.env`, lists existing account names, and prompts for a replacement password without displaying it. It changes only the selected account's bcrypt password hash. If the database has no accounts, it creates the initial admin account. It does not reset or delete inventory data. Existing sessions remain valid until they expire, within one hour. To revoke all sessions immediately, replace `JWT_SECRET` in `backend/.env` with a fresh random value and restart the API.

If `backend/.env` is missing, restore it from a secure backup or configure it manually from `backend/.env.example` with the existing database connection. `npm run setup` is for initial setup and will not overwrite an existing environment file. If the command cannot connect, confirm PostgreSQL is running and that the database settings in `backend/.env` are current.

## Self-service reset groundwork

The app currently has no verified email address for each account and no email delivery provider, so a public “forgot password” flow cannot securely prove account ownership yet. A future implementation should:

1. Add and verify an email address for each account.
2. Generate a cryptographically random, short-lived, single-use reset token and store only its hash.
3. Rate limit requests and return the same response whether an account exists or not.
4. Send the link through a configured mail provider, then atomically consume the token while updating the bcrypt hash.
5. Invalidate that account's existing sessions after a successful reset.

Until those pieces are configured, the sign-in page points local users to the database-backed recovery command instead of offering an email flow that cannot complete.
