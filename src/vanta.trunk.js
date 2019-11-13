// Original effect by Kjetil Midtgarden Golid
// https://github.com/kgolid/p5ycho/blob/master/trunk/sketch.js

import P5Base, {VANTA} from './_p5Base.js'
import {color2Hex, mobileCheck} from './helpers.js'

let p5 = (typeof window == 'object') && window.p5

class Effect extends P5Base {
  static initClass() {
    this.prototype.p5 = true
    this.prototype.defaultOptions = {
      color: 0x98465f,
      backgroundColor: 0x222426,
      spacing: 0,
      chaos: 1,
      // speed: 1,
    }
  }
  constructor(userOptions) {
    p5 = userOptions.p5 || p5
    super(userOptions)
  }
  onInit() {
    const t = this
    let sketch = function(p) {
      let rings = mobileCheck() ? 35 : 55
      let dim_init = 50
      let dim_delta = 4

      let chaos_init = .2
      let chaos_delta = 0.12
      let chaos_mag = 20

      let ox = p.random(10000)
      let oy = p.random(10000)
      let oz = p.random(10000)

      p.setup = function(){
        t.initP5(p) // sets bg too
        p.strokeWeight(1)
        p.stroke(color2Hex(t.options.color))
        p.smooth()
        p.noFill()
        //p.noLoop()
      }

      p.draw = function() {
        p.clear()
        p.translate(p.width / 2, p.height / 2)
        display()
      }

      function display(){
        //ox+=0.04
        oy-=0.02
        oz+=0.00005
        for(let i = 0; i < rings; i ++){
          p.beginShape()
          for(let angle = 0; angle < 360; angle++){
            let radian = p.radians(angle)
            let radius = (t.options.chaos * chaos_mag * getNoiseWithTime(radian, chaos_delta * i + chaos_init, oz))
              + (dim_delta * i + dim_init)
              + (i * t.options.spacing || 0)
            p.vertex(radius * p.cos(radian), radius * p.sin(radian))
          }
          p.endShape(p.CLOSE)
        }
      }

      // function getNoise (radian, dim){
      //   let r = radian % p.TWO_PI;
      //   if(r < 0.0){r += p.TWO_PI;}
      //   return p.noise(ox + p.cos(r) * dim, oy + p.sin(r) * dim);
      // }

      function getNoiseWithTime (radian, dim, time){
        let r = radian % p.TWO_PI;
        if(r < 0.0){r += p.TWO_PI;}
        return p.noise(ox + p.cos(r) * dim , oy + p.sin(r) * dim, oz + time);
      }
    }
    this.p5 = new p5(sketch)
  }
}
Effect.initClass()
export default VANTA.register('TRUNK', Effect)