## Administrator desktop dashboard

Admin accounts use the existing login page and automatically open `/admin`.
The responsive browser dashboard includes platform totals, paginated user and listing
management, and an order overview. Only authenticated, active administrators can use
the admin API. Admin registration is disabled publicly, and administrator accounts
are protected from dashboard deactivation.

To create an administrator, add these values to `backend/.env` alongside your existing
database configuration (keep credentials out of `frontend/.env`):

```dotenv
ADMIN_NAME=Platform Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-strong-password
```

The password must contain at least 12 characters. From `backend`, run
`npm run create-admin`, then `npm run dev`. The command creates a new account and
refuses to overwrite an existing email. Remove `ADMIN_PASSWORD` after setup.

From `frontend`, run `npm run web` and open the URL printed by Expo in your desktop
browser. Sign in with the administrator credentials. Ensure `EXPO_PUBLIC_API_URL`
points to the running backend (for local desktop use, `http://localhost:5001/api`).

Run backend access-control checks with `cd backend` followed by `npm test`.
