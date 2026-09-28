# Backend tests

Use Node.js 22.13 or newer. Install dependencies with `npm ci` in this directory.
The built-in Node test runner supports this backend's ES modules without a Jest
transform or extra dependencies.

```sh
npm test
npm run test:watch
npm run test:coverage
node --test tests/officer-moderation.test.js
```

The suite covers authentication and role checks, bidding, harvest and delivery
rules, driver recovery and location visibility, officer district/ownership rules,
moderation transaction session usage, notice scheduling, recipient batching and
retry behavior. Tests use isolated model doubles and local HTTP test servers.
They do not load `.env`, connect to MongoDB, or change application data.

Coverage reports identify code exercised by tests; they do not prove correctness.
Real MongoDB transactions, concurrent claims, GPS permissions and browser/device
flows still require integration testing. When adding a workflow, test the successful
result and rejected operations, including ownership and repeated submissions.
