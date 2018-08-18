# Vanta JS

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

## More options:

```js
VANTA.WAVES({
  el: '#my-background',
  color: 0x000000,
  waveHeight: 20,
  shininess: 50,
  waveSpeed: 1.5,
  zoom: 0.75
})
```

## Cleanup:

```js
var effect = VANTA.WAVES('#my-background')
effect.destroy() // e.g. call this in React's componentWillUnmount
```

## Credits

- Birds effect from https://threejs.org/examples/?q=birds#webgl_gpgpu_birds by @zz85
- Fog effect from https://thebookofshaders.com/13/ by @patriciogonzalezvivo
- Clouds effect from https://www.shadertoy.com/view/XslGRr by Inigo Quilez
- Clouds2 effect from https://www.shadertoy.com/view/lsBfDz by Rune Stubbe
- Trunk, Topology effects from http://generated.space/ by Kjetil Midtgarden Golid @kgolid
