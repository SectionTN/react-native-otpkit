# Contributing

Bug reports and pull requests are welcome. Read the [code of conduct](./CODE_OF_CONDUCT.md) before you take part.

## Set up the repository

The repository is a Yarn workspace: the library is in the root, and an Expo example app is in `example/`. Use the Node version in [`.nvmrc`](./.nvmrc), then install from the root:

```sh
yarn
```

Use Yarn for everything here. The workspace depends on it, and npm won't install it without changes.

## Run the example

The example app runs the library from source. JavaScript changes reload right away, and changes to the Kotlin module need a rebuild.

```sh
yarn example start
yarn example android
yarn example ios
yarn example web
```

`start` runs Metro. `android` and `ios` build the app and launch it, and the first run creates `example/android` and `example/ios` with `expo prebuild`. `web` opens the app in the browser.

To edit the native code in an IDE, open `example/android` in Android Studio, where the Kotlin sources are in the `react-native-otpkit` module. The library has no iOS native code.

To try SMS reading on an Android emulator, open the Sign in tab, tap Send code, then send the code from a terminal:

```sh
adb emu sms send 5551234 "Your code is 123456"
```

Tap Allow on the consent sheet to fill the field. The Retriever tab shows the app hash and the command that tests it.

## Check your change

```sh
yarn lint
yarn typecheck
yarn test
```

`yarn lint` runs Biome, and `yarn format` applies its fixes. `yarn test` runs the Vitest unit tests, and `yarn prepare` builds the package into `lib/`.

The Kotlin unit tests run from the prebuilt example:

```sh
cd example
npx expo prebuild --platform android
cd android
./gradlew :react-native-otpkit:testDebugUnitTest
```

## Run the end-to-end tests

The tests in `e2e/` install a release build of the example on a running emulator or simulator. `OTPKIT_APP_PATH` points them at that build.

On Android, the build script targets arm64 emulators, such as the ones on Apple silicon Macs:

```sh
yarn e2e:android:build
OTPKIT_APP_PATH=example/android/app/build/outputs/apk/release/app-release.apk yarn e2e --target android
```

The SMS tests send messages with `adb emu sms send`, so they run only on an emulator. Turn off the emulator's animations before a run, as CI does:

```sh
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0
```

On iOS, boot the simulator without a window, for example with `xcrun simctl boot "iPhone 17"`. Simulator, or Device Hub in Xcode 27, copies the Mac pasteboard into the simulator it shows, and the paste test then fails. Build the test runner once, then the app:

```sh
npx agent-device prepare ios-runner --platform ios --timeout 900000
yarn e2e:ios:build
OTPKIT_APP_PATH=example/ios/build/Build/Products/Release-iphonesimulator/OTPKitExample.app yarn e2e --target ios
```

After a simulator reboot, and when you're done, stop the device daemon with `npx agent-device daemon stop`.

With more than one device running, set `E2E_ANDROID_DEVICE` to the emulator's adb serial, such as `emulator-5554`, or `E2E_IOS_DEVICE` to the simulator's UDID.

On the web, install the browsers once, then export the example and run it in Chromium and WebKit:

```sh
npx playwright-core install chromium webkit
yarn e2e:web:build
yarn e2e --target web
yarn e2e --target web-webkit
```

CI runs all of these, plus a package build, on every push and pull request to `main`. When a change touches `android/`, `src/` or `package.json`, another workflow also builds the packed library into a new app on the lowest React Native the peer range allows and on the latest.

## Commit messages

Commits follow [Conventional Commits](https://www.conventionalcommits.org/en), with types such as `feat:`, `fix:`, `docs:`, `test:`, `ci:` and `chore:`. Lefthook runs Biome on your staged files and the type check before each commit, and commitlint checks the message. If the hooks don't run, install them with `yarn lefthook install`.

## Open a pull request

Keep each pull request to one change, and make sure the checks pass. If you change the public API, update the README and `skills/react-native-otpkit/SKILL.md` in the same pull request. For API changes and bigger rewrites, open an issue first to agree on the approach before you write code.

## Releases

The maintainer runs `yarn release`. release-it bumps the version, tags it `v<version>` and creates a GitHub release with notes from the commit messages. The tag starts the Publish workflow, which builds the package and stages it on npm with provenance. The version goes live once the maintainer approves it under Staged Packages on npmjs.com, with 2FA.
