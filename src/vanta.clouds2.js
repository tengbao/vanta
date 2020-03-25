import ShaderBase, {VANTA} from './_shaderBase.js'

class Effect extends ShaderBase {}
export default VANTA.register('CLOUDS2', Effect)

Effect.prototype.defaultOptions = {
  backgroundColor: 0x000000,
  skyColor: 0x5ca6ca,
  cloudColor: 0x334d80,
  lightColor: 0xffffff,
  speed: 1.0,
  texturePath: "./gallery/noise.png",
  scaleMobile: 4,
}

Effect.prototype.fragmentShader = `\
uniform vec2 iResolution;
uniform vec2 iMouse;
uniform float iTime;
uniform sampler2D iTex;
uniform float speed;
uniform vec3 skyColor;
uniform vec3 cloudColor;
uniform vec3 lightColor;

# define T texture2D(iTex, fract((s*p.zw + ceil(s*p.x)) / 200.0)).y / (s += s) * 4.0

void main(){
    vec2 coord = gl_FragCoord.xy;
    vec4 p, d = vec4(0.8, 0, coord / iResolution.y - 0.65);
    vec3 out1 = skyColor - d.w; // sky gradient
    float s, f, t = 200.0 + sin(dot(coord,coord));
    const float MAX_ITER = 100.0;
    for (float i = 1.0; i <= MAX_ITER; i += 1.0) {
      t -= 2.0; if (t < 0.0) { break; } // march step
      p = 0.05 * t * d;
      p.xz += iTime * 0.50000 * speed; // movement through space
      p.x += sin(iTime * 0.25 * speed) * 0.25;
      s = 2.0;
      f = p.w + 1.0-T-T-T-T;
      // f = p.w + 1.0 - 0.25*noise(p.xyz * 2.0) - 0.25*noise(p.zxy * 2.01) - 0.25*noise(p.yzx * 2.03);
      if (f < 0.0) {
        vec3 cloudColorShading = mix(lightColor, cloudColor, -f);
        out1 = mix(out1, cloudColorShading, -f * 0.4);
      }
    }
    gl_FragColor = vec4(out1, 1.0);
}`