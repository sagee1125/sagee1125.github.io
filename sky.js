/* Sky background: procedural blue sky with slowly drifting clouds.
 * Fragment shader adapted from Aceternity UI's cloud-shader component
 * (raw WebGL, no dependencies). Ported as a classic script so the site
 * still works when index.html is opened directly from disk.
 *
 * Tune the colors in SKY_CONFIG below.
 */
(function () {
  'use strict';

  var SKY_CONFIG = {
    speed: 1,                    // animation speed multiplier, 1 = default drift
    count: 6,                    // number of clouds (1-6)
    cloudColor: '#fbf8f2',       // cloud tint
    skyTopColor: '#5a97d8',      // deeper blue at the top
    skyBottomColor: '#cbe3f7'    // pale blue near the horizon
  };

  var VERT = '\nattribute vec2 a_pos;\nvarying vec2 v_uv;\nvoid main() {\n  v_uv = a_pos * 0.5 + 0.5;\n  gl_Position = vec4(a_pos, 0.0, 1.0);\n}\n';

  // Each cloud is an asymmetric envelope (dome top, flat base) filled with
  // domain-warped billow noise. A second density sample above the pixel
  // approximates self-shadowing. Clouds drift horizontally and wrap around.
  var FRAG = '\nprecision highp float;\n\nvarying vec2 v_uv;\n\nuniform vec2 u_res;\nuniform float u_time;\nuniform float u_count;\nuniform vec3 u_cloud;\nuniform vec3 u_skyTop;\nuniform vec3 u_skyBottom;\n\nconst mat2 R = mat2(0.80, 0.60, -0.60, 0.80);\n\nfloat hash(vec2 p) {\n  return fract(sin(dot(p, vec2(41.31, 289.17))) * 26737.367);\n}\n\nfloat vnoise(vec2 p) {\n  vec2 i = floor(p);\n  vec2 f = fract(p);\n  f = f * f * (3.0 - 2.0 * f);\n  float a = hash(i);\n  float b = hash(i + vec2(1.0, 0.0));\n  float c = hash(i + vec2(0.0, 1.0));\n  float d = hash(i + vec2(1.0, 1.0));\n  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);\n}\n\nfloat fbm(vec2 p) {\n  float sum = 0.0;\n  float amp = 0.5;\n  for (int i = 0; i < 4; i++) {\n    sum += amp * vnoise(p);\n    p = R * p * 2.03 + 19.19;\n    amp *= 0.5;\n  }\n  return sum;\n}\n\nfloat billow(vec2 p) {\n  float sum = 0.0;\n  float amp = 0.5;\n  for (int i = 0; i < 5; i++) {\n    sum += amp * (1.0 - abs(2.0 * vnoise(p) - 1.0));\n    p = R * p * 2.11 + 13.37;\n    amp *= 0.5;\n  }\n  return sum;\n}\n\nfloat cloudDensity(vec2 p, vec2 c, vec2 r, float seed, float t) {\n  vec2 q = p - c;\n  float ry = q.y > 0.0 ? r.y : r.y * 0.42;\n  float env = 1.0 - length(vec2(q.x / r.x, q.y / ry));\n  if (env < -0.35) return 0.0;\n  vec2 dp = q * (2.4 / r.x) + seed;\n  dp += 0.6 * vec2(\n    fbm(dp * 1.4 + t * 0.04),\n    fbm(dp * 1.4 + 7.7 - t * 0.03)\n  );\n  float detail = billow(dp * 1.6);\n  return env + (detail - 0.62) * 0.62;\n}\n\nvec3 shadeCloud(vec3 color, vec3 sky, vec2 p, vec2 c, vec2 r, float seed, float t, float dist) {\n  float d = cloudDensity(p, c, r, seed, t);\n  if (d < 0.02) return color;\n  float dUp = cloudDensity(p + vec2(0.0, r.y * 0.55), c, r, seed, t);\n  float occl = clamp((dUp - d) * 1.1 + d * 0.55, 0.0, 1.0);\n  vec3 lit = u_cloud * 1.04;\n  vec3 shadow = mix(u_cloud * 0.60, sky, 0.38);\n  vec3 cloudCol = mix(lit, shadow, occl * 0.85);\n  float alpha = smoothstep(0.02, 0.38, d);\n  float rim = smoothstep(0.02, 0.14, d) * (1.0 - smoothstep(0.14, 0.40, d));\n  cloudCol += rim * 0.10;\n  cloudCol = mix(cloudCol, sky, dist * 0.35);\n  alpha *= mix(1.0, 0.8, dist);\n  return mix(color, cloudCol, alpha);\n}\n\nvec3 cloudPass(vec3 color, vec3 sky, vec2 p, float aspect, float t,\n               float spd, float phase, float y, vec2 r, float seed, float dist) {\n  float cx = mix(-r.x - 0.25, aspect + r.x + 0.25, fract(t * spd + phase));\n  float cy = y + sin(t * 0.05 + phase * 6.2831) * 0.012;\n  return shadeCloud(color, sky, p, vec2(cx, cy), r, seed, t, dist);\n}\n\nvoid main() {\n  float aspect = u_res.x / u_res.y;\n  vec2 p = vec2(v_uv.x * aspect, v_uv.y);\n  float t = u_time;\n  vec3 sky = mix(u_skyBottom, u_skyTop, v_uv.y);\n  vec3 color = sky;\n  color = mix(color, u_skyBottom * 1.06, smoothstep(0.35, 0.0, v_uv.y) * 0.5);\n  vec2 sunPos = vec2(aspect * 0.78, 0.92);\n  float sunDist = length(p - sunPos);\n  color += vec3(1.0, 0.95, 0.82) * exp(-sunDist * sunDist * 5.0) * 0.14;\n  float cirrusBand = smoothstep(0.55, 0.8, v_uv.y) * (1.0 - smoothstep(0.9, 1.0, v_uv.y));\n  if (cirrusBand > 0.01) {\n    float streak = fbm(vec2(p.x * 1.6 - t * 0.006, p.y * 12.0));\n    float wisp = smoothstep(0.52, 0.78, streak) * cirrusBand;\n    color = mix(color, u_cloud * 0.98, wisp * 0.35);\n  }\n  if (u_count > 5.5) {\n    color = cloudPass(color, sky, p, aspect, t, 0.006, 0.10, 0.84, vec2(0.20, 0.10), 43.7, 1.0);\n  }\n  if (u_count > 4.5) {\n    color = cloudPass(color, sky, p, aspect, t, 0.008, 0.62, 0.73, vec2(0.24, 0.12), 71.3, 0.85);\n  }\n  if (u_count > 3.5) {\n    color = cloudPass(color, sky, p, aspect, t, 0.011, 0.33, 0.60, vec2(0.34, 0.16), 17.3, 0.55);\n  }\n  if (u_count > 2.5) {\n    color = cloudPass(color, sky, p, aspect, t, 0.013, 0.80, 0.47, vec2(0.30, 0.15), 29.9, 0.45);\n  }\n  if (u_count > 1.5) {\n    color = cloudPass(color, sky, p, aspect, t, 0.016, 0.05, 0.35, vec2(0.46, 0.20), 91.1, 0.15);\n  }\n  color = cloudPass(color, sky, p, aspect, t, 0.020, 0.48, 0.20, vec2(0.56, 0.24), 57.2, 0.0);\n  gl_FragColor = vec4(color, 1.0);\n}\n';

  function parseHex(color) {
    var value = String(color).trim();
    if (value.charAt(0) === '#') {
      var hex = value.slice(1);
      if (hex.length === 3) {
        return [
          parseInt(hex.charAt(0) + hex.charAt(0), 16) / 255,
          parseInt(hex.charAt(1) + hex.charAt(1), 16) / 255,
          parseInt(hex.charAt(2) + hex.charAt(2), 16) / 255
        ];
      }
      return [
        parseInt(hex.slice(0, 2), 16) / 255,
        parseInt(hex.slice(2, 4), 16) / 255,
        parseInt(hex.slice(4, 6), 16) / 255
      ];
    }
    var rgb = value.match(/[\d.]+/g);
    if (rgb && rgb.length >= 3) {
      return [Number(rgb[0]) / 255, Number(rgb[1]) / 255, Number(rgb[2]) / 255];
    }
    return [0.95, 0.95, 0.95];
  }

  function compile(gl, type, source) {
    var shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function initCloudSky(opts) {
    var p = Object.assign({}, SKY_CONFIG, opts || {});
    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText =
      'position:fixed;inset:0;width:100%;height:100%;display:block;';
    document.body.insertBefore(canvas, document.body.firstChild);

    var gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      premultipliedAlpha: false
    });
    if (!gl) return;

    var vert = compile(gl, gl.VERTEX_SHADER, VERT);
    var frag = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vert || !frag) return;

    var program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.bindAttribLocation(program, 0, 'a_pos');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    var loc = {
      res: gl.getUniformLocation(program, 'u_res'),
      time: gl.getUniformLocation(program, 'u_time'),
      count: gl.getUniformLocation(program, 'u_count'),
      cloud: gl.getUniformLocation(program, 'u_cloud'),
      skyTop: gl.getUniformLocation(program, 'u_skyTop'),
      skyBottom: gl.getUniformLocation(program, 'u_skyBottom')
    };

    var frame = 0;
    var running = true;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var resize = function () {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      var h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(loc.res, w, h);
    };

    if (window.ResizeObserver) {
      new ResizeObserver(resize).observe(canvas);
    } else {
      window.addEventListener('resize', resize);
    }
    resize();

    var start = performance.now();
    var draw = function (now) {
      if (!running) return;
      var cloud = parseHex(p.cloudColor);
      var skyTop = parseHex(p.skyTopColor);
      var skyBottom = parseHex(p.skyBottomColor);
      var elapsed = reduceMotion ? 0 : ((now - start) / 1000) * p.speed;
      gl.uniform1f(loc.time, elapsed);
      gl.uniform1f(loc.count, Math.min(6, Math.max(1, p.count)));
      gl.uniform3f(loc.cloud, cloud[0], cloud[1], cloud[2]);
      gl.uniform3f(loc.skyTop, skyTop[0], skyTop[1], skyTop[2]);
      gl.uniform3f(loc.skyBottom, skyBottom[0], skyBottom[1], skyBottom[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
  }

  window.initCloudSky = initCloudSky;
  initCloudSky();
})();
