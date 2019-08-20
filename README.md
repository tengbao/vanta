# Vanta JS

## [View gallery & customize effects at www.vantajs.com &rarr;](https://www.vantajs.com)

![alt text](https://www.vantajs.com/gallery/fb-share-image.jpg "Vanta JS")

3D animated backgrounds for your website. Select & customize an effect, and add it to your site with a few lines of code. Powered by [three.js](https://github.com/mrdoob/three.js/) or [p5.js](https://github.com/processing/p5.js).

## [View gallery & customize effects at www.vantajs.com &rarr;](https://www.vantajs.com)

## Basic usage:

```html
<script src="three.r92.min.js"></script>
<script src="vanta.waves.min.js"></script>
<script>
  VANTA.WAVES('#my-background')
</script>
```

[View fiddle &rarr;](https://jsfiddle.net/xb74q5h1/)

## More options:

```js
VANTA.WAVES({
  el: '#my-background', // element id or DOM object reference
  color: 0x000000,
  waveHeight: 20,
  shininess: 50,
  waveSpeed: 1.5,
  zoom: 0.75
})
```

Each effect has different parameters. Explore them all!

## Cleanup:

```js
var effect = VANTA.WAVES('#my-background')
effect.destroy() // e.g. call this in React's componentWillUnmount
```

## Usage In React:

You can import `vanta.xxxxx.min.js` as follows. (Make sure `three.js` or `p5.js` is also included.)

```js
  import * as THREE from './three.min.js'
  import BIRDS from './vanta.birds.min.js'

  class MyComponent extends React.Component {
    constructor() {
      super()
      this.myRef = React.createRef()
    }
    componentDidMount() {
      this.effect = BIRDS({
        el: this.myRef.current
      })
    }
    componentWillUnmount() {
      if (this.effect) this.effect.destroy()
    }
    render() {
      return <div ref={this.myRef}></div>
    }
  }
```

## Local Dev:

Clone the repo, run `npm install` and `npm run dev`, and go to localhost:8080.

## Credits

- Birds effect from https://threejs.org/examples/?q=birds#webgl_gpgpu_birds by @zz85
- Fog effect from https://thebookofshaders.com/13/ by @patriciogonzalezvivo
- Clouds effect from https://www.shadertoy.com/view/XslGRr by Inigo Quilez
- Clouds2 effect from https://www.shadertoy.com/view/lsBfDz by Rune Stubbe
- Trunk, Topology effects from http://generated.space/ by Kjetil Midtgarden Golid @kgolid
