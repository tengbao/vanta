import ShaderBase, {VANTA} from './_shaderBase.js'

class Effect extends ShaderBase {}
export default VANTA.register('CELLS', Effect)

Effect.prototype.defaultOptions = {
  color1: 0x8c8c,
  color2: 0xf2e735,
  backgroundColor: 0xd7ff8f,
  amplitudeFactor: 1.0,
  ringFactor: 1.0,
  rotationFactor: 1.0,
  size: 1.5,
  speed: 1.0,
  scaleMobile: 3,
}

Effect.prototype.fragmentShader = `\
uniform vec2 iResolution;
uniform vec2 iMouse;
uniform float iTime;

uniform float blurFactor;
uniform vec3 color1;
uniform vec3 color2;
uniform vec3 backgroundColor;
uniform float size;
uniform float amplitudeFactor;
uniform float ringFactor;
uniform float rotationFactor;

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
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    float timeOffset =  0.15 * sin(iTime * 2.0 + 10.0*(uv.x - uv.y));
    return 3.0*exp(-4.0*abs(2.0*d - 1.0 + timeOffset));
}

float fworley(vec2 p) {
    return sqrt(sqrt(sqrt(
    1.1 * // light
    worley(p*5. + .3 + iTime*.0525) *
    sqrt(worley(p * 50. / size + 0.3 + iTime * -0.15)) *
    sqrt(sqrt(worley(p * -10. + 9.3))))));
}

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    float t = fworley(uv * iResolution.xy / 1500.0);
    t *= exp(-length2(abs(0.7*uv - 1.0)));

    float tExp = pow(t, 0.5 - t);
    vec3 c1 = color1 * (1.0 - t);
    vec3 c2 = color2 * tExp;

    gl_FragColor = vec4(pow(t, 1.0 - t) * (c1 + c2), 1.0);
}
`
