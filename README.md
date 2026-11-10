# wants

Write down what you want: a thing to buy, a goal to hit, a place to go. When you get it, take a photo as proof and it moves to your Got wall.

Built with Expo (SDK 58), Expo Router and TypeScript. Data stays on the device.

## Run it

```bash
bun install
bun start
```

Scan the QR code with Expo Go on Android or the Camera app on iOS.

## Checks

```bash
bun run lint
bun run typecheck
bunx expo-doctor
```

Add packages with `bunx expo install <package>` so versions match the SDK.

## Icon and splash

The mark is two tags: the outline you want, the filled one you got. It's defined in `scripts/render-brand.py`, which writes SVG sources to `assets/brand/` and the app icon, dark icon, Android adaptive and themed layers, splash and favicon PNGs to `assets/images/`.

```bash
python3 scripts/render-brand.py   # needs rsvg-convert (librsvg)
```

Icons and the splash screen only change in a native build, not in Expo Go.

## Status

Early rebuild. The previous Expo tutorial code has been removed.

## License

MIT
