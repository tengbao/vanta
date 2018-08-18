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
    this.mode = 'shader'
    this.updateUniforms = this.updateUniforms.bind(this)
  }
  initBasicShader(fragmentShader = this.fragmentShader, vertexShader = this.vertexShader) {
    var material, mesh, texPath
    vertexShader || (vertexShader = "uniform float u_time;\nuniform vec2 u_resolution;\nvoid main() {\n  gl_Position = vec4( position, 1.0 );\n}")
    this.updateUniforms()
    if (typeof this.valuesChanger === "function") {
      this.valuesChanger()
    }
    material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader
    })
    if (texPath = this.options.texturePath) {
      this.uniforms.u_tex = {
        type: "t",
        value: new THREE.TextureLoader().load(texPath)
      }
    }
    mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
    this.scene.add(mesh)
    this.camera = new THREE.Camera()
    return this.camera.position.z = 1
  }

  updateUniforms() {
    var k, newUniforms, ref, v
    newUniforms = {}
    ref = this.options
    for (k in ref) {
      v = ref[k]
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

  init(){
    super.init()
    if (this.fragmentShader) {
      this.initBasicShader()
    }
  }
  resize(){
    super.resize()
    this.uniforms.u_resolution.value.x = this.width / this.scale
    this.uniforms.u_resolution.value.y = this.height / this.scale
  }
}