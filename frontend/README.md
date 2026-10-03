# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Expo SDK upgrades

Use Node.js 22.13 or newer for SDK 57. Run upgrade commands from this `frontend` directory, with Metro stopped:

```bash
npx expo install 'expo@^57.0.24' --fix
npx expo-doctor
npx tsc --noEmit
npm run lint
npx expo export --platform all
npx expo start --clear
```

Changing only the `expo` version is insufficient: React, React Native, Expo Router, and native modules need matching versions. Commit both `package.json` and `package-lock.json`. Follow the [Expo upgrade guide](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/) and check each intervening SDK's release notes when upgrading across multiple versions.

The SDK 54 to 57 migration also requires application changes:

- Import navigation themes from `expo-router/react-navigation` instead of `@react-navigation/native`.
- Use `NativeTabs.Trigger.Icon` and `NativeTabs.Trigger.Label` for native tab icons and labels.
- Replace the removed `StyleSheet.absoluteFillObject` with `StyleSheet.absoluteFill`, and handle the new `unspecified` color scheme as the light theme.
- Adapt synchronous state updates in effects to derived defaults or guarded form resets, as required by the updated React Hooks lint rules.

Use an Expo Go release compatible with SDK 57, or rebuild your development client after upgrading. SDK 57 supports iOS 16.4 and newer. Local native builds require Xcode 26.4 or newer. When building with Xcode 27, SDK 57 additionally needs the `expo-build-properties` scene-support configuration described in [Expo's iOS scene lifecycle guide](https://github.com/expo/fyi/blob/main/ios-scene-lifecycle.md#staying-on-sdk-57-with-xcode-27); this applies to building your own iOS binary, not running JavaScript in Expo Go.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
