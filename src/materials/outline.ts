import type { Engine, Material } from "excalibur";

const outlineShader: string = `#version 300 es
precision mediump float;

uniform float u_time_ms;
uniform sampler2D u_graphic;
uniform vec3 u_outline_color;

in vec2 v_uv;
in vec2 v_screenuv;
out vec4 fragColor;

vec3 hsv2rgb(vec3 c){
  vec4 K=vec4(1.,2./3.,1./3.,3.);
  return c.z*mix(K.xxx,clamp(abs(fract(c.x+K.xyz)*6.-K.w)-K.x, 0., 1.),c.y);
}

void main() {
  const float TAU = 6.28318530;
  const float steps = 4.0; // up/down/left/right pixels
  float radius = 10.0;
  float time_sec = u_time_ms / 1000.;

  // Create a 2-second cycle for fading from red to transparent and back
  float cycleTime = mod(time_sec, 2.0);  // Time normalized to a 2-second cycle
  float fadeAlpha;

  if (cycleTime < 1.0) {
    // First half of the cycle: Fade from red to transparent
    fadeAlpha = smoothstep(0.0, 1.0, cycleTime);  // Fade out
  } else {
    // Second half of the cycle: Fade from transparent to red
    fadeAlpha = smoothstep(0.0, 1.0, 2.0 - cycleTime);  // Fade in
  }

  vec2 aspect = 1.0 / vec2(textureSize(u_graphic, 0));

  for (float i = 0.0; i < TAU; i += TAU / steps) {
    // Sample image in a circular pattern
    vec2 offset = vec2(sin(i), cos(i)) * aspect * radius;
    vec4 col = texture(u_graphic, v_uv + offset);

    // Mix outline with background, apply the fading alpha
    float alpha = smoothstep(0.5, 0.8, col.a);
    fragColor = mix(fragColor, vec4(hsv2rgb(u_outline_color), fadeAlpha), alpha); // apply outline with fading alpha
  }

  // Overlay original texture
  vec4 mat = texture(u_graphic, v_uv);
  float factor = smoothstep(0.5, 0.7, mat.a);
  fragColor = mix(fragColor, mat, factor);
}`;

let outlineMaterial: Material | undefined;

export function createOutlineMaterial(engine: Engine): Material {
  if (!outlineMaterial) {
    outlineMaterial = engine.graphicsContext.createMaterial({
      name: "outline",
      fragmentSource: outlineShader,
    });
  }

  return outlineMaterial;
}
