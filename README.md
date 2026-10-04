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
until synchronized. Login sessions stay in memory during app use. Reopening/reloading the app requires
a fresh login. Temporary backgrounding, photo selection and permission dialogs
keep the current session active; tokens are not stored in the offline queue.
Logout also stops driver background location sharing.

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

## Buyer subscriptions and outbid alerts

Buyer Home → Outbid alerts opens a mock subscription interface. Activation grants
30 days of alerts without charging money; repeated activation keeps the existing
expiry, cancellation stops eligibility immediately, and there is no automatic
renewal. Dates and entitlement are controlled by the backend.

New bids and price increases notify subscribed, active buyers with lower active
bids on the same listing and unit. Equal prices, own bids, withdrawn/closed bids
and expired subscriptions do not qualify. Farmer counter-offers are separate from
competing buyer prices. Alerts are deduplicated per triggering bid revision.
Notifications appear through the existing app inbox and its 15-second foreground
polling. Delivery is best effort; this version does not send background push alerts.

No API keys are needed for the mock flow. It is automatically disabled when
`NODE_ENV=production`; set `MOCK_SUBSCRIPTIONS_ENABLED=false` to disable activation
in development too. Real Stripe payments are not implemented: they require a
server-side secret key, subscription price and verified webhook configuration.
Never put a Stripe secret key in `frontend/.env` or commit it. Expo background push
would additionally need push-token registration, notification permissions, native
push credentials and a development/production build.

Run `npm test` in backend and frontend for subscription and notification tests.
Restart both servers after updating. Test actual bid competition with two buyer
accounts against your development MongoDB before deploying.


## Manual map pins and driver directions

Pickup and buyer delivery forms offer **Choose location on map** alongside
**Use current location**. A small map previews the selected pin; coordinate rows
are hidden from users. Pan/zoom, tap or drag the pin, then
confirm **Use selected location**. Cancelling preserves the existing location.
Choosing a map pin does not replace the written address or request GPS permission.

The map uses Leaflet 1.9.4 from unpkg with attributed OpenStreetMap tiles and needs
internet access. No map API key is required for this implementation. It does not
provide address search, reverse geocoding or offline tile downloads. Maps are
embedded in a WebView on native and a sandboxed frame on web. Rebuild custom native
apps after adding react-native-webview.

Driver Active Delivery → **Open pickup & drop-off in Google Maps** fetches the
remaining ordered stops and opens Maps in one tap. Mobile routes open up to four
stops at a time; confirm completed stops in AgriLink and reopen for the next segment.
Maps may require tapping Start, and falls back to a browser when its app is unavailable.
Opening navigation does not change AgriLink delivery status or confirm stops.

Map pins are also available on Add/Edit Product, Add/Edit Wanted Item, Farmer
Profile and Buyer Profile. The backend stores and validates coordinate pairs on
products, Wanted locations and saved profile addresses. Older records remain
valid without pins; open them and save a location to add coordinates.

New products reuse the saved farm location. Pickup requests can reuse the saved
farm pin or explicitly use a common pickup location from the selected products.
Checkout, bids and Wanted forms offer **Use my saved delivery location**. A custom
location overrides the saved one. Written addresses remain necessary for delivery
details; choosing a pin does not reverse-geocode an address. Existing orders and
delivery jobs retain their recorded locations when profile pins change.

Restart the backend and Expo after updating the location schemas.

### Accepted orders, demo payment and delivery

Buyers place an order, then wait for the farmer to confirm it. In **Buyer → Orders**, use **Pay for order (demo)** with `4242 4242 4242 4242`, a future `MM/YY`, and any three-digit code. The backend records a mock payment; no money moves and no card number or security code is sent or stored. Preparation, pickup creation and driver acceptance require a paid order. Production demos can enable simulated order payments and buyer subscriptions with `SIMULATED_PAYMENTS_ENABLED=true`, while keeping `NODE_ENV=production`. Without that explicit flag, production simulation is disabled. `MOCK_PAYMENTS_ENABLED=false` and `MOCK_SUBSCRIPTIONS_ENABLED=false` individually disable those features even when simulation is enabled. Real billing is not implemented.

After payment, the farmer starts preparing and uses **Ready for Driver Pickup** to select paid orders, set the farm pickup location, cargo weight, driver payout and pickup time. Publishing the pickup atomically marks its orders **dispatched** and makes the delivery job available to drivers. Driver acceptance unlocks the existing Google Maps route with pickup before drop-off. After the driver confirms every pickup, either the driver starts transit or the farmer uses **Mark out for delivery**; both update the same delivery job and orders. After the driver records delivery, the buyer can **Confirm received**, which stores a separate receipt timestamp and notifies the farmer.

Outbid alerts are saved to the inbox and sent to registered phones. Phone push delivery requires the native build and credentials described below.

### Phone push notifications

The app now registers Expo push tokens from **Notifications → Enable phone notifications**. Granted permissions are registered again on login. The backend sends newly created inbox notifications through Expo Push Service, including subscriber-only outbid alerts. Logout unregisters the device; switching accounts reassigns its unique token. Push taps open the inbox after signing in. The inbox remains available when push fails. Delivery is best effort: failed network sends are logged without retry; receipt checks run after 15 minutes while the API process remains running.

To enable actual phone delivery:

1. In `frontend`, run `npx eas-cli@latest login`, then `npx eas-cli@latest init` and `npx eas-cli@latest build:configure` to link an EAS project and create build configuration. Choose your own Android application ID and iOS bundle identifier when prompted.
2. Configure Android Firebase FCM v1 credentials in EAS and set `expo.android.googleServicesFile` to your downloaded `google-services.json` path. For iOS, configure APNs credentials through EAS; an Apple Developer account is required. See https://docs.expo.dev/push-notifications/push-notifications-setup/ . Do not put service account private keys into frontend environment variables or source control.
3. Build/install a preview app with `npx eas-cli@latest build --platform android --profile preview` (or use iOS). A development profile also needs `npx expo install expo-dev-client`, followed by `npx eas-cli@latest build --platform android --profile development` and `npx expo start --dev-client`.
4. Run the backend, sign in on the phone, open Notifications and enable phone notifications. For an outbid test, subscribe buyer A and place a bid, background their app, then have buyer B place a higher bid for the same listing and unit. Buyer A should receive a phone alert and an inbox entry. Non-subscribers should not receive outbid alerts.

Expo Go and the browser use the in-app inbox. Remote push requires the configured native build. `EXPO_ACCESS_TOKEN` is optional on the backend and required if you enable enhanced push security in Expo; never expose it as an `EXPO_PUBLIC_*` variable. No credentials or EAS project IDs are invented by this implementation. Actual device delivery cannot be verified until those credentials are configured.

### English, Sinhala and Tamil interface

Use the compact **EN / SI / TA** dropdown immediately to the left of the notification bell, or the **Language Preferences** setting in any role’s profile. Login also has a compact dropdown. The setting applies across account roles, forms, action buttons, navigation tabs, calendar controls and system inbox alerts, and is saved on the device. Switching language preserves input values and stored order/profile data. Language changes preserve the existing screen styles and font sizes. Names, addresses and user-authored content stay as entered; Google Maps and other external apps use their own language settings.

`frontend/src/i18n/translations.ts` contains the bilingual UI phrase catalog. Shared controls in `frontend/src/i18n/native.tsx` render those phrases and accessibility labels; `language.ts` stores the selection and handles system notification templates. Unknown strings fall back to English instead of becoming blank. New screens should use these shared controls and add new phrases to the catalog. Native-speaker review is recommended before release, especially for agricultural terminology and longer instructions.

Registered push devices store the selected language. Outbid and core order/payment phone alerts use that language after the device registers it; push credentials and a native build are still required. Other system or user-written messages can fall back to their original text. Restart the backend after this update to enable the push-language fields.

### Simulated payments on Railway

Set these backend Railway Variables and redeploy:

```env
NODE_ENV=production
SIMULATED_PAYMENTS_ENABLED=true
MOCK_PAYMENTS_ENABLED=true
MOCK_SUBSCRIPTIONS_ENABLED=true
```

This enables the existing demo-card checkout for orders and subscriptions in the installed APK. No real card is charged; only demo payment status and subscription entitlement are stored. Demo checkout remains visibly labeled, and full card numbers/security codes are never stored or sent to the backend. To disable production simulation, remove `SIMULATED_PAYMENTS_ENABLED` or set it to `false`.
