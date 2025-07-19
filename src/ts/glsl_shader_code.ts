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
