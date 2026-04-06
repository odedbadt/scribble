export const VERTEX_SHADER_CODE = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`
export const FRAGMENT_SHADER_CODE = `
varying vec2 vUv;
uniform sampler2D uTexture;
void main() {
  vec4 rgba = texture2D(uTexture, vUv);
  gl_FragColor = rgba;
}
`
/** Fragment shader that generates an 8-px grey checkerboard pattern.
 *  uDocSize must be set to (canvas_width, canvas_height) so pixel coordinates are exact. */
export const CHECKER_FRAGMENT_SHADER_CODE = `
varying vec2 vUv;
uniform vec2 uDocSize;
void main() {
  vec2 pos = vUv * uDocSize;
  float tile = 8.0;
  float checker = mod(floor(pos.x / tile) + floor(pos.y / tile), 2.0);
  float c = (checker < 1.0) ? (180.0 / 255.0) : (220.0 / 255.0);
  gl_FragColor = vec4(c, c, c, 1.0);
}
`
