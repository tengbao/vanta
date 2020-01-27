import {extend, mobileCheck, q, color2Hex} from './helpers.js'
// const DEBUGMODE = window.location.toString().indexOf('VANTADEBUG') !== -1

const win = typeof window == 'object'
let THREE = (win && window.THREE) || {}
if (win && !window.VANTA) window.VANTA = {}
const VANTA = (win && window.VANTA) || {}
VANTA.register = (name, Effect) => {
  return VANTA[name] = (opts) => new Effect(opts)
}
VANTA.version = '0.5.11'

export {VANTA}

// const ORBITCONTROLS = {
//   enableZoom: false,
//   userPanSpeed: 3,
//   userRotateSpeed: 2.0,
//   maxPolarAngle: Math.PI * 0.8, // (pi/2 is pure horizontal)
//   mouseButtons: {
//     ORBIT: THREE.MOUSE.LEFT,
//     ZOOM: null,
//     PAN: null
//   }
// }
// if (DEBUGMODE) {
//   extend(ORBITCONTROLS, {
//     enableZoom: true,
//     zoomSpeed: 4,
//     minDistance: 100,
//     maxDistance: 4500
//   })
// }

// Namespace for errors
const error = function() {
  Array.prototype.unshift.call(arguments, '[VANTA]')
  return console.error.apply(this, arguments)
}

VANTA.VantaBase = class VantaBase {
  constructor(userOptions = {}) {
    if (!win) return false
    VANTA.current = this
    this.windowMouseMoveWrapper = this.windowMouseMoveWrapper.bind(this)
    this.windowTouchWrapper = this.windowTouchWrapper.bind(this)
    this.resize = this.resize.bind(this)
    this.animationLoop = this.animationLoop.bind(this)
    this.restart = this.restart.bind(this)

    const defaultOptions = (typeof this.getDefaultOptions === 'function') ? this.getDefaultOptions() : this.defaultOptions
    this.options = extend({
      mouseControls: true,
      touchControls: true,
      minHeight: 200,
      minWidth: 200,
      scale: 1,
      scaleMobile: 1,
    }, defaultOptions)

    if (userOptions instanceof HTMLElement || typeof userOptions === 'string') {
      userOptions = {el: userOptions}
    }
    extend(this.options, userOptions)

    if (this.options.THREE) {
      THREE = this.options.THREE // Optionally use a custom build of three.js
    }

    // Set element
    this.el = this.options.el
    if (this.el == null) {
      error("Instance needs \"el\" param!")
    } else if (!(this.options.el instanceof HTMLElement)) {
      const selector = this.el
      this.el = q(selector)
      if (!this.el) {
        error("Cannot find element", selector)
        return
      }
    }

    this.prepareEl()
    this.initThree()
    this.setSize() // Init needs size

    try {
      this.init()
    } catch (e) {
      // FALLBACK - just use color
      error('Init error', e)
      if (this.renderer && this.renderer.domElement) {
        this.el.removeChild(this.renderer.domElement)
      }
      if (this.options.backgroundColor) {
        console.log('[VANTA] Falling back to backgroundColor')
        this.el.style.background = color2Hex(this.options.backgroundColor)
      }
      return
    }

    const ad = window.addEventListener
    ad('resize', this.resize)
    window.requestAnimationFrame(this.resize) // Force a resize after the first frame

    this.resize()
    this.animationLoop()

    // Add event listeners on window, because this element may be below other elements, which would block the element's own mousemove event
    if (this.options.mouseControls) {
      ad('scroll', this.windowMouseMoveWrapper)
      ad('mousemove', this.windowMouseMoveWrapper)
    }
    if (this.options.touchControls) {
      ad('touchstart', this.windowTouchWrapper)
      ad('touchmove', this.windowTouchWrapper)
    }
  }

  setOptions(userOptions={}){
    extend(this.options, userOptions)
  }

  prepareEl() {
    let i, child
    // wrapInner for text nodes
    if (typeof Node !== 'undefined' && Node.TEXT_NODE) {
      for (i = 0; i < this.el.childNodes.length; i++) {
        const n = this.el.childNodes[i]
        if (n.nodeType === Node.TEXT_NODE) {
          const s = document.createElement('span')
          s.textContent = n.textContent
          n.parentElement.insertBefore(s, n)
          n.remove()
        }
      }
    }
    // Set foreground elements
    for (i = 0; i < this.el.children.length; i++) {
      child = this.el.children[i]
      if (getComputedStyle(child).position === 'static') {
        child.style.position = 'relative'
      }
      if (getComputedStyle(child).zIndex === 'auto') {
        child.style.zIndex = 1
      }
    }
    // Set canvas and container style
    if (getComputedStyle(this.el).position === 'static') {
      this.el.style.position = 'relative'
    }
  }

  applyCanvasStyles(canvasEl, opts={}){
    extend(canvasEl.style, {
      position: 'absolute',
      zIndex: 0,
      top: 0,
      left: 0,
      background: ''
    })
    extend(canvasEl.style, opts)
    canvasEl.classList.add('vanta-canvas')
  }

  initThree() {
    if (!THREE.WebGLRenderer) {
      console.warn("[VANTA] No THREE defined on window")
      return
    }
    // Set renderer
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    })
    this.el.appendChild(this.renderer.domElement)
    this.applyCanvasStyles(this.renderer.domElement)
    if (isNaN(this.options.backgroundAlpha)) {
      this.options.backgroundAlpha = 1
    }

    this.scene = new THREE.Scene()
  }

  getCanvasElement() {
    if (this.renderer) {
      return this.renderer.domElement
    }
    if (this.p5renderer) {
      return this.p5renderer.canvas
    }
  }

  windowMouseMoveWrapper(e){
    const canvas = this.getCanvasElement()
    if (!canvas) return false
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    if (x>=0 && y>=0 && x<=rect.width && y<=rect.height) {
      this.mouseX = x
      this.mouseY = y
      if (!this.options.mouseEase) this.triggerMouseMove(x, y)
    }
  }
  windowTouchWrapper(e){
    if (e.touches.length === 1) {
      const canvas = this.getCanvasElement()
      if (!canvas) return false
      const rect = canvas.getBoundingClientRect()
      const x = e.touches[0].clientX - rect.left
      const y = e.touches[0].clientY - rect.top
      if (x>=0 && y>=0 && x<=rect.width && y<=rect.height) {
        this.mouseX = x
        this.mouseY = y
        if (!this.options.mouseEase) this.triggerMouseMove(x, y)
      }
    }
  }

  triggerMouseMove(x, y) {
    if (this.uniforms) {
      this.uniforms.iMouse.value.x = x / this.scale // pixel values
      this.uniforms.iMouse.value.y = y / this.scale // pixel values
    }
    const xNorm = x / this.width // 0 to 1
    const yNorm = y / this.height // 0 to 1
    typeof this.onMouseMove === "function" ? this.onMouseMove(xNorm, yNorm) : void 0
  }

  setSize() {
    this.scale || (this.scale = 1)
    if (mobileCheck() && this.options.scaleMobile) {
      this.scale = this.options.scaleMobile
    } else if (this.options.scale) {
      this.scale = this.options.scale
    }
    this.width = Math.max(this.el.offsetWidth, this.options.minWidth)
    this.height = Math.max(this.el.offsetHeight, this.options.minHeight)

    // Init mouseX and mouseY
    if ((!this.mouseX && !this.mouseY) ||
      (this.mouseX === this.options.minWidth/2 && this.mouseY === this.options.minHeight/2)) {
      this.mouseX = this.width/2
      this.mouseY = this.height/2
      this.triggerMouseMove(this.mouseX, this.mouseY)
    }
  }

  resize() {
    this.setSize()
    if (this.camera) {
      this.camera.aspect = this.width / this.height
      if (typeof this.camera.updateProjectionMatrix === "function") {
        this.camera.updateProjectionMatrix()
      }
    }
    if (this.renderer) {
      this.renderer.setSize(this.width, this.height)
      this.renderer.setPixelRatio(window.devicePixelRatio / this.scale)
    }
    typeof this.onResize === "function" ? this.onResize() : void 0
  }

  isOnScreen() {
    const elHeight = this.el.offsetHeight
    const elRect = this.el.getBoundingClientRect()
    const scrollTop = (window.pageYOffset ||
      (document.documentElement || document.body.parentNode || document.body).scrollTop
    )
    const offsetTop = elRect.top + scrollTop
    const minScrollTop = offsetTop - window.innerHeight
    const maxScrollTop = offsetTop + elHeight
    return minScrollTop <= scrollTop && scrollTop <= maxScrollTop
  }

  animationLoop() {
    // Step time
    this.t || (this.t = 0)
    this.t += 1
    // Uniform time
    this.t2 || (this.t2 = 0)
    this.t2 += (this.options.speed || 1)
    if (this.uniforms) {
      this.uniforms.iTime.value = this.t2 * 0.016667 // u_time is in seconds
    }

    if (this.options.mouseEase) {
      this.mouseEaseX = this.mouseEaseX || this.mouseX || 0
      this.mouseEaseY = this.mouseEaseY || this.mouseY || 0
      if (Math.abs(this.mouseEaseX-this.mouseX) + Math.abs(this.mouseEaseY-this.mouseY) > 0.1) {
        this.mouseEaseX += (this.mouseX - this.mouseEaseX) * 0.05
        this.mouseEaseY += (this.mouseY - this.mouseEaseY) * 0.05
        this.triggerMouseMove(this.mouseEaseX, this.mouseEaseY)
      }
    }

    // Only animate if element is within view
    if (this.isOnScreen() || this.options.forceAnimate) {
      if (typeof this.onUpdate === "function") {
        this.onUpdate()
      }
      if (this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera)
        this.renderer.setClearColor(this.options.backgroundColor, this.options.backgroundAlpha)
      }
      // if (this.stats) this.stats.update()
      // if (this.renderStats) this.renderStats.update(this.renderer)
      // if (this.fps && this.fps.update) this.fps.update()
      // if (typeof this.afterRender === "function") this.afterRender()
    }
    return this.req = window.requestAnimationFrame(this.animationLoop)
  }

  // setupControls() {
  //   if (DEBUGMODE && THREE.OrbitControls) {
  //     this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement)
  //     extend(this.controls, ORBITCONTROLS)
  //     return this.scene.add(new THREE.AxisHelper(100))
  //   }
  // }

  restart() {
    // Restart the effect without destroying the renderer
    if (this.scene) {
      while (this.scene.children.length) {
        this.scene.remove(this.scene.children[0])
      }
    }
    if (typeof this.onRestart === "function") {
      this.onRestart()
    }
    this.init()
  }

  init() {
    if (typeof this.onInit === "function") {
      this.onInit()
    }
    // this.setupControls()
  }

  destroy() {
    if (typeof this.onDestroy === "function") {
      this.onDestroy()
    }
    const rm = window.removeEventListener
    rm('touchstart', this.windowTouchWrapper)
    rm('touchmove', this.windowTouchWrapper)
    rm('scroll', this.windowMouseMoveWrapper)
    rm('mousemove', this.windowMouseMoveWrapper)
    rm('resize', this.resize)

    window.cancelAnimationFrame(this.req)
    if (this.renderer) {
      if (this.renderer.domElement) {
        this.el.removeChild(this.renderer.domElement)
      }
      this.renderer = null
      this.scene = null
    }
  }
}

export default VANTA.VantaBase