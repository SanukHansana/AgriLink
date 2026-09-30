# Frontend tests

Use Node.js 22.13 or newer and install dependencies using `npm ci` in this directory.
Component tests use Jest, the matching Expo preset and React Native Testing Library,
following [Expo's testing setup](https://docs.expo.dev/develop/unit-testing/).

```sh
npm test
npm run test:unit
npm run test:offline
npm run test:watch
npm run test:coverage
npm run test:unit -- tests/bid-actions.test.tsx
npm run lint
npx tsc --noEmit
```

`npm test` runs both the component suite and the existing Node offline-driver suite.
The component tests render real components and exercise user interactions. They
cover advisory loading/empty/error states and retry, safe document opening and
failures, bid edits and counter-offer acceptance, failed API requests, and hidden
actions for closed bids. API and native link handlers are mocked: tests do not
connect to your backend or open a browser. Test files live outside Expo routes.

Coverage output is saved in `coverage/`; open `coverage/lcov-report/index.html`
for the HTML report. Coverage includes untested shared components so missing
coverage remains visible. These component tests do not replace full browser/device
tests of navigation, authentication, layouts, location permissions or live APIs.
