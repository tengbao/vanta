import ShaderBase, {VANTA} from './_shaderBase.js'

class Effect extends ShaderBase {}
export default VANTA.register('RIPPLE', Effect)

Effect.prototype.defaultOptions = {
  color1: 0x60b25,
  color2: 0xffffff,
  backgroundColor: 0xf6f6f6,
  amplitudeFactor: 1.0,
  ringFactor: 4.0,
  rotationFactor: 0.1,
  speed: 1.0,
  scaleMobile: 4
}

Effect.prototype.fragmentShader = `\
uniform vec2 iResolution;
uniform vec2 iMouse;
uniform float iTime;

uniform float blurFactor;
uniform vec3 color1;
uniform vec3 color2;
uniform vec3 backgroundColor;
uniform float amplitudeFactor;
uniform float ringFactor;
uniform float rotationFactor;

float size = 0.002;

void main( void ) {
    vec2 view = ( gl_FragCoord.xy - iResolution / 2.0 ) / ( iResolution.y / 2.0);
    float time = - iTime + length(view)*8. - 7.0;
    vec4 color = vec4(0);
    vec2 center = vec2(0);
    float accumMix = 0.0;
    float rotationVelocity = 2.0;
    for( int j = 0; j < 20; j++ ) {
        for( int i = 0; i < 20; i++ ) {
            float amplitude = ( cos( time / 10.0 ) + sin(  time /5.0 ) );

            amplitude = amplitude * amplitudeFactor;

            float angle =   sin( float(j) * time * 0.05 * ringFactor) * rotationVelocity + 2.0 * 3.14 * float(i) / 20.0;
            center.x = cos( 7.0 * float(j) / 20.0 * 2.0 * 3.14 ) + sin( time / 4.0) * rotationFactor;
            center.y = sin( 3.0 * float(j) / 20.0 * 2.0 * 3.14 )+ cos( time / 8.0) * rotationFactor;
            vec2 light = center + amplitude * vec2( cos( angle ), sin( angle ));
            // size = sin( time ) * 0.005;
            float l = size / length( view - light );
            accumMix += l * 0.5;
        }
    }
    float accumMix1 = pow(clamp(accumMix * 1.2, 0., 1.15), 1.5); // lowlights
    float accumMix2 = pow(clamp(accumMix1 * 1.2, 0., 1.15), 3.0); // highlights
    vec3 lowlights = mix(backgroundColor, color2, clamp(accumMix1, -0.1, 1.15));
    gl_FragColor = vec4(mix(lowlights, color1, clamp(accumMix2, -0.1, 1.15)), 1);
}
`