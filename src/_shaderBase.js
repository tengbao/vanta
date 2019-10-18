import VantaBase from './_base.js'
import {extend} from './helpers.js'

export {VANTA} from './_base.js'

if (typeof THREE == 'object') {
  THREE.Color.prototype.toVector = function(){
    return new THREE.Vector3(this.r, this.g, this.b)
  }
}
export default class ShaderBase extends VantaBase {
  constructor(userOptions) {
    super(userOptions)
    this.updateUniforms = this.updateUniforms.bind(this)
  }
  init(){
    this.mode = 'shader'
    this.uniforms = {
      u_time: {
        type: "f",
        value: 1.0
      },
      u_resolution: {
        type: "v2",
        value: new THREE.Vector2(1, 1)
      },
      u_mouse: {
        type: "v2",
        value: new THREE.Vector2(0, 0)
      }
    }
    super.init()
    if (this.fragmentShader) {
      this.initBasicShader()
    }
  }
  setOptions(userOptions){
    super.setOptions(userOptions)
    this.updateUniforms()
  }
  initBasicShader(fragmentShader = this.fragmentShader, vertexShader = this.vertexShader) {
    if (!vertexShader) {
      vertexShader = "uniform float u_time;\nuniform vec2 u_resolution;\nvoid main() {\n  gl_Position = vec4( position, 1.0 );\n}"
    }
    this.updateUniforms()
    if (typeof this.valuesChanger === "function") {
      this.valuesChanger() // Some effects define this themselves
    }
    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader
    })
    const texPath = this.options.texturePath
    if (texPath) {
      this.uniforms.u_tex = {
        type: "t",
        value: new THREE.TextureLoader().load(texPath)
      }
    }
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
    this.scene.add(mesh)
    this.camera = new THREE.Camera()
    this.camera.position.z = 1
  }

  updateUniforms() {
    const newUniforms = {}
    let k, v
    for (k in this.options) {
      v = this.options[k]
      if (k.toLowerCase().indexOf('color') !== -1) {
        newUniforms[k] = {
          type: "v3",
          value: new THREE.Color(v).toVector()
        }
      } else if (typeof v === 'number') {
        newUniforms[k] = {
          type: "f",
          value: v
        }
      }
    }
    return extend(this.uniforms, newUniforms)
  }
  resize(){
    super.resize()
    this.uniforms.u_resolution.value.x = this.width / this.scale
    this.uniforms.u_resolution.value.y = this.height / this.scale
  }
}