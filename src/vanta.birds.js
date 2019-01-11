// Adapted from https://threejs.org/examples/canvas_geometry_birds.html

import VantaBase, { VANTA } from './_base.js'
// import {rn, ri, sample, mobilecheck} from './helpers.js'
import GPUComputationRenderer from '../vendor/GPUComputationRenderer.js'

let WIDTH = 32
let BIRDS = WIDTH * WIDTH
const BOUNDS = 800
const BOUNDS_HALF = BOUNDS / 2

const fragmentShaderPosition = `\
uniform float time;
uniform float delta;

void main() {

  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 tmpPos = texture2D( texturePosition, uv );
  vec3 position = tmpPos.xyz;
  vec3 velocity = texture2D( textureVelocity, uv ).xyz;

  float phase = tmpPos.w;

  phase = mod( ( phase + delta +
    length( velocity.xz ) * delta * 3. +
    max( velocity.y, 0.0 ) * delta * 6. ), 62.83 );

  gl_FragColor = vec4( position + velocity * delta * 15. , phase );

}`

const fragmentShaderVelocity = `\
uniform float time;
uniform float testing;
uniform float delta; // about 0.016
uniform float separationDistance; // 20
uniform float alignmentDistance; // 40
uniform float cohesionDistance;
uniform float speedLimit;
uniform float freedomFactor;
uniform vec3 predator;

const float width = resolution.x;
const float height = resolution.y;

const float PI = 3.141592653589793;
const float PI_2 = PI * 2.0;
// const float VISION = PI * 0.55;

float zoneRadius = 40.0;
float zoneRadiusSquared = 1600.0;

float separationThresh = 0.45;
float alignmentThresh = 0.65;

const float UPPER_BOUNDS = BOUNDS;
const float LOWER_BOUNDS = -UPPER_BOUNDS;

float rand(vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {

  zoneRadius = separationDistance + alignmentDistance + cohesionDistance;
  separationThresh = separationDistance / zoneRadius;
  alignmentThresh = ( separationDistance + alignmentDistance ) / zoneRadius;
  zoneRadiusSquared = zoneRadius * zoneRadius;


  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 birdPosition, birdVelocity;

  vec3 selfPosition = texture2D( texturePosition, uv ).xyz;
  vec3 selfVelocity = texture2D( textureVelocity, uv ).xyz;

  float dist;
  vec3 dir; // direction
  float distSquared;

  float separationSquared = separationDistance * separationDistance;
  float cohesionSquared = cohesionDistance * cohesionDistance;

  float f;
  float percent;

  vec3 velocity = selfVelocity;

  float limit = speedLimit;

  dir = predator * UPPER_BOUNDS - selfPosition;
  dir.z = 0.;
  // dir.z *= 0.6;
  dist = length( dir );
  distSquared = dist * dist;

  float preyRadius = 150.0;
  float preyRadiusSq = preyRadius * preyRadius;

  // move birds away from predator
  if (dist < preyRadius) {

    f = ( distSquared / preyRadiusSq - 1.0 ) * delta * 100.;
    velocity += normalize( dir ) * f;
    limit += 5.0;
  }

  // if (testing == 0.0) {}
  // if ( rand( uv + time ) < freedomFactor ) {}

  // Attract flocks to the center
  vec3 central = vec3( 0., 0., 0. );
  dir = selfPosition - central;
  dist = length( dir );

  dir.y *= 2.5;
  velocity -= normalize( dir ) * delta * 5.;

  for (float y=0.0;y<height;y++) {
    for (float x=0.0;x<width;x++) {

      vec2 ref = vec2( x + 0.5, y + 0.5 ) / resolution.xy;
      birdPosition = texture2D( texturePosition, ref ).xyz;

      dir = birdPosition - selfPosition;
      dist = length(dir);

      if (dist < 0.0001) continue;

      distSquared = dist * dist;

      if (distSquared > zoneRadiusSquared ) continue;

      percent = distSquared / zoneRadiusSquared;

      if ( percent < separationThresh ) { // low

        // Separation - Move apart for comfort
        f = (separationThresh / percent - 1.0) * delta;
        velocity -= normalize(dir) * f;

      } else if ( percent < alignmentThresh ) { // high

        // Alignment - fly the same direction
        float threshDelta = alignmentThresh - separationThresh;
        float adjustedPercent = ( percent - separationThresh ) / threshDelta;

        birdVelocity = texture2D( textureVelocity, ref ).xyz;

        f = ( 0.5 - cos( adjustedPercent * PI_2 ) * 0.5 + 0.5 ) * delta;
        velocity += normalize(birdVelocity) * f;

      } else {

        // Attraction / Cohesion - move closer
        float threshDelta = 1.0 - alignmentThresh;
        float adjustedPercent = ( percent - alignmentThresh ) / threshDelta;

        f = ( 0.5 - ( cos( adjustedPercent * PI_2 ) * -0.5 + 0.5 ) ) * delta;

        velocity += normalize(dir) * f;

      }
    }
  }

  // this make tends to fly around than down or up
  // if (velocity.y > 0.) velocity.y *= (1. - 0.2 * delta);

  // Speed Limits
  if ( length( velocity ) > limit ) {
    velocity = normalize( velocity ) * limit;
  }

  gl_FragColor = vec4( velocity, 1.0 );

}`

const birdVS = `\
attribute vec2 reference;
attribute float birdVertex;

attribute vec3 birdColor;

uniform sampler2D texturePosition;
uniform sampler2D textureVelocity;

varying vec4 vColor;
varying float z;

uniform float time;

void main() {

  vec4 tmpPos = texture2D( texturePosition, reference );
  vec3 pos = tmpPos.xyz;
  vec3 velocity = normalize(texture2D( textureVelocity, reference ).xyz);

  vec3 newPosition = position;

  if ( birdVertex == 4.0 || birdVertex == 7.0 ) {
    // flap wings
    newPosition.y = sin( tmpPos.w ) * 5.;
  }

  newPosition = mat3( modelMatrix ) * newPosition;

  velocity.z *= -1.;
  float xz = length( velocity.xz );
  float xyz = 1.;
  float x = sqrt( 1. - velocity.y * velocity.y );

  float cosry = velocity.x / xz;
  float sinry = velocity.z / xz;

  float cosrz = x / xyz;
  float sinrz = velocity.y / xyz;

  mat3 maty =  mat3(
    cosry, 0, -sinry,
    0    , 1, 0     ,
    sinry, 0, cosry
  );

  mat3 matz =  mat3(
    cosrz , sinrz, 0,
    -sinrz, cosrz, 0,
    0     , 0    , 1
  );
  newPosition =  maty * matz * newPosition;
  newPosition += pos;
  z = newPosition.z;

  vColor = vec4( birdColor, 1.0 );
  gl_Position = projectionMatrix *  viewMatrix  * vec4( newPosition, 1.0 );
}`

const birdFS = `\
varying vec4 vColor;
varying float z;
uniform vec3 color;
void main() {
  // Fake colors for now
  float rr = 0.2 + ( 1000. - z ) / 1000. * vColor.x;
  float gg = 0.2 + ( 1000. - z ) / 1000. * vColor.y;
  float bb = 0.2 + ( 1000. - z ) / 1000. * vColor.z;
  gl_FragColor = vec4( rr, gg, bb, 1. );
}`

const fillPositionTexture = function(texture) {
  const theArray = texture.image.data
  let k = 0
  const kl = theArray.length
  return (() => {
    const result = []
    while (k < kl) {
      const x = (Math.random() * BOUNDS) - BOUNDS_HALF
      const y = (Math.random() * BOUNDS) - BOUNDS_HALF
      const z = (Math.random() * BOUNDS) - BOUNDS_HALF
      theArray[k + 0] = x
      theArray[k + 1] = y
      theArray[k + 2] = z
      theArray[k + 3] = 1
      result.push(k += 4)
    }
    return result
  })()
}

const fillVelocityTexture = function(texture) {
  const theArray = texture.image.data
  let k = 0
  const kl = theArray.length
  return (() => {
    const result = []
    while (k < kl) {
      const x = Math.random() - 0.5
      const y = Math.random() - 0.5
      const z = Math.random() - 0.5
      theArray[k + 0] = x * 10
      theArray[k + 1] = y * 10
      theArray[k + 2] = z * 10
      theArray[k + 3] = 1
      result.push(k += 4)
    }
    return result
  })()
}

THREE.BirdGeometry = function(options) {
  if (options.quantity) {
    WIDTH = Math.pow(2, options.quantity)
    BIRDS = WIDTH * WIDTH
  }
  const triangles = BIRDS * 3
  const points = triangles * 3

  THREE.BufferGeometry.call(this)
  const vertices = new THREE.BufferAttribute(new Float32Array(points * 3), 3)
  const birdColors = new THREE.BufferAttribute(new Float32Array(points * 3), 3)
  const references = new THREE.BufferAttribute(new Float32Array(points * 2), 2)
  const birdVertex = new THREE.BufferAttribute(new Float32Array(points), 1)
  this.addAttribute('position', vertices)
  this.addAttribute('birdColor', birdColors)
  this.addAttribute('reference', references)
  this.addAttribute('birdVertex', birdVertex)
  // this.addAttribute( 'normal', new Float32Array( points * 3 ), 3 )

  let v = 0
  const verts_push = function() {
    for (let i=0; i<arguments.length; i++) {
      vertices.array[v++] = arguments[i]
    }
  }

  const wingSpan = options.wingSpan || 20

  for (let f=0; f<BIRDS; f++) {
    verts_push(0, -0, -20, 0, 4, -20, 0, 0, 30) // Body
    verts_push(0, 0, -15, -wingSpan, 0, 0, 0, 0, 15) // Left Wing
    verts_push(0, 0, 15, wingSpan, 0, 0, 0, 0, -15) // Right Wing
  }

  const colorCache = {}

  for (v=0; v<triangles*3; v++) {
    const i = ~~(v / 3)
    const x = (i % WIDTH) / WIDTH
    const y = ~~(i / WIDTH) / WIDTH

    const color1 = options.color1 != null ? options.color1 : 0x440000
    const color2 = options.color2 != null ? options.color2 : 0x660000
    const c1 = new THREE.Color(color1)
    const c2 = new THREE.Color(color2)

    const order = ~~(v / 9) / BIRDS
    const key = order.toString()
    const gradient = options.colorMode.indexOf('Gradient') != -1

    let c, dist
    if (gradient) {
      // each vertex has a different color
      dist = Math.random()
    } else {
      // each vertex has the same color
      dist = order
    }

    if (!gradient && colorCache[key]) {
      c = colorCache[key]
    } else if (options.colorMode.indexOf('variance') == 0) {
      const r2 = (c1.r + Math.random() * c2.r).clamp(0,1)
      const g2 = (c1.g + Math.random() * c2.g).clamp(0,1)
      const b2 = (c1.b + Math.random() * c2.b).clamp(0,1)
      c = new THREE.Color(r2, g2, b2)
    } else if (options.colorMode.indexOf('mix') == 0) {
      // Naive color arithmetic
      c = new THREE.Color(color1 + dist * color2)
    } else {
      // Linear interpolation
      c = c1.lerp(c2, dist)
    }

    if (!gradient && !colorCache[key]) {
      colorCache[key] = c
    }

    birdColors.array[(v * 3) + 0] = c.r
    birdColors.array[(v * 3) + 1] = c.g
    birdColors.array[(v * 3) + 2] = c.b
    references.array[v * 2] = x
    references.array[(v * 2) + 1] = y
    birdVertex.array[v] = v % 9
  }
  return this.scale(0.2, 0.2, 0.2)
}

THREE.BirdGeometry.prototype = Object.create(THREE.BufferGeometry.prototype)

class Birds extends VantaBase {

  static initClass() {
    this.prototype.defaultOptions = {
      // Beige: 0xf8e8d0, 0xf50000, 0xcfcf1d
      backgroundColor: 0x07192F, // 0x202428
      color1: 0xff0000, // 0xf50000 # 0xfa9898
      color2: 0x00d1ff, // 0xcfcf1d # 0x8c4646
      colorMode: 'varianceGradient',
      wingSpan: 30,
      speedLimit: 5,
      separation: 20,
      alignment: 20,
      cohesion: 20,
      quantity: 5, // range from 2 to 5
    }
  }

  initComputeRenderer() {
    this.gpuCompute = new GPUComputationRenderer(WIDTH, WIDTH, this.renderer)
    const dtPosition = this.gpuCompute.createTexture()
    const dtVelocity = this.gpuCompute.createTexture()
    fillPositionTexture(dtPosition)
    fillVelocityTexture(dtVelocity)
    this.velocityVariable = this.gpuCompute.addVariable('textureVelocity', fragmentShaderVelocity, dtVelocity)
    this.positionVariable = this.gpuCompute.addVariable('texturePosition', fragmentShaderPosition, dtPosition)
    this.gpuCompute.setVariableDependencies(this.velocityVariable, [
      this.positionVariable,
      this.velocityVariable
    ])
    this.gpuCompute.setVariableDependencies(this.positionVariable, [
      this.positionVariable,
      this.velocityVariable
    ])
    this.positionUniforms = this.positionVariable.material.uniforms
    this.velocityUniforms = this.velocityVariable.material.uniforms
    this.positionUniforms.time = {value: 0.0}
    this.positionUniforms.delta = {value: 0.0}
    this.velocityUniforms.time = {value: 1.0}
    this.velocityUniforms.delta = {value: 0.0}
    this.velocityUniforms.testing = {value: 1.0}
    this.velocityUniforms.separationDistance = {value: 1.0}
    this.velocityUniforms.alignmentDistance = {value: 1.0}
    this.velocityUniforms.cohesionDistance = {value: 1.0}
    this.velocityUniforms.speedLimit = {value: 1.0}
    this.velocityUniforms.freedomFactor = {value: 1.0}
    this.velocityUniforms.predator = {value: new THREE.Vector3}
    this.velocityVariable.material.defines.BOUNDS = BOUNDS.toFixed(2)
    this.velocityVariable.wrapS = THREE.RepeatWrapping
    this.velocityVariable.wrapT = THREE.RepeatWrapping
    this.positionVariable.wrapS = THREE.RepeatWrapping
    this.positionVariable.wrapT = THREE.RepeatWrapping
    const error = this.gpuCompute.init()
    if (error !== null) {
      console.error(error)
    }
  }

  initBirds() {
    const geometry = new THREE.BirdGeometry(this.options)
    // For Vertex and Fragment
    this.birdUniforms = {
      color: { value: new THREE.Color(0xff2200) },
      texturePosition: { value: null },
      textureVelocity: { value: null },
      time: { value: 1.0 },
      delta: { value: 0.0 }
    }
    // ShaderMaterial
    const material = new THREE.ShaderMaterial({
      uniforms: this.birdUniforms,
      vertexShader: birdVS,
      fragmentShader: birdFS,
      side: THREE.DoubleSide
    });
    const birdMesh = new THREE.Mesh(geometry, material)
    birdMesh.rotation.y = Math.PI / 2
    birdMesh.matrixAutoUpdate = false
    birdMesh.updateMatrix()
    return this.scene.add(birdMesh)
  }

  onInit() {
    this.camera = new THREE.PerspectiveCamera( 75, this.width / this.height, 1, 3000 )
    this.camera.position.z = 350
    this.fog = new THREE.Fog( 0xffffff, 100, 1000 )
    this.mouseX = (this.mouseY = 0)

    try {
      this.initComputeRenderer()
      this.valuesChanger = this.valuesChanger.bind(this)
      this.valuesChanger()
      this.initBirds()
    } catch (err) {
      console.error('[vanta.js] birds init error: ', err)
    }
  }

  valuesChanger() {
    this.velocityUniforms.separationDistance.value = this.options.separation
    this.velocityUniforms.alignmentDistance.value = this.options.alignment
    this.velocityUniforms.speedLimit.value = this.options.speedLimit
    return this.velocityUniforms.cohesionDistance.value = this.options.cohesion
  }

  onUpdate() {
    this.now = performance.now()
    if (!this.last) { this.last = this.now }
    let delta = (this.now - this.last) / 1000

    if (delta > 1) { delta = 1 }
    this.last = this.now

    this.positionUniforms.time.value = this.now
    this.positionUniforms.delta.value = delta
    this.velocityUniforms.time.value = this.now
    this.velocityUniforms.delta.value = delta
    this.birdUniforms.time.value = this.now
    this.birdUniforms.delta.value = delta

    this.velocityUniforms.predator.value.set(
      this.mouseX,
      - this.mouseY,
      0
    );
    this.mouseX = 10000
    this.mouseY = 10000

    this.gpuCompute.compute()

    this.birdUniforms.texturePosition.value = this.gpuCompute.getCurrentRenderTarget( this.positionVariable ).texture
    return this.birdUniforms.textureVelocity.value = this.gpuCompute.getCurrentRenderTarget( this.velocityVariable ).texture
  }
  onMouseMove(x,y) {
    // Center on 0,0
    this.mouseX = x - 0.5
    return this.mouseY = y - 0.5
  }
  onDestroy() {}
  onResize() {}
}
Birds.initClass()
VANTA.register('BIRDS', Birds)