import VantaBase, {VANTA} from './_base.js'
import {rn, getBrightness} from './helpers.js'

const win = typeof window == 'object'
let THREE = win && window.THREE

class Effect extends VantaBase {
  static initClass() {
    this.prototype.defaultOptions = {
      color: 0xff3f81,
      color2: 0xffffff,
      size: 1,
      backgroundColor: 0x23153c,
      points: 10,
      maxDistance: 20,
      spacing: 15,
      showDots: true
    }
  }

  constructor(userOptions) {
    THREE = userOptions.THREE || THREE
    super(userOptions)
  }

  // onInit() {
  //   this.geometry = new THREE.BoxGeometry( 10, 10, 10 );
  //   this.material = new THREE.MeshLambertMaterial({
  //     color: this.options.color,
  //     emissive: this.options.color,
  //     emissiveIntensity: 0.75
  //   });
  //   this.cube = new THREE.Mesh( this.geometry, this.material );
  //   this.scene.add(this.cube);

  //   const c = this.camera = new THREE.PerspectiveCamera( 75, this.width/this.height, 0.1, 1000 );
  //   c.position.z = 30;
  //   c.lookAt(0,0,0);
  //   this.scene.add(c);

  //   const light = new THREE.HemisphereLight( 0xffffff, this.options.backgroundColor , 1 );
  //   this.scene.add(light);
  // }

  // onUpdate() {
  //   this.cube.rotation.x += 0.01;
  //   this.cube.rotation.y += 0.01;
  // }

  genPoint(x, y, z) {
    let sphere
    if (!this.points) { this.points = [] }

    if (this.options.showDots) {
      const geometry = new THREE.SphereGeometry( 0.25, 12, 12 ) // radius, width, height
      const material = new THREE.MeshLambertMaterial({
        color: this.options.color})
      sphere = new THREE.Mesh( geometry, material )
    } else {
      sphere = new THREE.Object3D()
    }
    this.cont.add( sphere )
    sphere.ox = x
    sphere.oy = y
    sphere.oz = z
    sphere.position.set(x,y,z)
    sphere.r = 0 // rotation rate
    return this.points.push(sphere)
  }

  onInit() {
    this.cont = new THREE.Group()
    this.cont.position.set(-50,-20,0)
    this.scene.add(this.cont)

    let n = this.options.points
    let { spacing } = this.options

    const numPoints = n * n * 2
    this.linePositions = new Float32Array( numPoints * numPoints * 3 )
    this.lineColors = new Float32Array( numPoints * numPoints * 3 )

    const colorB = getBrightness(new THREE.Color(this.options.color))
    const bgB = getBrightness(new THREE.Color(this.options.backgroundColor))
    this.blending =  colorB > bgB ? 'additive' : 'subtractive'

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position',
      new THREE.BufferAttribute(this.linePositions, 3).setUsage(THREE.DynamicDrawUsage))
    geometry.setAttribute('color',
      new THREE.BufferAttribute(this.lineColors, 3).setUsage(THREE.DynamicDrawUsage))
    geometry.computeBoundingSphere()
    geometry.setDrawRange( 0, 0 )
    const material = new THREE.LineBasicMaterial({
      vertexColors: THREE.VertexColors,
      blending: this.blending === 'additive' ? THREE.AdditiveBlending : null,
      // blending: THREE.SubtractiveBlending
      transparent: true
    });
      // blending: THREE.CustomBlending
      // blendEquation: THREE.SubtractEquation
      // blendSrc: THREE.SrcAlphaFactor
      // blendDst: THREE.OneMinusSrcAlphaFactor

    this.linesMesh = new THREE.LineSegments( geometry, material )
    this.cont.add( this.linesMesh )

    for (let i = 0; i<=n; i++) {
      for (let j = 0; j<=n; j++) {
        const y = 0
        const x = ((i - (n/2)) * spacing)
        let z = ((j - (n/2)) * spacing)
        // if (i % 2) { z += spacing * 0.5 } // offset

        // nexusX = Math.round(x / 20) * 20
        // nexusZ = Math.round(z / 20) * 20
        // x += (nexusX - x) * 0.01
        // z += (nexusZ - z) * 0.01
        this.genPoint(x, y, z)
        // this.genPoint(x + ri(-5,5), y, z + ri(-5,5))
      }
    }

    //  # radius
    //   width, # width
    //   rn(0,1000), # startAng
    //   rn(1,6), # ang
    //   rn(0, 50/(radius+1) + 5) + 5/width/(radius+0.5), # y
    //   Math.max(-rn(0.5,2), rn(1, 50-radius/2) - radius/2) * 0.25 # speed
    // )

    // PerspectiveCamera( fov, aspect, near, far )
    this.camera = new THREE.PerspectiveCamera(
      20,
      this.width / this.height,
      0.01, 10000);
    this.camera.position.set(50, 100, 150)
    this.scene.add( this.camera )

    // ambience = new THREE.AmbientLight(0xffffff, 0.01)
    // @scene.add(ambience)

    // @pointLight = new THREE.PointLight(0xFFFFFF, 0.01)
    // @pointLight.position.set(0, 150, 200)
    // @scene.add( @pointLight )

    const ambience = new THREE.AmbientLight(0xffffff, 0.75)
    this.scene.add(ambience)

    this.spot = new THREE.SpotLight(0xFFFFFF, 1)
    this.spot.position.set(0, 200, 0)
    this.spot.distance = 400
    this.spot.target = this.cont
    this.scene.add(this.spot)


    // LINES BALL
    this.cont2 = new THREE.Group()
    this.cont2.position.set(0, 15, 0)
    this.scene.add(this.cont2)

    const material2 = new THREE.LineBasicMaterial({ color: this.options.color2 })
    const linePoints = []
    for (let i = 0; i < 80; i ++) {
      const f1 = rn(18,24)
      const f2 = f1 + rn(1,6)
      // https://math.stackexchange.com/questions/1585975/how-to-generate-random-points-on-a-sphere
      const z = rn(-1,1)
      const r = Math.sqrt(1 - z*z)
      const theta = rn(0, Math.PI * 2)
      const y = Math.sin(theta) * r
      const x = Math.cos(theta) * r
      linePoints.push(new THREE.Vector3( x*f1, y*f1, z*f1) )
      linePoints.push(new THREE.Vector3( x*f2, y*f2, z*f2) )
    }
    const linesGeo = new THREE.BufferGeometry().setFromPoints( linePoints )
    this.linesMesh2 = new THREE.LineSegments( linesGeo, material2 )
    this.linesMesh2.position.set(0, 0, 0)
    this.cont2.add(this.linesMesh2)

    // Poles
    const material3 = new THREE.LineBasicMaterial( {
      color: this.options.color2,
      linewidth: 2,
    } )
    const linePoints3 = []
    linePoints3.push(new THREE.Vector3( 0, 30, 0))
    linePoints3.push(new THREE.Vector3( 0, -30, 0))
    const num = 4
    for (let i = 0; i < num; i ++) {
      let x = 0.15 * Math.cos(i/num*Math.PI*2),
          z = 0.15 * Math.sin(i/num*Math.PI*2)
      let heights = [17.9,12,8,5,3,2,1.5,1.1,0.8,0.6,0.45,0.3,0.2,0.1,0.05,0.03,0.02,0.01]
      for (let j = 0; j<heights.length; j++) {
        let h = heights[j], r = 6*(j+1)
        linePoints3.push(new THREE.Vector3(x*r, h, z*r))
        linePoints3.push(new THREE.Vector3(x*r, -h, z*r))
      }
    }
    const linesGeo3 = new THREE.BufferGeometry().setFromPoints( linePoints3 )
    this.linesMesh3 = new THREE.LineSegments( linesGeo3, material3 )
    this.linesMesh3.position.set(0, 0, 0)
    this.cont2.add(this.linesMesh3)


    // GLOBE
    // https://stackoverflow.com/questions/20153705/three-js-wireframe-material-all-polygons-vs-just-edges
    const wireMat = new THREE.LineBasicMaterial({ color: this.options.color })
    const sphereGeom = new THREE.SphereGeometry( 18*this.options.size, 18, 14 )
    const edges = new THREE.EdgesGeometry(sphereGeom)
    this.sphere = new THREE.LineSegments( edges, wireMat )
    this.sphere.position.set(0, 0, 0)
    this.cont2.add(this.sphere)

    this.cont2.rotation.x = -0.25


  }

  onUpdate() {
    let diff
    if (this.helper != null) {
      this.helper.update()
    }
    if (this.controls != null) {
      this.controls.update()
    }

    const c = this.camera
    if (Math.abs(c.tx - c.position.x) > 0.01) {
      diff = c.tx - c.position.x
      c.position.x += diff * 0.02
    }
    if (Math.abs(c.ty - c.position.y) > 0.01) {
      diff = c.ty - c.position.y
      c.position.y += diff * 0.02
    }
    if (win && window.innerWidth < 480) {
      c.lookAt( new THREE.Vector3( -10, 0, 0 ) )
    } else if (win && window.innerWidth < 720) {
      c.lookAt( new THREE.Vector3( -20, 0, 0 ) )
    } else c.lookAt( new THREE.Vector3( -40, 0, 0 ) )
    // c.near = 0.01
    // c.updateProjectionMatrix()

    let vertexpos = 0
    let colorpos = 0
    let numConnected = 0

    const bgColor = new THREE.Color(this.options.backgroundColor)
    const color = new THREE.Color(this.options.color)
    const color2 = new THREE.Color(this.options.color2)
    const diffColor = color.clone().sub(bgColor)

    if (this.rayCaster) {
      this.rayCaster.setFromCamera(new THREE.Vector2(this.rcMouseX,this.rcMouseY), this.camera)
    }

    if (this.linesMesh2) {
      this.linesMesh2.rotation.z += 0.002
      this.linesMesh2.rotation.x += 0.0008
      this.linesMesh2.rotation.y += 0.0005
    }
    if (this.sphere) {
      this.sphere.rotation.y += 0.002
      this.linesMesh3.rotation.y -= 0.004
    }

    // # TEMPORARY RAY DRAWING
    // pointA = @camera.position
    // direction = @rayCaster.ray.direction
    // direction.normalize()
    // distance = 1000000 # at what distance to determine pointB
    // pointB = new THREE.Vector3()
    // pointB.addVectors( pointA, direction.multiplyScalar( distance ) )
    // geometry = new THREE.Geometry()
    // geometry.vertices.push( pointA )
    // geometry.vertices.push( pointB )
    // material = new THREE.LineBasicMaterial( { color : 0xffffff } )
    // line = new THREE.Line( geometry, material )
    // @scene.add( line )

    for (let i = 0; i < this.points.length; i++) {
      let dist, distToMouse
      const p = this.points[i]
      // p.position.y += Math.sin(@t * 0.005 - 0.02 * p.ox + 0.015 * p.oz) * 0.02

      if (this.rayCaster) {
        distToMouse = this.rayCaster.ray.distanceToPoint(p.position)
      } else {
        distToMouse = 1000
      }
      const distClamp = distToMouse.clamp(5,15)
      p.scale.z = ((15 - distClamp) * 0.25).clamp(1, 100)
      p.scale.x = p.scale.y = p.scale.z

      // if (p.r !== 0) {
      //   let ang = Math.atan2( p.position.z, p.position.x )
      //   dist = Math.sqrt( (p.position.z * p.position.z) + (p.position.x * p.position.x) )
      //   // ang += 0.0005 * p.r
      //   p.position.x = dist * Math.cos(ang)
      //   p.position.z = dist * Math.sin(ang)
      // }

      p.position.y = 2 * Math.sin(
        p.position.x/10 + this.t*0.01
        + p.position.z/10 * 0.5
      )

        // p.position.x += Math.sin(@t * 0.01 + p.position.y) * 0.02
        // p.position.z += Math.sin(@t * 0.01 - p.position.y) * 0.02

      for (let j = i; j < this.points.length; j++) {
        const p2 = this.points[j]
        const dx = p.position.x - p2.position.x
        const dy = p.position.y - p2.position.y
        const dz = p.position.z - p2.position.z
        dist = Math.sqrt( (dx * dx) + (dy * dy) + (dz * dz) )
        if (dist < this.options.maxDistance) {
          let lineColor
          let alpha = (( 1.0 - (dist / this.options.maxDistance) ) * 2)
          alpha = alpha.clamp(0, 1)
          if (this.blending === 'additive') {
            lineColor = new THREE.Color(0x000000).lerp(diffColor, alpha)
          } else {
            lineColor = bgColor.clone().lerp(color, alpha)
          }
          // if @blending == 'subtractive'
          //   lineColor = new THREE.Color(0x000000).lerp(diffColor, alpha)

          this.linePositions[ vertexpos++ ] = p.position.x
          this.linePositions[ vertexpos++ ] = p.position.y
          this.linePositions[ vertexpos++ ] = p.position.z
          this.linePositions[ vertexpos++ ] = p2.position.x
          this.linePositions[ vertexpos++ ] = p2.position.y
          this.linePositions[ vertexpos++ ] = p2.position.z

          this.lineColors[ colorpos++ ] = lineColor.r
          this.lineColors[ colorpos++ ] = lineColor.g
          this.lineColors[ colorpos++ ] = lineColor.b
          this.lineColors[ colorpos++ ] = lineColor.r
          this.lineColors[ colorpos++ ] = lineColor.g
          this.lineColors[ colorpos++ ] = lineColor.b

          numConnected++
        }
      }
    }
    this.linesMesh.geometry.setDrawRange( 0, numConnected * 2 )
    this.linesMesh.geometry.attributes.position.needsUpdate = true
    this.linesMesh.geometry.attributes.color.needsUpdate = true
    // @pointCloud.geometry.attributes.position.needsUpdate = true

    // Update other colors
    this.sphere.material.color.set(color)
    this.linesMesh2.material.color.set(color2)
    this.linesMesh3.material.color.set(color2)

    return this.t * 0.001
  }
    // @cont.rotation.x += Math.sin(t) * 0.0001
    // @cont.rotation.z += Math.cos(t) * 0.00007


  onMouseMove(x,y) {
    const c = this.camera
    if (!c.oy) {
      c.oy = c.position.y
      c.ox = c.position.x
      c.oz = c.position.z
    }
    const ang = Math.atan2(c.oz, c.ox)
    const dist = Math.sqrt((c.oz*c.oz) + (c.ox*c.ox))
    const tAng = ang + ((x-0.5) * 1.5 * (this.options.mouseCoeffX || 1))
    c.tz = dist * Math.sin(tAng)
    c.tx = dist * Math.cos(tAng)
    c.ty = c.oy + ((y-0.5) * 80 * (this.options.mouseCoeffY || 1))

    if (!this.rayCaster) {
      // this.rayCaster = new THREE.Raycaster()
    }
    this.rcMouseX = (x * 2) - 1
    this.rcMouseY = (- x * 2) + 1
  }

  onRestart() {
    this.scene.remove( this.linesMesh )
    this.points = []
  }
}
Effect.initClass()
export default VANTA.register('GLOBE', Effect)
