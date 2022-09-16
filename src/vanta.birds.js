// Adapted from https://threejs.org/examples/canvas_geometry_birds.html

import VantaBase, { VANTA } from './_base.js'
// import {rn, ri, sample} from './helpers.js'
import {mobileCheck} from './helpers.js'
import GPUComputationRenderer from '../vendor/GPUComputationRenderer.js'

const win = typeof window == 'object'
let THREE = win && window.THREE
const GPGPU = !mobileCheck()

let WIDTH = 32
let BIRDS = WIDTH * WIDTH
const BOUNDS = 800
const BOUNDS_HALF = BOUNDS / 2


const getNewBirdGeometry = (options) => {
  const scope = new THREE.BufferGeometry()

  if (options.quantity) {
    WIDTH = Math.pow(2, options.quantity)
    BIRDS = WIDTH * WIDTH
  }
  const triangles = BIRDS * 3
  const points = triangles * 3

  const vertices = new THREE.BufferAttribute(new Float32Array(points * 3), 3)
  const birdColors = new THREE.BufferAttribute(new Float32Array(points * 3), 3)
  const references = new THREE.BufferAttribute(new Float32Array(points * 2), 2)
  const birdVertex = new THREE.BufferAttribute(new Float32Array(points), 1)

  if (!scope.setAttribute) scope.setAttribute = scope.addAttribute // handle three.js migration r109 → r110
  scope.setAttribute('position', vertices)
  scope.setAttribute('birdColor', birdColors)
  scope.setAttribute('reference', references)
  scope.setAttribute('birdVertex', birdVertex)
  // scope.addAttribute( 'normal', new Float32Array( points * 3 ), 3 )

  let v = 0
  const verts_push = function() {
    for (let i=0; i<arguments.length; i++) {
      vertices.array[v++] = arguments[i]
    }
  }

  const wingSpan = options.wingSpan || 20
  const s = options.birdSize || 1

  for (let f=0; f<BIRDS; f++) {
    verts_push(0, -0, -20*s, 0, 4*s, -20*s, 0, 0, 30*s) // Body
    verts_push(0, 0, -15*s, -wingSpan*s, 0, 0, 0, 0, 15*s) // Left Wing
    verts_push(0, 0, 15*s, wingSpan*s, 0, 0, 0, 0, -15*s) // Right Wing
  }

  const colorCache = {}

  for (v=0; v<triangles*3; v++) {
    const i = ~~(v / 3)
    const x = (i % WIDTH) / WIDTH
    const y = ~~(i / WIDTH) / WIDTH
    const order = ~~(v / 9) / BIRDS
    const key = order.toString()
    const gradient = options.colorMode.indexOf('Gradient') != -1
    let c
    if (!gradient && colorCache[key]) {
      c = colorCache[key]
    } else {
      c = options.effect.getNewCol(order)
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
  return scope.scale(0.2, 0.2, 0.2)
}

const getNewBirdGeometryBasic = (options={}) => {
  const scope = new THREE.BufferGeometry()
  const points = []
  function v( x, y, z ) {
    const s = 1.5 * (options.birdSize || 1)
    points.push( new THREE.Vector3( x*s, y*s, z*s ) )
  }
  v(   5,   0,   0 )
  v( - 5, - 1,   1 )
  v( - 5,   0,   0 )
  v( - 5, - 2, - 1 )
  v(   0,   2, - 6 )
  v(   0,   2,   6 )
  v(   2,   0,   0 )
  v( - 3,   0,   0 )
  scope.setFromPoints(points)

  const indices = []
  indices.push( 0, 2, 1 )
  // f3( 0, 3, 2 )
  indices.push( 4, 7, 6 )
  indices.push( 5, 6, 7 )
  scope.setIndex(indices)

  // this.computeCentroids()
  return scope
}

// Based on http://www.openprocessing.org/visuals/?visualID=6910
class Boid {
  constructor (options) {
    var vector = new THREE.Vector3(),
    _acceleration,
    _width = 500,
    _height = 500,
    _depth = 200, _goal,
    _neighborhoodRadius = 100,
    _maxSpeed = 2.5,
    _maxSteerForce = 0.1,
    _avoidWalls = true;

    var _options = options

    this.position = new THREE.Vector3()
    this.velocity = new THREE.Vector3()
    _acceleration = new THREE.Vector3()

    this.setGoal = function ( target ) {
      _goal = target;
    }

    // this.setAvoidWalls = function ( value ) {
    //   _avoidWalls = value;
    // }

    this.setWorldSize = function ( width, height, depth ) {
      _width = width;
      _height = height;vector
      _depth = depth;
    }

    this.run = function ( boids ) {
      if ( _avoidWalls ) {
        vector.set( - _width, this.position.y, this.position.z )
        vector = this.avoid( vector )
        vector.multiplyScalar( 5 )
        _acceleration.add( vector )

        vector.set( _width, this.position.y, this.position.z )
        vector = this.avoid( vector )
        vector.multiplyScalar( 5 )
        _acceleration.add( vector )

        vector.set( this.position.x, - _height, this.position.z )
        vector = this.avoid( vector )
        vector.multiplyScalar( 5 )
        _acceleration.add( vector )

        vector.set( this.position.x, _height, this.position.z )
        vector = this.avoid( vector )
        vector.multiplyScalar( 5 )
        _acceleration.add( vector )

        vector.set( this.position.x, this.position.y, - _depth )
        vector = this.avoid( vector )
        vector.multiplyScalar( 5 )
        _acceleration.add( vector )

        vector.set( this.position.x, this.position.y, _depth )
        vector = this.avoid( vector )
        vector.multiplyScalar( 5 )
        _acceleration.add( vector )
      }/* else {
        this.checkBounds();
      }*/

      if ( Math.random() > 0.5 ) {
        this.flock( boids )
      }
      this.move()
    }

    this.flock = function ( boids ) {
      if ( _goal ) {
        _acceleration.add( this.reach( _goal, 0.005 ) )
      }
      _acceleration.add( this.alignment( boids ) )
      _acceleration.add( this.cohesion( boids ) )
      _acceleration.add( this.separation( boids ) )
    }

    this.move = function () {
      this.velocity.add( _acceleration )
      var l = this.velocity.length()
      if ( l > _maxSpeed ) {
        this.velocity.divideScalar( l / _maxSpeed )
      }
      this.position.add( this.velocity )
      _acceleration.set( 0, 0, 0 )
    }

    this.checkBounds = function () {
      if ( this.position.x >   _width ) this.position.x = - _width;
      if ( this.position.x < - _width ) this.position.x =   _width;
      if ( this.position.y >   _height ) this.position.y = - _height;
      if ( this.position.y < - _height ) this.position.y =  _height;
      if ( this.position.z >  _depth ) this.position.z = - _depth;
      if ( this.position.z < - _depth ) this.position.z =  _depth;
    }

    this.avoid = function ( target ) {
      var steer = new THREE.Vector3()
      steer.copy( this.position )
      steer.sub( target )
      steer.multiplyScalar( 1 / this.position.distanceToSquared( target ) )
      return steer
    }

    this.repulse = function ( target ) {
      var distance = this.position.distanceTo( target )
      if ( distance < 150 ) {
        var steer = new THREE.Vector3()
        steer.subVectors( this.position, target )
        steer.multiplyScalar( 0.5 / distance )
        _acceleration.add( steer )
      }
    }

    this.reach = function ( target, amount ) {
      var steer = new THREE.Vector3()
      steer.subVectors( target, this.position )
      steer.multiplyScalar( amount )
      return steer
    }

    this.alignment = function ( boids ) {
      var boid, velSum = new THREE.Vector3(), count = 0, distance
      const radius = _neighborhoodRadius * _options.alignment/20
      for ( var i = 0, il = boids.length; i < il; i++ ) {
        if ( Math.random() > 0.6 ) continue
        boid = boids[ i ]
        distance = boid.position.distanceTo( this.position )
        if ( distance > 0 && distance <= radius ) {
          velSum.add( boid.velocity )
          count++
        }
      }
      if ( count > 0 ) {
        velSum.divideScalar( count )
        var l = velSum.length()
        if ( l > _maxSteerForce ) {
          velSum.divideScalar( l / _maxSteerForce )
        }
      }
      return velSum
    }

    this.cohesion = function ( boids ) {
      var boid, distance,
      posSum = new THREE.Vector3(),
      steer = new THREE.Vector3(),
      count = 0
      const radius = _neighborhoodRadius * _options.cohesion/20

      for ( var i = 0, il = boids.length; i < il; i ++ ) {
        if ( Math.random() > 0.6 ) continue
        boid = boids[ i ]
        distance = boid.position.distanceTo( this.position )

        if ( distance > 0 && distance <= radius ) {
          posSum.add( boid.position )
          count++
        }
      }
      if ( count > 0 ) {
        posSum.divideScalar( count )
      }
      steer.subVectors( posSum, this.position )
      var l = steer.length()
      if ( l > _maxSteerForce ) {
        steer.divideScalar( l / _maxSteerForce )
      }
      return steer
    }

    this.separation = function ( boids ) {
      var boid, distance,
        posSum = new THREE.Vector3(),
        repulse = new THREE.Vector3()
      const radius = _neighborhoodRadius * _options.separation/20

      for ( var i = 0, il = boids.length; i < il; i ++ ) {
        if ( Math.random() > 0.6 ) continue
        boid = boids[ i ]
        distance = boid.position.distanceTo( this.position )
        if ( distance > 0 && distance <= radius ) {
          repulse.subVectors( this.position, boid.position )
          repulse.normalize()
          repulse.divideScalar( distance )
          posSum.add( repulse )
        }
      }
      return posSum
    }
  }
}



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
uniform float birdSize;

void main() {

  vec4 tmpPos = texture2D( texturePosition, reference );
  vec3 pos = tmpPos.xyz;
  vec3 velocity = normalize(texture2D( textureVelocity, reference ).xyz);

  vec3 newPosition = position;

  if ( birdVertex == 4.0 || birdVertex == 7.0 ) {
    // flap wings
    newPosition.y = sin( tmpPos.w ) * 5. * birdSize;
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

class Birds extends VantaBase {
  static initClass() {
    this.prototype.defaultOptions = {
      // Beige: 0xf8e8d0, 0xf50000, 0xcfcf1d
      backgroundColor: 0x07192F, // 0x202428
      color1: 0xff0000, // 0xf50000 # 0xfa9898
      color2: 0x00d1ff, // 0xcfcf1d # 0x8c4646
      colorMode: 'varianceGradient',
      birdSize: 1,
      wingSpan: 30,
      speedLimit: 5,
      separation: 20,
      alignment: 20,
      cohesion: 20,
      quantity: 5, // range from 2 to 5
    }
  }

  constructor(userOptions) {
    THREE = userOptions.THREE || THREE
    super(userOptions)
  }

  initComputeRenderer() {
    this.gpuCompute = new GPUComputationRenderer(WIDTH, WIDTH, this.renderer, THREE)
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

  initGpgpuBirds() {
    const optionsWithEffect = Object.assign({}, this.options, {effect:this})
    const geometry = getNewBirdGeometry(optionsWithEffect)
    // For Vertex and Fragment
    this.birdUniforms = {
      color: { value: new THREE.Color(0xff2200) },
      texturePosition: { value: null },
      textureVelocity: { value: null },
      time: { value: 1.0 },
      delta: { value: 0.0 },
      birdSize: {value: this.options.birdSize}
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

  getNewCol(order) {
    const options = this.options
    const color1 = options.color1 != null ? options.color1 : 0x440000
    const color2 = options.color2 != null ? options.color2 : 0x660000
    const c1 = new THREE.Color(color1)
    const c2 = new THREE.Color(color2)
    const gradient = options.colorMode.indexOf('Gradient') != -1
    let c, dist
    if (gradient) {
      // each vertex has a different color
      dist = Math.random()
    } else {
      // each vertex has the same color
      dist = order
    }

    if (options.colorMode.indexOf('variance') == 0) {
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
    return c
  }

  onInit() {
    this.camera = new THREE.PerspectiveCamera( 75, this.width / this.height, 1, 3000 )
    this.camera.position.z = 350
    this.fog = new THREE.Fog( 0xffffff, 100, 1000 )
    this.mouseX = (this.mouseY = 0)

    const birds = this.birds = []
		const boids = this.boids = []
    const options = this.options
    let boid, bird

    if (GPGPU) {
      try {
        this.initComputeRenderer()
        this.valuesChanger = this.valuesChanger.bind(this)
        this.valuesChanger()
        this.initGpgpuBirds()
      } catch (err) {
        console.error('[vanta.js] birds init error: ', err)
      }
    } else {
      const numBirds = 6 * Math.pow(2, options.quantity)
      for (var i = 0; i < numBirds; i++) {
        boid = boids[i] = new Boid(options)
        boid.position.x = Math.random() * 400 - 200
        boid.position.y = Math.random() * 400 - 200
        boid.position.z = Math.random() * 400 - 200
        boid.velocity.x = Math.random() * 2 - 1
        boid.velocity.y = Math.random() * 2 - 1
        boid.velocity.z = Math.random() * 2 - 1
        boid.setWorldSize( 500, 500, 300 )

        const gradient = options.colorMode.indexOf('Gradient') != -1

        const newBirdGeo = getNewBirdGeometryBasic(options)
        const numV = newBirdGeo.attributes.position.length
        const birdColors = new THREE.BufferAttribute(new Float32Array(numV), 3)
        if (gradient) {
          for (var j=0; j<newBirdGeo.index.array.length; j+=3) {
            for (var k=0; k<=2; k++) {
              const index = newBirdGeo.index.array[j+k]
              const newColor = this.getNewCol()
              birdColors.array[index*3] = newColor.r
              birdColors.array[index*3+1] = newColor.g
              birdColors.array[index*3+2] = newColor.b
            }
          }
        } else {
          const newColor = this.getNewCol(i/numBirds)
          for (var j=0; j<birdColors.array.length; j+=3) {
            birdColors.array[j] = newColor.r
            birdColors.array[j+1] = newColor.g
            birdColors.array[j+2] = newColor.b
          }
        }
        newBirdGeo.setAttribute('color', birdColors)

        bird = birds[i] = new THREE.Mesh(
          newBirdGeo,
          new THREE.MeshBasicMaterial( {
            color: 0xffffff,
            side: THREE.DoubleSide,
            // colors: THREE.VertexColors,
					  vertexColors: THREE.VertexColors,
          }))
        bird.phase = Math.floor( Math.random() * 62.83 )
        bird.position.x = boids[i].position.x
        bird.position.y = boids[i].position.y
        bird.position.z = boids[i].position.z
        this.scene.add( bird )
        // if (i == 0) {
        //   window.bird = bird; window.boid = boid;
        // }
      }
    }
  }

  valuesChanger() {
    if (this.velocityUniforms) {
      this.velocityUniforms.separationDistance.value = this.options.separation
      this.velocityUniforms.alignmentDistance.value = this.options.alignment
      this.velocityUniforms.speedLimit.value = this.options.speedLimit
      this.velocityUniforms.cohesionDistance.value = this.options.cohesion
    }
  }

  onUpdate() {
    this.now = performance.now()
    if (!this.last) { this.last = this.now }
    let delta = (this.now - this.last) / 1000

    if (delta > 1) { delta = 1 }
    this.last = this.now

    if (GPGPU) {
      this.positionUniforms.time.value = this.now
      this.positionUniforms.delta.value = delta
      this.velocityUniforms.time.value = this.now
      this.velocityUniforms.delta.value = delta
      this.birdUniforms.time.value = this.now
      this.birdUniforms.delta.value = delta
      this.velocityUniforms.predator.value.set(
        this.mouseX,
        -this.mouseY,
        0
      )
      this.mouseX = 10000
      this.mouseY = 10000
      this.gpuCompute.compute()
      this.birdUniforms.texturePosition.value = this.gpuCompute.getCurrentRenderTarget( this.positionVariable ).texture
      this.birdUniforms.textureVelocity.value = this.gpuCompute.getCurrentRenderTarget( this.velocityVariable ).texture
    } else {
      const birds = this.birds
      const boids = this.boids
      let boid, bird, color
      for ( var i = 0, il = birds.length; i < il; i++ ) {
        boid = boids[i]
        boid.run( boids )
        bird = birds[i]
        // color = bird.material.color
        // color.r = color.g = color.b = ( 500 - bird.position.z ) / 1000
        bird.rotation.y = Math.atan2( - boid.velocity.z, boid.velocity.x )
        bird.rotation.z = Math.asin( boid.velocity.y / boid.velocity.length() )
        // Flapping
        bird.phase = (bird.phase + (Math.max(0, bird.rotation.z)+0.1)) % 62.83

        const tip1 = 5*3 + 1
        const tip2 = 4*3 + 1
        bird.geometry.attributes.position.array[tip1] = bird.geometry.attributes.position.array[tip2] =
          Math.sin( bird.phase ) * 5 * this.options.birdSize
        bird.geometry.attributes.position.needsUpdate = true
        bird.geometry.computeVertexNormals()

        bird.position.x = boids[i].position.x
        bird.position.y = boids[i].position.y
        bird.position.z = boids[i].position.z
      }
    }
  }
  onMouseMove(x,y) {
    // Center on 0,0
    this.mouseX = x - 0.5
    this.mouseY = y - 0.5
    if (!GPGPU) {
      const boids = this.boids
      let boid
      var vector = new THREE.Vector3( this.mouseX * this.width, -this.mouseY * this.height, 0 );
      for ( var i = 0, il = boids.length; i < il; i++ ) {
        boid = boids[i]
        vector.z = boid.position.z
        boid.repulse( vector )
			}
    }
  }
  onDestroy() {}
  onResize() {}
}
Birds.initClass()
export default VANTA.register('BIRDS', Birds)