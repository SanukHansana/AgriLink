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
before the deadline for manual acceptance; expired offers are marked expired when bid lists are refreshed.

Accepting a bid creates a confirmed order at the bid price, links the bid to that
order and reserves stock in one MongoDB transaction. Repeated acceptance cannot
create another order. Direct and advance purchases reserve the same inventory.
Cancelling a new reserved order restores stock once. Old orders without a stock
reservation are not restocked. Old bids without delivery addresses must be
resubmitted before they can be accepted.

**Database requirement:** use MongoDB Atlas or a MongoDB replica set. Standalone
MongoDB servers do not support the multi-document transactions used here. No
unsafe nontransactional fallback is used. No payment is collected by accepting a bid.

### Farmer, buyer and driver workflow updates

- **Harvest readiness and delays:** open Farmer → Future Harvests to mark a harvest
  ready or report a revised date and reason. Existing order buyers receive an in-app
  notification. Cancel unassigned pickup jobs before delaying a scheduled harvest.
  Buyers can change the requested delivery date from Order Tracking before pickup
  is booked, to agree a date after the revised harvest date.
- **Pickup and shared delivery:** from the farmer home, open Pickup & Delivery.
  Select preparing/dispatched orders, choose the farm address or a different pickup
  address, and provide weight, payout and time. Multiple orders become one shared
  job with drop-offs grouped by buyer and address. The API claims orders in a
  transaction, rejects duplicate/legacy bookings and requires future harvests to be
  ready. Pickup must be in the future, after harvest and by the requested delivery
  day. Unassigned jobs can be cancelled to release their order claims.
- **Bid negotiation:** buyers can edit or withdraw active offers; farmers can send
  counter-offers. Only the bid owner can accept a counter-offer, which creates an
  order at the counter price. Open Farmer → Bids & Auctions to optionally enable
  automatic highest-bid acceptance on an open listing. The backend worker runs
  every 30 seconds and on startup; it accepts one valid active bid at closing,
  ranked by price per unit, then earliest creation time. Bids exceeding stock or
  missing delivery details are skipped. Remaining bids expire. Automatic selection
  is disabled by default and requires the backend process to stay running.
- **Notifications:** use the Notifications button to see new orders/bids,
  counter-offers, bid acceptance/rejection, harvest changes and driver assignment.
  These are in-app notifications, polled every 15 seconds, not email/SMS or OS push.
- **Map pins and location sharing:** buyer delivery forms and farmer pickup forms
  accept optional latitude/longitude pairs or the device's current location. Drivers
  can open each pickup/drop-off in Google Maps and confirm individual stops. Every
  pickup must be confirmed before transit and every drop-off before trip completion.
  Drivers may opt in to Share live location on Active Delivery; it stops when leaving
  the screen/app, and only the related farmer/buyers can view it. Only the latest
  position is stored; readings older than two minutes are hidden. Tracking polls
  every 15 seconds. This is foreground sharing, not background GPS tracking.

Restart the backend and Expo after updating. Custom native builds need rebuilding
for the new `expo-location` module; browser location permission requires localhost
or HTTPS. Addresses still work when location permission is denied.

Validation: `npm test` in backend, `npm run lint` and `npx tsc --noEmit` in frontend.
Model/controller tests cover rules and ownership with database doubles; they do not
replace a live MongoDB transaction/concurrency test or device GPS check.

## Driver recovery and reliability

Drivers can cancel acceptance before collecting cargo, or pause a trip and request
administrator reassignment. Admin → Driver operations reviews issues, confirms cargo
handover before releasing a trip for another driver, and records payments that have
already been made. Licence expiry is checked using the Sri Lankan date. Vehicles
cannot be edited while assigned to an active or paused trip.

Each drop-off now records photo evidence and recipient confirmation. Failed or partial
deliveries require a reason and delivered quantities; undelivered goods must be returned
with farmer confirmation before closing the trip with issues. Only returned stock is
restored, once. Trips completed with issues hold the driver payout for administrator
review. Paid/unpaid/held totals are separate; recording payment does not transfer money.

Route suggestions use saved coordinates and straight-line nearest-neighbour ordering,
with pickups before drop-offs. Google Maps provides driving directions, road distance
and ETA for the next route segment. This is not an integrated traffic/routing API.

Driver data is cached for 48 hours. Stop, return and status updates can be queued offline
and replayed in order under the same account with stable operation IDs. Server conflicts
remain in Review & sync updates until reviewed, retried or discarded. Cancellation,
reassignment and payments require connectivity. Pending updates are not server-confirmed
until synchronized. Login sessions are saved in native SecureStore or browser session
storage; tokens are not stored in the offline queue.

Background GPS is a separate driver opt-in for an active trip, stops on logout, trip
completion/reassignment, or after 12 hours, and has a persistent Android notification.
Use a native development/production build with the new location permissions; Expo Go
and browsers support foreground sharing. OS restrictions can stop tracking when the app
is killed. Open the app to resume and check sharing status. No location history is stored.

Restart backend and Expo. Rebuild native apps for the new modules/permissions. Run
`npm test` in both backend and frontend for workflow and offline-queue checks.

## Agriculture officer workflows

Administrators must verify each officer and assign a service district in Admin →
Users, including existing verified accounts. Officers handle assistance requests
and reported listings within that district. Claiming a case locks it to the officer;
Admin → Officer case assignments can reassign open cases to another verified
officer in the same district. Internal review notes remain hidden from farmers.

Farmers need a saved farm profile before submitting Agriculture Assistance requests.
They can attach document links, read replies, edit pending/revision requests and
withdraw pending requests. Officers can schedule, reschedule or cancel field visits,
record findings, arrange follow-up visits and close completed cases.

Agriculture Updates shows farmers published notices, quality guidelines and surplus
advice. Assistance replies and visit changes send in-app notifications. Notices can
be scheduled and given an expiry using ISO dates with a timezone offset, for example
`2026-10-18T09:30:00+05:30`. The backend notice worker runs every 30 seconds while
the server is running, publishes due notices and sends district-targeted alerts with
deduplicated retries. Expired notices disappear from farmer views immediately.

Officer reports count delivered trades and keep quantities separated by unit.
Restart the backend and Expo after updating. Automated checks cover access policies,
date validation, analytics grouping and existing workflows; live MongoDB concurrency
and on-device/browser interaction still need integration testing.
