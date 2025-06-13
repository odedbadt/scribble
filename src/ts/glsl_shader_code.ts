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
  if (rgba[3] > 0.0) {
    gl_FragColor = vec4(rgba[0],rgba[1],rgba[2],1.0)/rgba[3];
  } else {
    gl_FragColor = rgba;
  }
}
`
