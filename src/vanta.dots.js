import VantaBase, {VANTA} from './_base.js'
import {rn, ri, sample, mobileCheck} from './helpers.js'

const win = typeof window == 'object'
let THREE = win && window.THREE

class Effect extends VantaBase {
  static initClass() {
    this.prototype.defaultOptions = {
      color: 0xff8820,
      color2: 0xff8820,
      backgroundColor: 0x222222,
      size: 3,
      spacing: 35,
      showLines: true,
    };
  }

  onInit() {
    var camera = this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 5000)
    camera.position.x = 0
    camera.position.y = 250
    camera.position.z = 50
    camera.tx = 0
    camera.ty = 50
    camera.tz = 350
    camera.lookAt(0,0,0)
    this.scene.add(camera)

    var starsGeometry = this.starsGeometry = new THREE.BufferGeometry()
    var i,j,k,l,star,starsMaterial,starField
    var space = this.options.spacing
    const points = []

    for (i = k = -30; k <= 30; i = ++k) {
      for (j = l = -30; l <= 30; j = ++l) {
        star = new THREE.Vector3()
        star.x = i * space + space/2
        star.y = rn(0, 5) - 150
        star.z = j * space + space/2
        points.push(star)
      }
    }
    starsGeometry.setFromPoints(points)


    starsMaterial = new THREE.PointsMaterial({
      color: this.options.color,
      size: this.options.size
    });
    starField = this.starField = new THREE.Points(starsGeometry, starsMaterial)
    this.scene.add(starField)

    if (this.options.showLines) {
      var material = new THREE.LineBasicMaterial( { color: this.options.color2 } );
      var linesGeo = new THREE.BufferGeometry()
      const points = []
      for (i = 0; i < 200; i ++) {
        var f1 = rn(40,60)
        var f2 = f1 + rn(12,20)
        // https://math.stackexchange.com/questions/1585975/how-to-generate-random-points-on-a-sphere
        var z = rn(-1,1)
        var r = Math.sqrt(1 - z*z)
        var theta = rn(0, Math.PI * 2)
        var y = Math.sin(theta) * r
        var x = Math.cos(theta) * r
        points.push(new THREE.Vector3( x*f1, y*f1, z*f1) )
        points.push(new THREE.Vector3( x*f2, y*f2, z*f2) )
      }
      linesGeo.setFromPoints(points)
      this.linesMesh = new THREE.LineSegments( linesGeo, material )
      this.scene.add(this.linesMesh)
    }

    // this.geometry = new THREE.BoxGeometry( 10, 10, 10 );
    // this.material = new THREE.MeshLambertMaterial({
    //   color: this.options.color,
    //   emissive: this.options.color,
    //   emissiveIntensity: 0.75
    // });
    // this.cube = new THREE.Mesh( this.geometry, this.material );
    // this.scene.add(this.cube);

    // const c = this.camera = new THREE.PerspectiveCamera( 75, this.width/this.height, 0.1, 1000 );
    // c.position.z = 30;
    // this.scene.add(c);

    // const light = new THREE.HemisphereLight( 0xffffff, this.options.backgroundColor , 1 );
    // this.scene.add(light);
  }

  onUpdate() {
    const starsGeometry = this.starsGeometry
    const starField = this.starField
    for (var j = 0; j < starsGeometry.attributes.position.array.length; j+=3) {
      const x = starsGeometry.attributes.position.array[j]
      const y = starsGeometry.attributes.position.array[j+1]
      const z = starsGeometry.attributes.position.array[j+2]
      // var i = starsGeometry.vertices[j]
      const newY = y + 0.1 * Math.sin(z*0.02 + x*0.015 + this.t*0.02)
      starsGeometry.attributes.position.array[j+1] = newY
    }

    starsGeometry.attributes.position.setUsage(THREE.DynamicDrawUsage)
    starsGeometry.computeVertexNormals()
    starsGeometry.attributes.position.needsUpdate = true

    const c = this.camera
    const rate = 0.003
    c.position.x += (c.tx - c.position.x) * rate
    c.position.y += (c.ty - c.position.y) * rate
    c.position.z += (c.tz - c.position.z) * rate
    c.lookAt(0,0,0)

    if (this.linesMesh) {
      this.linesMesh.rotation.z += 0.002
      this.linesMesh.rotation.x += 0.0008
      this.linesMesh.rotation.y += 0.0005
      // starField.rotation.y += (this.mouseX * 0.1 - starField.rotation.y) * 0.01
    }
  }

  onMouseMove(x,y) {
    this.camera.tx = (x - 0.5) * 100 // -50 to 50
    this.camera.ty = 50 + y * 50 // 50 to 100
  }

  onRestart() {
    this.scene.remove( this.starField )
  }
}
Effect.initClass()
export default VANTA.register('DOTS', Effect)
