import ShaderBase, {VANTA} from './_shaderBase.js'

class Effect extends ShaderBase {}
export default VANTA.register('CLOUDS', Effect)

Effect.prototype.defaultOptions = {
  backgroundColor: 0xffffff,
  skyColor: 0x68b8d7, // 0x99b5bf,
  cloudColor: 0xadc1de,
  cloudShadowColor: 0x183550,
  sunColor: 0xff9919, // 0x1a9eaa
  sunGlareColor: 0xff6633,
  sunlightColor: 0xff9933, // 0x1a9eaa
  scale: 3,
  scaleMobile: 12,
  speed: 1,
  mouseEase: true,
}

Effect.prototype.fragmentShader = `\
uniform vec2 iResolution;
uniform vec2 iMouse;
uniform float iTime;
uniform sampler2D iTex;

uniform float speed;
uniform vec3 skyColor;
uniform vec3 cloudColor;
uniform vec3 cloudShadowColor;
uniform vec3 sunColor;
uniform vec3 sunlightColor;
uniform vec3 sunGlareColor;
uniform vec3 backgroundColor;

// uniform vec4      iMouse;                // mouse pixel coords. xy: current (if MLB down), zw: click
// uniform samplerXX iChannel0..3;          // input channel. XX = 2D/Cube


// Volumetric clouds. It performs level of detail (LOD) for faster rendering
float iqhash( float n ){
    return fract(sin(n)*3758.5453);
    // return fract(n * (n-1.203) * (n-2.3) / 43758.5453);
}

float noise( vec3 x ){
    // The noise function returns a value in the range -1.0f -> 1.0f
    vec3 p = floor(x);
    vec3 f = fract(x);
    f       = f*f*(3.0-2.0*f);
    float n = p.x + p.y*57.0 + 113.0*p.z;
    return mix(mix(mix( iqhash(n+0.0  ), iqhash(n+1.0  ),f.x),
                   mix( iqhash(n+57.0 ), iqhash(n+58.0 ),f.x),f.y),
               mix(mix( iqhash(n+113.0), iqhash(n+114.0),f.x),
                   mix( iqhash(n+170.0), iqhash(n+171.0),f.x),f.y),f.z);
}

const float constantTime = 1000.;
float map5( in vec3 p ){
    vec3 speed1 = vec3(0.5,0.01,1.0) * 0.5 * speed;
    vec3 q = p - speed1*(iTime + constantTime);
    float f;
    f  = 0.50000*noise( q ); q = q*2.02;
    f += 0.25000*noise( q ); q = q*2.03;
    f += 0.12500*noise( q ); q = q*2.01;
    f += 0.06250*noise( q ); q = q*2.02;
    f += 0.03125*noise( q );
    return clamp( 1.5 - p.y - 2.0 + 1.75*f, 0.0, 1.0 );
}
float map4( in vec3 p ){
    vec3 speed1 = vec3(0.5,0.01,1.0) * 0.5 * speed;
    vec3 q = p - speed1*(iTime + constantTime);
    float f;
    f  = 0.50000*noise( q ); q = q*2.02;
    f += 0.25000*noise( q ); q = q*2.03;
    f += 0.12500*noise( q ); q = q*2.01;
    f += 0.06250*noise( q );
    return clamp( 1.5 - p.y - 2.0 + 1.75*f, 0.0, 1.0 );
}
float map3( in vec3 p ){
    vec3 speed1 = vec3(0.5,0.01,1.0) * 0.5 * speed;
    vec3 q = p - speed1*(iTime + constantTime);
    float f;
    f  = 0.50000*noise( q ); q = q*2.02;
    f += 0.25000*noise( q ); q = q*2.03;
    f += 0.12500*noise( q );
    return clamp( 1.5 - p.y - 2.0 + 1.75*f, 0.0, 1.0 );
}
float map2( in vec3 p ){
    vec3 speed1 = vec3(0.5,0.01,1.0) * 0.5 * speed;
    vec3 q = p - speed1*(iTime + constantTime);
    float f;
    f  = 0.50000*noise( q ); q = q*2.02;
    f += 0.25000*noise( q );
    return clamp( 1.5 - p.y - 2.0 + 1.75*f, 0.0, 1.0 );
}

vec3 sundir = normalize( vec3(-1.0,0.0,-1.0) );

vec4 integrate( in vec4 sum, in float dif, in float den, in vec3 bgcol, in float t ){
    // lighting
    vec3 lin = cloudColor*1.4 + sunlightColor*dif;
    vec4 col = vec4( mix( vec3(1.0,0.95,0.8), cloudShadowColor, den ), den );
    col.xyz *= lin;
    col.xyz = mix( col.xyz, bgcol, 1.0-exp(-0.003*t*t) );
    // front to back blending
    col.a *= 0.4;
    col.rgb *= col.a;
    return sum + col*(1.0-sum.a);
}

#define MARCH(STEPS,MAPLOD) for(int i=0; i<STEPS; i++) { vec3  pos = ro + t*rd; if( pos.y<-3.0 || pos.y>2.0 || sum.a > 0.99 ) break; float den = MAPLOD( pos ); if( den>0.01 ) { float dif = clamp((den - MAPLOD(pos+0.3*sundir))/0.6, 0.0, 1.0 ); sum = integrate( sum, dif, den, bgcol, t ); } t += max(0.075,0.02*t); }

vec4 raymarch( in vec3 ro, in vec3 rd, in vec3 bgcol, in ivec2 px ){
    vec4 sum = vec4(0.0);

    float t = 0.0;

    MARCH(20,map5);
    MARCH(25,map4);
    MARCH(30,map3);
    MARCH(40,map2);

    return clamp( sum, 0.0, 1.0 );
}

mat3 setCamera( in vec3 ro, in vec3 ta, float cr ){
    vec3 cw = normalize(ta-ro);
    vec3 cp = vec3(sin(cr), cos(cr),0.0);
    vec3 cu = normalize( cross(cw,cp) );
    vec3 cv = normalize( cross(cu,cw) );
    return mat3( cu, cv, cw );
}

vec4 render( in vec3 ro, in vec3 rd, in ivec2 px ){
    // background sky
    float sun = clamp( dot(sundir,rd), 0.0, 1.0 );
    vec3 col = skyColor - rd.y*0.2*vec3(1.0,0.5,1.0) + 0.15*0.5;
    col += 0.2*sunColor*pow( sun, 8.0 );

    // clouds
    vec4 res = raymarch( ro, rd, col, px );
    col = col*(1.0-res.w) + res.xyz;

    // sun glare
    col += 0.2*sunGlareColor*pow( sun, 3.0 );

    return vec4( col, 1.0 );
}

void main(){
    vec2 p = (-iResolution.xy + 2.0*gl_FragCoord.xy)/ iResolution.y;

    vec2 m = iMouse.xy/iResolution.xy;
    m.y = (1.0 - m.y) * 0.33 + 0.28; // camera height

    m.x *= 0.25;
    m.x += sin(iTime * 0.1 + 3.1415) * 0.25 + 0.25;

    // camera
    vec3 ro = 4.0*normalize(vec3(sin(3.0*m.x), 0.4*m.y, cos(3.0*m.x))); // origin
    vec3 ta = vec3(0.0, -1.0, 0.0);
    mat3 ca = setCamera( ro, ta, 0.0 );
    // ray
    vec3 rd = ca * normalize( vec3(p.xy,1.5));

    gl_FragColor = render( ro, rd, ivec2(gl_FragCoord-0.5) );
}
`
