import VantaBase, {VANTA} from './_base.js'
import {rn, ri, sample, mobileCheck} from './helpers.js'

let THREE = (typeof window == 'object' && window.THREE)

class Rings extends VantaBase {
  static initClass() {
    this.prototype.defaultOptions = {
      backgroundColor: 0x202428,
      color: 0x88ff00
    };

    this.prototype.colors = [
      0xff2255, // red
      0xff1199, // pink
      0xff66cc, // light pink
      0x88ff00, // green
      0x77cc11, // dark gr
      0xffff00, // yellow
      0xff7733, // orange
      0x11ffff, // lightblue
      0x1188dd, // blueeen
      0xffdd22, // yellow
      0x2255cc, // darkblue
      0x79B0BC, // slate
      0x53707B // dark slate
    ];
  }
  constructor(userOptions) {
    THREE = userOptions.THREE || THREE
    super(userOptions)
  }

  // colors: [
  //   0x3693D6
  //   0x01E7D0
  //   0x83EBF3
  //   0x9DC5F4
  // ]
  material(color) {
    return new THREE.MeshLambertMaterial({
      color})
  }
  genRing(color, radius, width, startAng, ang, y, speed) {
    if (startAng == null) { startAng = 0 }
    if (ang == null) { ang = Math.PI*1.4 }
    if (y == null) { y = 0 }
    if (speed == null) { speed = 1 }
    if (!this.rings) { this.rings = [] }

    if (radius < 1) { radius = 1 }
    const extrudeSettings = {
      depth: 0.4,
      bevelEnabled: false,
      steps: 1,
      curveSegments: ~~((64 * ang) / 6.14)
    };
    const shape = new THREE.Shape()
    shape.absarc(0, 0, radius + width, 0, ang, false)
    shape.lineTo(radius * Math.cos(ang), radius * Math.sin(ang))
    shape.absarc(0, 0, radius, ang, 0, true)

    const geo = new THREE.ExtrudeGeometry( shape, extrudeSettings )
    const mat = this.material(color)
    if ((ri(0,1) === 0) || (radius > 60)) {
      mat.transparent = true
      mat.opacity = Math.max((50/radius) + rn(-0.3,0.3), 0.1)
    }

    const mesh = new THREE.Mesh( geo, mat )
    mesh.rotation.x = Math.PI/2
    mesh.rotation.z = startAng
    mesh.position.y = y
    mesh.speed = speed * 0.001
    mesh.receiveShadow = true
    mesh.castShadow = true
    this.rings.push(mesh)
    this.cont.add(mesh)

    // # wireframes
    // if ri(0,1)
    //   thresholdAngle = 10
    //   geo2 = new THREE.EdgesGeometry(geo, thresholdAngle)
    //   mat2 = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 2 } )
    //   mesh.wf = new THREE.LineSegments( geo2, mat2 )
    //   extend mesh.wf.rotation, mesh.rotation
    //   extend mesh.wf.position, mesh.position
    //   @cont.add( mesh.wf )

    // gen child
    if ((radius < 20) && (ang < (Math.PI*1.3)) && ri(0,2)) {
      try {
        this.genRing(sample(this.colors),
          radius + rn(-1,3),
          width + rn(-2,0),
          startAng+ang,
          ang+rn(-0.5,0.5),
          y+rn(-3,1),
          speed
        )
      } catch (error) {}
    }
    return mesh
  }

  onInit() {

    // X: left/right
    // Y: into the screen, out of the screen
    // Z: up/down
    let width
    const { material } = this
    this.cont = new THREE.Group()
    this.cont.position.set(30,0,0)
    this.cont.rotation.x = 0.06667
    this.cont.rotation.z = 0.16667
    this.scene.add(this.cont)

    // color, radius, width, startAng=0, ang=Math.PI*1.4, y=0, speed=1
    // @genRing(0xff2255,50,5)
    // @genRing(0xffdd22,30,10,1,2,10,2)
    // @genRing(0xff8811,25,8,2.5,3,12,3)
    // @genRing(0x88ff00,56,1,null,null,2,2)

    let n = mobileCheck() ? 30 : 60
    for (let i = 0; i < n; i++) {
      let radius
      if (ri(0,3)) {
        radius = rn(2,4) + (rn(1,30) * rn(1,2) * rn(1,2) * rn(1,2))
        if (mobileCheck()) radius *= 0.5
        width = (rn(0,3.5) + rn(0,3.5)) - ri(0, radius / 4) - (radius / 50)
      } else {
        radius = rn(1,3) * rn(2,4)
        width = rn(1,2) * rn(1,2) * rn(1.1,1.5)
      }

      // width = Math.pow(2, ri(0,5)) * 0.1

      const minWidth = Math.pow(2, ri(0,4)) * 0.05;
      if (width < minWidth) { width = minWidth; }


      // PURTPLE TEST
      // radius = rn(1,2) * rn(1,1.5)* rn(1,1.5)* rn(2,2.5)* rn(2,2.5)* rn(2,2.5)

      // radius = rn(1,2) * rn(1,1.5)* rn(1,1.5)
      // width /= 2
      // if width < minWidth then width = minWidth

      this.genRing(sample(this.colors),
        radius, // radius
        width, // width
        rn(0,1000), // startAng
        rn(1,6), // ang
        rn(0, (50/(radius+1)) + 5) + (5/width/(radius+0.5)), // y
        Math.max(-rn(0.5,2), rn(1, 50-(radius/2)) - (radius/2)) * 0.25 // speed
      );
    }


    // geometry = new THREE.SphereGeometry( 5, 32, 32 )
    // sphere = new THREE.Mesh( geometry, material )
    // @cont.add( sphere )

    // # RingGeometry(innerRadius, outerRadius, thetaSegments, phiSegments, thetaStart, thetaLength)
    // geo = new THREE.RingGeometry( 40, 50, 128, 1, 0, 5 )
    // shape = new THREE.Mesh( geo, material )
    // mesh = new THREE.ExtrudeGeometry( geo, extrudeSettings )
    // scene.add( mesh )
    // @cont.add(shape)


    // # CSG
    // @cylinderGeometry = new THREE.CylinderGeometry(50, 50, height, 128, 1, false)
    // @cylinderMesh = new THREE.Mesh(@cylinderGeometry, material)
    // @cylinderMesh.position.set(0, 0, 0)

    // @cBsp = new ThreeBSP(@cylinderMesh)
    // geo = new THREE.CylinderGeometry(40, 40, height, 128, 1, false, 0, 5)
    // mesh = new THREE.Mesh(geo, material)
    // @subBsp = new ThreeBSP(mesh)

    // @res1 = @cBsp.subtract(@subBsp )
    // @result = @res1.toMesh( material )
    // @result.geometry.computeVertexNormals()
    // @result.position.set(0,25,0)
    // @cont.add(@result)
    // @cont.add(@cylinderMesh)

    // PerspectiveCamera( fov, aspect, near, far )
    this.camera = new THREE.PerspectiveCamera(
      25,
      this.width / this.height,
      10, 10000);
    this.camera.position.set(0, 150, 200);
    this.scene.add( this.camera );

    const ambience = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambience);

    this.pointLight = new THREE.PointLight(0xFFFFFF, 0.5);
    this.pointLight.position.set(0, 150, 200);
    this.scene.add( this.pointLight );

    this.spot = new THREE.SpotLight(0xFFFFFF, 1);
    this.spot.position.set(-15, 50, 100);
    this.spot.penumbra = 1;
    this.spot.angle = 0.5;
    this.spot.decay = 1;
    this.spot.distance = 300;
    this.spot.target = this.cont;

    // @spot.castShadow = false
    // @spot.shadow.mapSize.width = 4096
    // @spot.shadow.mapSize.height = 4096
    // @spot.shadow.camera.near = 10
    // @spot.shadow.camera.far = 200
    // @spot.shadow.radius = 2
    return this.scene.add(this.spot);
  }

    // @helper = new THREE.SpotLightHelper( @spot )
    // @scene.add( @helper )

    // @controls = new THREE.OrbitControls(@camera, @renderer.domElement)
    // extend @controls, ORBITCONTROLS

    // @renderer.shadowMap.enabled = true
    // @renderer.shadowMap.type = THREE.PCFSoftShadowMap
    // @renderer.gammaInput = true;
    // @renderer.gammaOutput = true;

  onUpdate() {
    let diff;
    if (this.helper != null) {
      this.helper.update();
    }
    if (this.controls != null) {
      this.controls.update();
    }

    const c = this.camera;
    if (Math.abs(c.tx - c.position.x) > 0.01) {
      diff = c.tx - c.position.x;
      c.position.x += diff * 0.02;
    }
    if (Math.abs(c.ty - c.position.y) > 0.01) {
      diff = c.ty - c.position.y;
      c.position.y += diff * 0.02;
    }
    c.lookAt( new THREE.Vector3( 0, 25, 7 ) );
    c.near = Math.max((c.position.z * 0.5) - 20, 1); // Fix flickering
    c.updateProjectionMatrix();

    for (let r of Array.from((this.rings != null ? this.rings : []))) {
      r.rotation.z += r.speed;
    }
      // r.wf?.geometry.fromGeometry(r.geometry)
      // r.wf?.geometry.computeFaceNormals()

    const t = this.t * 0.001;
    this.cont.rotation.x += Math.sin(t) * 0.0001;
    return this.cont.rotation.z += Math.cos(t) * 0.00007;
  }


  onMouseMove(x,y) {
    const c = this.camera
    if (!c.oy) {
      c.oy = c.position.y
      c.ox = c.position.x
    }
    c.tx = c.ox + ((x-0.5) * 50)
    return c.ty = c.oy - (y * 50)
  }
}
Rings.initClass()
export default VANTA.register('RINGS', Rings)