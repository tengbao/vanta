import ShaderBase, {VANTA} from './_shaderBase.js'

const win = typeof window == 'object'
let THREE = win && window.THREE

class Halo extends ShaderBase {
  getDefaultOptions() {
    return {
      baseColor: 0x001a59,
      color2: 0xf2e735,
      backgroundColor: 0x131a43,
      amplitudeFactor: 1.0,
      ringFactor: 1.0,
      rotationFactor: 1.0,
      xOffset: 0,
      yOffset: 0,
      size: 1.0,
      speed: 1.0,
      mouseEase: true,
      // scaleMobile: window.devicePixelRatio,
      // scale: window.devicePixelRatio,
      scaleMobile: 1,
      scale: 1,
    }
  }

  onInit() {
    const pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat }
    const ww = this.width * window.devicePixelRatio / this.scale
    const hh = this.height * window.devicePixelRatio / this.scale
    this.bufferTarget = new THREE.WebGLRenderTarget( ww, hh, pars )
    this.bufferFeedback = new THREE.WebGLRenderTarget( ww, hh, pars )
  }
  initBasicShader(fragmentShader, vertexShader) {
    super.initBasicShader(fragmentShader, vertexShader)
    this.uniforms.iBuffer = {
      type: 't',
      value: this.bufferTarget.texture,
    }
  }
  onUpdate() {
    this.uniforms.iBuffer.value = this.bufferFeedback.texture

    const renderer = this.renderer
    renderer.setRenderTarget( this.bufferTarget )
    // renderer.clear()
    renderer.render( this.scene, this.camera )
    renderer.setRenderTarget( null )
    renderer.clear()

    // Swap, to prevent shader using the same input as output
    let temp = this.bufferTarget
    this.bufferTarget = this.bufferFeedback
    this.bufferFeedback = temp
  }
  onResize() {
    if (this.bufferTarget) {
      const ww = this.width * window.devicePixelRatio / this.scale
      const hh = this.height * window.devicePixelRatio / this.scale
      this.bufferTarget.setSize( ww, hh )
      this.bufferFeedback.setSize( ww, hh )
    }
  }
  onDestroy() {
    this.bufferTarget = null
    this.bufferFeedback = null
  }
}
export default VANTA.register('HALO', Halo)

Halo.prototype.fragmentShader = `\
uniform vec2 iResolution;
uniform float iDpr;
uniform vec2 iMouse;
uniform float iTime;

uniform float xOffset;
uniform float yOffset;
uniform vec3 baseColor;
uniform vec3 color2;
uniform vec3 backgroundColor;
uniform float size;
uniform float shape;
uniform float ringFactor;
uniform float rotationFactor;
uniform float amplitudeFactor;

uniform sampler2D iBuffer;
uniform sampler2D iTex;
const float PI = 3.14159265359;

// float length2(vec2 p) { return dot(p, p); }

// float noise(vec2 p){
//   return fract(sin(fract(sin(p.x) * (43.13311)) + p.y) * 31.0011);
// }

// float worley(vec2 p) {
//     float d = 1e30;
//     for (int xo = -1; xo <= 1; ++xo) {
//         for (int yo = -1; yo <= 1; ++yo) {
//             vec2 tp = floor(p) + vec2(xo, yo);
//             d = min(d, length2(p - tp - vec2(noise(tp))));
//         }
//     }
//     vec2 uv = gl_FragCoord.xy / iResolution.xy;
//     float timeOffset =  0.15 * sin(iTime * 2.0 + 10.0*(uv.x - uv.y));
//     return 3.0*exp(-4.0*abs(2.0*d - 1.0 + timeOffset));
// }

// float fworley(vec2 p) {
//     return sqrt(
//     1.1 * // light
//     worley(p*10. + .3 + iTime*.0525) *
//     sqrt(worley(p * 50. / size + 0.1 + iTime * -0.75)) *
//     4.1 *
//     sqrt(sqrt(worley(p * -1. + 9.3))));
// }

vec4 j2hue(float c) {
  return .5+.5*cos(6.28*c+vec4(0,-2.1,2.1,0));
}

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

vec2 sincos( float x ){return vec2(sin(x), cos(x));}
vec2 rotate2d(vec2 uv, float phi){vec2 t = sincos(phi); return vec2(uv.x*t.y-uv.y*t.x, uv.x*t.x+uv.y*t.y);}
vec3 rotate3d(vec3 p, vec3 v, float phi){ v = normalize(v); vec2 t = sincos(-phi); float s = t.x, c = t.y, x =-v.x, y =-v.y, z =-v.z; mat4 M = mat4(x*x*(1.-c)+c,x*y*(1.-c)-z*s,x*z*(1.-c)+y*s,0.,y*x*(1.-c)+z*s,y*y*(1.-c)+c,y*z*(1.-c)-x*s,0.,z*x*(1.-c)-y*s,z*y*(1.-c)+x*s,z*z*(1.-c)+c,0.,0.,0.,0.,1.);return (vec4(p,1.)*M).xyz;}

// Classic Perlin 3D Noise
// by Stefan Gustavson
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
float p3d(vec3 P){
  vec3 Pi0 = floor(P); // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 / 7.0;
  vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 / 7.0;
  vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}


void main() {
  vec2 res2 = iResolution.xy * iDpr;
  vec2 pixel = vec2(gl_FragCoord.xy - 0.5 * res2) / res2.y; // center-origin pixel coord
  pixel.x -= xOffset * res2.x / res2.y;
  pixel.y -= yOffset;

  vec2 uv = gl_FragCoord.xy / res2; // 0 to 1

  // float nn1 = snoise(uv * 0.25 + iTime * 0.005 + mixedColor.b * 0.01) * 0.1;
  // float nn2 = snoise(uv * 0.25 + iTime * 0.005 + mixedColor.b * 0.01 + 1000.) * 0.1;
  // uv += vec2(nn1, nn2);

  // PERLIN DISTORTION
  // float noiseScale = 10.;
  // float timeScale = 0.5;
  // uv += vec2( p3d(vec3(uv * noiseScale, iTime * timeScale)), p3d(vec3(1000. + uv * noiseScale , iTime * timeScale)) ) * 0.001;

  // uv = rotate2d(uv, 0.001);
  // pixel = rotate2d(pixel, 0.001);

  vec2 mouse2 = (iMouse * iDpr / res2 - 0.5) * vec2(1.,-1.);
  vec2 uvBig = (uv - 0.5) * 0.996 + 0.5;

  vec4 oldImage = texture2D(iBuffer, uv);
  vec3 mixedColor = oldImage.rgb - backgroundColor;

  // float spinDist = 0.002 + 0.002 * sin(iTime * 0.4);
  float cropDist = 0.01;
  float cropXOffset = 0.2;
  float cropYOffset = 0.2;
  // float cropXOffset = 0.4 + 0.1 * sin(iTime * 0.4);
  // float cropYOffset = 0.4 + 0.1 * cos(iTime * 0.6);

  vec2 offset = uv + vec2((mixedColor.g - cropXOffset) * cropDist, (mixedColor.r - cropYOffset) * cropDist);

  // float nn = snoise(uv * 10.) * 0.001;
  // offset += nn;

  float spinDist = 0.001;
  float spinSpeed = 0.2 + 0.15 * cos(iTime * 0.5);
  float timeFrac = mod(iTime, 6.5);
  vec2 offset2 = uvBig + vec2(cos(timeFrac * spinSpeed) * spinDist, sin(timeFrac * spinSpeed) * spinDist);

  mixedColor = texture2D(iBuffer, offset).rgb * 0.4
    + texture2D(iBuffer, offset2).rgb * 0.6
    - backgroundColor;


  // mixedColor *= .875;
  float fadeAmt = 0.0015; // fade this amount each frame // 0.002
  mixedColor = (mixedColor - fadeAmt) * .995;

  // float nn = snoise(uvBig * 10.) * 20.;
  // mixedColor *= clamp(nn, 0.98, 1.0);

  vec4 spectrum = abs( abs( .95*atan(uv.x, uv.y) -vec4(0,2,4,0) ) -3. )-1.;
  float angle = atan(pixel.x, pixel.y);
  float dist = length(pixel - mouse2*0.15) * 8. + sin(iTime) * .01;

  // mixedColor *= pow(1.-dist*0.002, 2.);


  // Flowery shapes
  // float edge = abs(dist * 0.5);
  float flowerPeaks = .05 * amplitudeFactor * size;
  float flowerPetals = 7.;
  float edge = abs((dist + sin(angle * flowerPetals + iTime * 0.5) * sin(iTime * 1.5) * flowerPeaks) * 0.65 / size);
  // float edge = abs((dist + sin(angle * 4. + iTime * 2.) * sin(iTime * 3.) * 0.75) * 1.);

  // vec4 rainbow = abs( abs( .95*mod(iTime * 1., 2. * PI) - vec4(0,2,4,0) ) -3. )-1.;
  // vec4 rainbow = vec4(0,2,4,0);

  float colorChangeSpeed = 0.75 + 0.05 * sin(iTime) * 1.5;
  float rainbowInput = timeFrac * colorChangeSpeed;
  // NOISE!
  // float nn = snoise(uv * 0.25 + iTime * 0.005 + mixedColor.b * 0.01) * 20.;
  // rainbowInput += nn;

  float brightness = 0.7;
  vec4 rainbow = sqrt(j2hue(cos(rainbowInput))) + vec4(baseColor,0) - 1.0 + brightness;
  float factor = smoothstep(1., .9, edge) * pow(edge, 2.);
  vec3 color = rainbow.rgb * smoothstep(1., .9, edge) * pow(edge, 20.);
  vec4 ring = vec4(
    backgroundColor + clamp( mixedColor + color, 0., 1.)
    , 1.0);

  // float t = fworley(uv * u_resolution.xy / 1500.0);
  // t *= exp(-length2(abs(0.7*uv - 1.0)));
  // float tExp = pow(t, 2. - t);
  // vec3 c1 = color1 * (1.0 - t);
  // vec3 c2 = color2 * tExp;
  // vec4 cells = vec4(mixedColor * 0.25, 1.) + vec4(pow(t, 1.0 - t) * (c1 + c2), 1.0);
  // gl_FragColor = clamp(ring + cells * 0.5, 0.0, 1.0);

  // float nn = snoise(uv * 10.) * 0.01; // creepy!
  gl_FragColor = ring;
}
`
