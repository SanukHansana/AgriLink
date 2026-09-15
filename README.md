## Administrator desktop dashboard

### Create an admin directly in MongoDB

1. Register a normal buyer account in the app using the email and password you want
   for your administrator. Admin is never offered in public registration.
2. In MongoDB Compass or Atlas, open the same database configured by the backend's
   `MONGO_URI`, then the `users` collection. Find the account by its email and change
   `role` to `admin` and `isActive` to `true`. Keep `passwordHash` unchanged.
   Alternatively run this in `mongosh` after selecting that database:

   ```javascript
   db.users.updateOne(
     { email: "admin@example.com", role: "buyer" },
     { $set: { role: "admin", isActive: true, updatedAt: new Date() } }
   )
   ```

   Replace the email with your account email and confirm `modifiedCount` is `1`.
3. Sign out and log back in with that email and the original password. The app opens
   the admin dashboard. This creates an AgriLink admin, not a MongoDB database user.

### Agriculture officer verification

All new and existing agriculture officer accounts are blocked from officer features
unless `isVerified` is explicitly `true`. They can sign in to see the waiting screen
and check their approval status. In the admin dashboard, open **Users**, find the
officer and select **Verify officer**, then confirm. **Revoke verification** blocks
access again. The backend checks the current database status on every request;
officers cannot approve themselves or bypass the waiting screen through API calls.

### Optional direct database setup command

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
## Bidding and stock

Buyers submit a price per unit, quantity and delivery address. Future-harvest bids
also require a delivery date on or after harvest. The API enforces minimum price,
minimum quantity, remaining stock and the bidding deadline. Farmers must accept
before the deadline; expired offers are marked expired when bid lists are refreshed.

Accepting a bid creates a confirmed order at the bid price, links the bid to that
order and reserves stock in one MongoDB transaction. Repeated acceptance cannot
create another order. Direct and advance purchases reserve the same inventory.
Cancelling a new reserved order restores stock once. Old orders without a stock
reservation are not restocked. Old bids without delivery addresses must be
resubmitted before they can be accepted.

**Database requirement:** use MongoDB Atlas or a MongoDB replica set. Standalone
MongoDB servers do not support the multi-document transactions used here. No
unsafe nontransactional fallback is used. No payment is collected by accepting a bid.
