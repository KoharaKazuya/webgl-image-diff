// <https://yomotsu.net/blog/2013/08/08/2013-08-4-blendmode-in-webgl.html>
// を参考に実装。

const canvas = document.querySelector("#glCanvas");
const gl = canvas.getContext("webgl");
gl.viewportWidth = canvas.width;
gl.viewportHeight = canvas.height;
gl.clearColor(0.0, 0.0, 0.0, 0.0);
gl.clearDepth(1.0);
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL);
gl.enable(gl.CULL_FACE);

const VSSource = `
attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main() {
  gl_Position = vec4( aPosition, 1.0 );
  vTexCoord = aTexCoord;
}
`;

const FSSource = `
precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D uSampler0;
uniform sampler2D uSampler1;
uniform float uThreshold;

vec4 blend ( vec4 source, vec4 dist ) {
  if ( length( source.rgb - dist.rgb ) > uThreshold ) {
    return vec4( 1.0, 0.0, 0.0, 1.0 );
  } else {
    vec4 mid = ( source + dist ) / 2.0;
    return vec4( mid.rgb, mid.a * 0.5 );
  }
}

void main() {
  vec4 source = texture2D( uSampler0, vTexCoord );
  vec4 dist   = texture2D( uSampler1, vTexCoord );
  gl_FragColor = clamp( blend( source, dist ), 0.0, 1.0 );
}
`;

const VS = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(VS, VSSource);
gl.compileShader(VS);

const FS = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(FS, FSSource);
gl.compileShader(FS);

const program = gl.createProgram();
gl.attachShader(program, VS);
gl.attachShader(program, FS);
gl.linkProgram(program);
gl.useProgram(program);
gl.program = program;

const aPositionLocation = gl.getAttribLocation(program, "aPosition");
gl.enableVertexAttribArray(aPositionLocation);

const aTexCoordLocation = gl.getAttribLocation(program, "aTexCoord");
gl.enableVertexAttribArray(aTexCoordLocation);

const uSampler0Location = gl.getUniformLocation(program, "uSampler0");
const uSampler1Location = gl.getUniformLocation(program, "uSampler1");
const uThreshold = gl.getUniformLocation(program, "uThreshold");

const vertices = new Float32Array([
  -1.0, 1.0, 0.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, -1.0, 0.0,
]);
const vertBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

const textureCoords = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0];
const texCoordBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);

const index = [1, 2, 3, 2, 1, 0];
const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(index), gl.STATIC_DRAW);

export function resize(width, height) {
  canvas.width = width;
  canvas.height = height;
  gl.viewportWidth = width;
  gl.viewportHeight = height;
}

export async function diff(sourceImage, distImage, threshold) {
  // textures
  const texture0 = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture0);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    sourceImage
  );
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);

  const texture1 = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture1);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    distImage
  );
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);

  // draw
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
  gl.vertexAttribPointer(aPositionLocation, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.vertexAttribPointer(aTexCoordLocation, 2, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture0);
  gl.uniform1i(uSampler0Location, 0);

  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texture1);
  gl.uniform1i(uSampler1Location, 1);

  gl.uniform1f(uThreshold, threshold);

  gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0);
}
