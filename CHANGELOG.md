# Vanta.js changelog

## 0.5.24

* Update readme examples
* Remove gallery images from main branch

## 0.5.23

* Update `waves, dots, globe` to work with GeometryBuffer & latest three.js (@OmnesPotens, @DustinBrett)
* Update `birds` to work with three.js r134
* Fix animation speed bug
* Fix custom three in `halo`
* Bump three.js in examples to r134

## 0.5.22

* Fix hash function in `clouds`
* Update dependencies

## 0.5.21

* Fix readme on npmjs.com
* Fix `fog` on retina screens (@MaSchVam)

## 0.5.20

* Add Vue.js example in readme
* Add `resize` example in readme
* Remove `current` reference on destroy

## 0.5.19

* Fix `globe` color updating problem via `setOptions`
* Update fiddle to use newest three.js

## 0.5.18

* Upgrade three.js to r119
* Upgrade effects to work with newest three.js

## 0.5.17

* Fix custom THREE in `birds`
* Call `triggerMouseMove` on `setOptions`

## 0.5.16

* Add `gyroControls` option (@SrDonEmilio)
* Add default params for `triggerMouseMove`

## 0.5.15

* Add offset options for `halo`

## 0.5.14

* Fix readme encoding
* Add options for `halo`

## 0.5.13

* Fix missing camera issue for some effects

## 0.5.12

* Fix missing THREE for `dots` effect
* Add initial `halo` effect

## 0.5.11

* Fix resize issue for react

## 0.5.10

* Update readme for npm
* Added `showLines` option for `dots` effect

## 0.5.8

* Initial publish on npm
* Fixed wrong method name in readme

## 0.5.7

* Removed gallery code from `master` branch, added to new `gallery` branch
* Fixed an issue that prevented `birds` from being properly compiled in certain projects

## 0.5.6

* Added ability to disable mouse/touch controls
* Added ability to set custom scale

## 0.5.5

* Fixed an issue with default height/width when the parent container (`el` param) has zero height
* Fixed an issue with text nodes of `el`

## 0.5.4

* Added ability to use a custom `THREE` build
* Added example using `create-react-app`
* Fixed an error with p5 effects expecting a threejs renderer

## 0.5.3

* Fixed `VANTA undefined` error in `waves` effect
* Added `setOptions` method to allow changing options after init
* Added `speed` option for `clouds`

## 0.5.2

* Added `forceAnimate` option
* Added `globe` effect

## 0.5.1

* Allow touchscreen controls for effects
* Fixed an issue where Gatsby build fails due to `window` undefined

## 0.5.0

* Updated module code to allow static import
* Updated readme React example to use refs
* Fixed issue where sibling elements are overlaid on top of the animation element and mousemove fails to trigger, now using `window` mousemove event
* Added warning if THREE is missing on window
* Added this changelog

## 0.4.0

* Added mobile support for `birds` effect (alternative to GPGPU)
* Added bird size option for `birds` effect

## 0.3.0

* Removed backgroundColor "transparent" option, use backgroundAlpha instead

## 0.2.0

* Added p5 effects: `trunk`, `topology`
* Updated `dots` with a spherical effect

## 0.1.0

* First release
