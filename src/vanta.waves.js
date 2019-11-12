import VantaBase, { VANTA } from './_base.js'
import {rn,ri,sample} from './helpers.js'

let THREE = (typeof window == 'object' && window.THREE)

const defaultOptions = {
  color: 0x005588,
  shininess: 30,
  waveHeight: 15,
  waveSpeed: 1,
  zoom: 1
}

class Waves extends VantaBase {
  static initClass() {
    this.prototype.ww = 100;
    this.prototype.hh = 80;
    this.prototype.waveNoise = 4; // Choppiness of water
  }
  constructor(userOptions) {
    THREE = userOptions.THREE || THREE
    super(userOptions)
  }

  getMaterial() {
    const options = {
      color: this.options.color,
      shininess: this.options.shininess,
      flatShading: true,
      vertexColors: THREE.FaceColors, // Allow coloring individual faces
      side: THREE.DoubleSide
    };
    return new THREE.MeshPhongMaterial(options);
  }

  onInit() {
    let i, j;
    const CELLSIZE = 18;
    const material = this.getMaterial();
    const geometry = new THREE.Geometry();

    // Add vertices
    this.gg = [];
    for (i=0; i<=this.ww; i++){
      this.gg[i] = [];
      for (j=0; j<=this.hh; j++){
        const id = geometry.vertices.length;
        const newVertex = new THREE.Vector3(
          (i - (this.ww * 0.5)) * CELLSIZE,
          rn(0, this.waveNoise) - 10,
          ((this.hh * 0.5) - j) * CELLSIZE
        );
        geometry.vertices.push(newVertex);
        this.gg[i][j] = id;
      }
    }

    // Add faces
    // a b
    // c d <-- Looking from the bottom right point
    for (i=1; i<=this.ww; i++){
      for (j=1; j<=this.hh; j++){
        let face1, face2
        const d = this.gg[i][j]
        const b = this.gg[i][j-1]
        const c = this.gg[i-1][j]
        const a = this.gg[i-1][j-1]
        if (ri(0,1)) {
          face1 = new THREE.Face3( a, b, c )
          face2 = new THREE.Face3( b, c, d )
        } else {
          face1 = new THREE.Face3( a, b, d )
          face2 = new THREE.Face3( a, c, d )
        }
        geometry.faces.push( face1, face2 )
      }
    }

    this.plane = new THREE.Mesh(geometry, material);
    this.scene.add(this.plane);

    // WIREFRAME
    // lightColor = 0x55aaee
    // darkColor = 0x225577
    // thresholdAngle = 2
    // geo = new THREE.EdgesGeometry(geometry, thresholdAngle)
    // mat = new THREE.LineBasicMaterial( { color: lightColor, linewidth: 2 } )
    // @wireframe = new THREE.LineSegments( geo, mat )
    // @scene.add( @wireframe )

    // LIGHTS
    const ambience = new THREE.AmbientLight( 0xffffff, 0.9 );
    this.scene.add(ambience);

    const pointLight = new THREE.PointLight( 0xffffff, 0.9 );
    pointLight.position.set(-100,250,-100);
    this.scene.add(pointLight);

    // CAMERA
    this.camera = new THREE.PerspectiveCamera(
      35,
      this.width / this.height,
      50, 10000);

    const xOffset = -10;
    const zOffset = -10;
    this.cameraPosition = new THREE.Vector3( 250+xOffset, 200, 400+zOffset );
    this.cameraTarget = new THREE.Vector3( 150+xOffset, -30, 200+zOffset );
    this.camera.position.copy(this.cameraPosition);
    this.scene.add(this.camera);
  }

  onUpdate() {
    // Update options
    let diff;
    this.plane.material.color.set(this.options.color);
    this.plane.material.shininess = this.options.shininess;
    this.camera.ox = this.cameraPosition.x / this.options.zoom;
    this.camera.oy = this.cameraPosition.y / this.options.zoom;
    this.camera.oz = this.cameraPosition.z / this.options.zoom;

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
    if (Math.abs(c.tz - c.position.z) > 0.01) {
      diff = c.tz - c.position.z;
      c.position.z += diff * 0.02;
    }

    c.lookAt( this.cameraTarget );

    // Fix flickering problems
    // c.near = Math.max((c.position.y * 0.5) - 20, 1);
    // c.updateMatrix();

    // WAVES
    for (let i = 0; i < this.plane.geometry.vertices.length; i++) {
      const v = this.plane.geometry.vertices[i];
      if (!v.oy) { // INIT
        v.oy = v.y;
      } else {
        const s = this.options.waveSpeed;
        const crossChop = Math.sqrt(s) * Math.cos(-v.x - (v.z*0.7)); // + s * (i % 229) / 229 * 5
        const delta = Math.sin((((s*this.t*0.02) - (s*v.x*0.025)) + (s*v.z*0.015) + crossChop));
        const trochoidDelta = Math.pow(delta + 1, 2) / 4;
        v.y = v.oy + (trochoidDelta * this.options.waveHeight);
      }
    }

      // @wireframe.geometry.vertices[i].y = v.y

    this.plane.geometry.dynamic = true;
    this.plane.geometry.computeFaceNormals();
    this.plane.geometry.verticesNeedUpdate = true;
    this.plane.geometry.normalsNeedUpdate = true;

    // @scene.remove( @wireframe )
    // geo = new THREE.EdgesGeometry(@plane.geometry)
    // mat = new THREE.LineBasicMaterial( { color: 0x55aaee, linewidth: 2} )
    // @wireframe = new THREE.LineSegments( geo, mat )
    // @scene.add( @wireframe )

    if (this.wireframe) {
      this.wireframe.geometry.fromGeometry(this.plane.geometry);
      this.wireframe.geometry.computeFaceNormals();
    }
  }

  onMouseMove(x,y) {
    const c = this.camera;
    if (!c.oy) {
      c.oy = c.position.y;
      c.ox = c.position.x;
      c.oz = c.position.z;
    }
    c.tx = c.ox + (((x-0.5) * 100) / this.options.zoom);
    c.ty = c.oy + (((y-0.5) * -100) / this.options.zoom);
    return c.tz = c.oz + (((x-0.5) * -50) / this.options.zoom);
  }
}

Waves.prototype.defaultOptions = defaultOptions
Waves.initClass()
export default VANTA.register('WAVES', Waves)