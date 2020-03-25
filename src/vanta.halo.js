import ShaderBase, {VANTA} from './_shaderBase.js'

class Halo extends ShaderBase {
  onInit() {
    const pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat }
    this.bufferTarget = new THREE.WebGLRenderTarget( this.width, this.height, pars )
  }
  initBasicShader(fragmentShader, vertexShader) {
    this.uniforms.tColor = {type: 't', value: this.bufferTarget.texture }
    super.initBasicShader(fragmentShader, vertexShader)
  }
  // onUpdate() {
  // }

  afterRender() {
    const renderer = this.renderer
    renderer.clear()
    // render scene into texture
    renderer.setRenderTarget( this.bufferTarget )
    renderer.clear()
    renderer.render( this.scene, this.camera )
    renderer.setRenderTarget( null )
    // this.uniforms['tColor'].value = this.bufferTarget.texture
  }
  onResize() {
    if (this.bufferTarget) {
      this.bufferTarget.setSize( this.width, this.height )
    }
  }
}
export default VANTA.register('HALO', Halo)

Halo.prototype.defaultOptions = {
  color1: 0x8c8c,
  color2: 0xf2e735,
  backgroundColor: 0x0,
  amplitudeFactor: 1.0,
  ringFactor: 1.0,
  rotationFactor: 1.0,
  size: 1.5,
  speed: 1.0,
  scaleMobile: 3,
}

Halo.prototype.fragmentShader = `\
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

uniform float blurFactor;
uniform vec3 color1;
uniform vec3 color2;
uniform vec3 backgroundColor;
uniform float size;
uniform float amplitudeFactor;
uniform float ringFactor;
uniform float rotationFactor;

uniform sampler2D tColor;
uniform sampler2D u_tex;
const float PI = 3.14159265359;


float length2(vec2 p) { return dot(p, p); }

float noise(vec2 p){
    return fract(sin(fract(sin(p.x) * (43.13311)) + p.y) * 31.0011);
}


float worley(vec2 p) {
    float d = 1e30;
    for (int xo = -1; xo <= 1; ++xo) {
        for (int yo = -1; yo <= 1; ++yo) {
            vec2 tp = floor(p) + vec2(xo, yo);
            d = min(d, length2(p - tp - vec2(noise(tp))));
        }
    }
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float timeOffset =  0.15 * sin(u_time * 2.0 + 10.0*(uv.x - uv.y));
    return 3.0*exp(-4.0*abs(2.0*d - 1.0 + timeOffset));
}

float fworley(vec2 p) {
    return sqrt(
    1.1 * // light
    worley(p*10. + .3 + u_time*.0525) *
    sqrt(worley(p * 50. / size + 0.1 + u_time * -0.75)) *
    4.1 *
    sqrt(sqrt(worley(p * -1. + 9.3))));
}

void main() {

    vec2 pixel = vec2(gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    vec4 noise = texture2D(u_tex, uv);
    vec4 oldImage = texture2D(tColor, uv);
    vec3 mixedColor = oldImage.rgb;

    vec2 offset = uv + vec2((mixedColor.g - .2) * 0.01, (mixedColor.r - .2) * 0.01);

    mixedColor = texture2D(tColor, offset).rgb;
    mixedColor *= .995;

    vec4 spectrum = abs( abs( .95*atan(uv.x, uv.y) -vec4(0,2,4,0) ) -3. )-1.;
	float angle = atan(pixel.x, pixel.y);

    float dist = length(pixel) * 2. + sin(u_time) * .2;
    float edge = (dist + sin(angle * 3. + u_time * 10.) * sin(u_time * 3.) * 0.1) * 2.;
    vec4 rainbow = abs( abs( .95*mod(u_time * 2., 2. * PI) -vec4(0,2,4,0) ) -3. )-1.;

    float factor = smoothstep(1., .9, edge) * pow(edge, 30.);
    vec3 color = rainbow.rgb * smoothstep(1., .9, edge) * pow(edge, 30.);

    gl_FragColor = noise + vec4(
      clamp( mixedColor + color, 0., 1.)
      , 1.0);


    // float t = fworley(uv * u_resolution.xy / 1500.0);
    // t *= exp(-length2(abs(0.7*uv - 1.0)));

    // float tExp = pow(t, 2. - t);
    // vec3 c1 = color1 * (1.0 - t);
    // vec3 c2 = color2 * tExp;

    // gl_FragColor = oldImage * 1.0 + vec4(pow(t, 1.0 - t) * (c1 + c2), 1.0);
}
`
