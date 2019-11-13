import VantaBase from './_base.js'
import {color2Hex} from './helpers.js'
export {VANTA} from './_base.js'
let p5 = (typeof window == 'object') && window.p5

export default class P5Base extends VantaBase {
  constructor(userOptions) {
    p5 = userOptions.p5 || p5
    super(userOptions)
    this.mode = 'p5'
  }
  initP5 (p) {
    const t = this
    const renderer = p.createCanvas(t.width, t.height)
    renderer.parent(t.el) // put the renderer's canvas under el
    t.applyCanvasStyles(p.canvas, {
      background: color2Hex(t.options.backgroundColor)
    })
    // p.background(color2Hex(t.options.backgroundColor))
    t.p5renderer = renderer
    t.p5canvas = p.canvas
    t.p5 = p
  }
  restart(){
    if (this.p5 && typeof this.p5 == 'object') {
      this.p5.remove()
    }
    super.restart()
  }
  destroy(){
    if (this.p5 && typeof this.p5 == 'object') {
      this.p5.remove()
    }
    super.destroy()
  }
  resize(){
    super.resize()
    if (this.p5 && this.p5.resizeCanvas) {
      this.p5.resizeCanvas(this.width, this.height)
    }
  }
}