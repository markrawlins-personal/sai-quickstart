/**
 * Pong Dot — liquid loading animation: circle pulse → splits into paddles + ball →
 * plays pong → merges back to circle → bounce & pulse (loop).
 *
 * createPongLoader(container, options?)
 * Options: { size?: number, color?: [r,g,b], speed?: number, dotTextureUrl?: string | null }
 * Returns: { destroy(): void }
 */
export function createPongLoader(
  container: HTMLElement,
  opts: {
    size?: number
    color?: [number, number, number]
    speed?: number
    /** Image URL for the dot face; paddles stay solid `color`. Default: Non_Personified_Dot.png */
    dotTextureUrl?: string | null
  } = {}
): { destroy: () => void } {
  const size = opts.size ?? 200
  const color = opts.color ?? [0.157, 0.412, 0.867] // #2869DD
  const speed = opts.speed ?? 1.0
  const dotTextureUrl: string | null =
    opts.dotTextureUrl === undefined ? '/assets/Non_Personified_Dot.png' : opts.dotTextureUrl
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  const DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, isMobile ? 2 : 4) : 1

  const canvas = document.createElement('canvas')
  canvas.width = size * DPR
  canvas.height = size * DPR
  canvas.style.width = size + 'px'
  canvas.style.height = size + 'px'
  canvas.style.borderRadius = '16px'
  canvas.style.display = 'block'
  canvas.style.outline = 'none'
  container.appendChild(canvas)

  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true })
  if (!gl) return createCSSFallback(container, canvas, size, color)
  const ctx = gl
  const hasDeriv = !!ctx.getExtension('OES_standard_derivatives')
  const alphaCalc = hasDeriv
    ? `float aa = max(2.0 * fwidth(d), 1.25 * px);
  float alpha = 1.0 - smoothstep(-aa, aa, d);`
    : `float alpha = 1.0 - smoothstep(-px * 6.0, px * 6.0, d);`

  const vsrc = `attribute vec2 a_pos;void main(){gl_Position=vec4(a_pos,0,1);}`
  const fsrc =
    (hasDeriv ? '#extension GL_OES_standard_derivatives : enable\n' : '') +
    `
precision highp float;
uniform float u_time;
uniform vec2 u_res;
uniform vec3 u_color;
uniform vec4 u_pong;
uniform sampler2D u_dotTex;
uniform float u_hasDotTex;

#define CR 0.2
#define PW 0.04
#define PH 0.15
#define BR 0.025
#define PR 0.008
#define DURATION 11.0
#define AW 0.42
#define BREATHE_AMP 0.07
#define BREATHE_OMEGA 3.14159
#define BREATHE_OMEGA_SLOW 1.4
#define SETTLE_AMP 0.04
#define BOUNCE_AMP 0.08
#define T_CIRCLE 2.8
#define T_SPLIT  3.7
#define T_PONG   9.0
#define T_MERGE  9.9
#define K_PONG   0.03
#define CIRCLE_TO_SPLIT_BLEND 0.28
#define MERGE_TO_SETTLE_BLEND 0.22

#define P1X (-AW/2.0+PW/2.0+0.02)
#define P2X ( AW/2.0-PW/2.0-0.02)

float sdCircle(vec2 p, float r) { return length(p) - r; }

float sdBox(vec2 p, vec2 b, float r) {
  vec2 d = abs(p) - b + r;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
}

float opSmoothUnion(float d1, float d2, float k) {
  float h = clamp(0.5 + 0.5*(d2-d1)/k, 0.0, 1.0);
  return mix(d2, d1, h) - k*h*(1.0-h);
}

float easeInOut(float t) { return t<0.5 ? 2.0*t*t : 1.0-pow(-2.0*t+2.0,2.0)/2.0; }
float easeIn(float t) { return t*t*t; }
float easeOut(float t) { return 1.0-pow(1.0-t,3.0); }
float easeInOutQuart(float t) { return t<0.5 ? 8.0*t*t*t*t : 1.0 - pow(-2.0*t+2.0, 4.0)/2.0; }

/* Ball / main circle center + radius — must stay in sync with sceneSDF for texture mapping. */
vec4 ballParams(float phase) {
  if (phase < T_CIRCLE) {
    float pulseT = phase * BREATHE_OMEGA_SLOW;
    float breathe = 1.0 + BREATHE_AMP * sin(pulseT);
    float startScale = 1.0 + BREATHE_AMP * sin(T_CIRCLE * BREATHE_OMEGA_SLOW);
    float easeFromLoop = smoothstep(0.0, 0.04, phase / T_CIRCLE);
    breathe = mix(1.0, breathe, easeFromLoop);
    float easeToSplit = smoothstep(T_CIRCLE - 0.12, T_CIRCLE, phase);
    breathe = mix(breathe, startScale, easeToSplit);
    return vec4(0.0, 0.0, CR * breathe, 1.0);
  }
  if (phase < T_SPLIT) {
    float t = (phase - T_CIRCLE) / (T_SPLIT - T_CIRCLE);
    float startScale = 1.0 + BREATHE_AMP * sin(T_CIRCLE * BREATHE_OMEGA_SLOW);
    float heightT = easeInOutQuart(clamp((t - 0.04) / 0.96, 0.0, 1.0));
    float ballShrinkT = heightT;
    float br = mix(CR * startScale, BR, ballShrinkT);
    return vec4(0.0, 0.0, br, 1.0);
  }
  if (phase < T_PONG) {
    return vec4(u_pong.z, u_pong.w, BR, 1.0);
  }
  if (phase < T_MERGE) {
    float t = (phase - T_PONG) / (T_MERGE - T_PONG);
    float bx = mix(u_pong.z, 0.0, easeInOutQuart(clamp(t / 0.25, 0.0, 1.0)));
    float by = mix(u_pong.w, 0.0, easeInOutQuart(clamp(t / 0.25, 0.0, 1.0)));
    float ballGrowT = easeInOutQuart(t);
    float br = mix(BR, CR, ballGrowT);
    float toCircle = easeInOutQuart(clamp((t - 0.70) / 0.30, 0.0, 1.0));
    float easeToSettle = smoothstep(0.88, 1.0, t);
    toCircle = max(toCircle, easeToSettle);
    float tcx = mix(bx, 0.0, toCircle);
    float tcy = mix(by, 0.0, toCircle);
    float tr = mix(br, CR, toCircle);
    return vec4(tcx, tcy, tr, 1.0);
  }
  float lt = (phase - T_MERGE) / (DURATION - T_MERGE);
  float bounce = 1.0 + BOUNCE_AMP * pow(2.0, -5.0 * lt) * sin(lt * 2.5 * 3.14159);
  float pulse = 1.0 + SETTLE_AMP * sin((lt - 0.25) * BREATHE_OMEGA_SLOW / 0.75);
  float blend = smoothstep(0.2, 0.45, lt);
  float sc = mix(bounce, pulse, blend);
  float easeToLoop = smoothstep(0.78, 1.0, lt);
  sc = mix(sc, 1.0, easeToLoop);
  return vec4(0.0, 0.0, CR * sc, 1.0);
}

float sceneSDF(vec2 p, float time) {
  float phase = mod(time, DURATION);

  if (phase < T_CIRCLE) {
    float pulseT = phase * BREATHE_OMEGA_SLOW;
    float breathe = 1.0 + BREATHE_AMP * sin(pulseT);
    float startScale = 1.0 + BREATHE_AMP * sin(T_CIRCLE * BREATHE_OMEGA_SLOW);
    float easeFromLoop = smoothstep(0.0, 0.04, phase / T_CIRCLE);
    breathe = mix(1.0, breathe, easeFromLoop);
    float easeToSplit = smoothstep(T_CIRCLE - 0.12, T_CIRCLE, phase);
    breathe = mix(breathe, startScale, easeToSplit);
    return sdCircle(p, CR * breathe);
  }

  if (phase < T_SPLIT) {
    float t = (phase - T_CIRCLE) / (T_SPLIT - T_CIRCLE);
    float startScale = 1.0 + BREATHE_AMP * sin(T_CIRCLE * BREATHE_OMEGA_SLOW);
    float circleD = sdCircle(p, CR * startScale);

    float slideT = easeInOutQuart(t);
    float heightT = easeInOutQuart(clamp((t - 0.04) / 0.96, 0.0, 1.0));

    float p1x = mix(0.0, P1X, slideT);
    float p2x = mix(0.0, P2X, slideT);

    float hw = mix(CR * startScale, PW/2.0, heightT);
    float hh = mix(CR * startScale, PH/2.0, heightT);
    float rounding = mix(CR * startScale, PR, heightT);

    float d1 = sdBox(p - vec2(p1x, 0), vec2(hw, hh), rounding);
    float d2 = sdBox(p - vec2(p2x, 0), vec2(hw, hh), rounding);

    float k = mix(0.4, K_PONG, easeIn(clamp(t / 0.75, 0.0, 1.0)));
    float d = opSmoothUnion(d1, d2, k);

    float ballShrinkT = heightT;
    float br = mix(CR * startScale, BR, ballShrinkT);
    float db = sdCircle(p, br);
    d = opSmoothUnion(d, db, K_PONG);

    float fromCircle = 1.0 - smoothstep(0.0, CIRCLE_TO_SPLIT_BLEND, t);
    d = mix(circleD, d, 1.0 - fromCircle);
    return d;
  }

  if (phase < T_PONG) {
    float d1 = sdBox(p - vec2(P1X, u_pong.x), vec2(PW/2.0, PH/2.0), PR);
    float d2 = sdBox(p - vec2(P2X, u_pong.y), vec2(PW/2.0, PH/2.0), PR);
    float db = sdCircle(p - u_pong.zw, BR);
    float d = opSmoothUnion(opSmoothUnion(d1, d2, K_PONG), db, K_PONG);
    return d;
  }

  if (phase < T_MERGE) {
    float t = (phase - T_PONG) / (T_MERGE - T_PONG);
    float slideT = easeInOutQuart(t);
    float heightT = easeInOutQuart(clamp(t / 0.88, 0.0, 1.0));

    float p1x = mix(P1X, 0.0, slideT);
    float p2x = mix(P2X, 0.0, slideT);
    float p1y = mix(u_pong.x, 0.0, slideT);
    float p2y = mix(u_pong.y, 0.0, slideT);

    float hw = mix(PW/2.0, CR, heightT);
    float hh = mix(PH/2.0, CR, heightT);
    float rounding = mix(PR, CR, heightT);

    float d1 = sdBox(p - vec2(p1x, p1y), vec2(hw, hh), rounding);
    float d2 = sdBox(p - vec2(p2x, p2y), vec2(hw, hh), rounding);

    float k = mix(K_PONG, 0.4, easeOut(clamp(t / 0.5, 0.0, 1.0)));
    float d = opSmoothUnion(d1, d2, k);

    float bx = mix(u_pong.z, 0.0, easeInOutQuart(clamp(t / 0.25, 0.0, 1.0)));
    float by = mix(u_pong.w, 0.0, easeInOutQuart(clamp(t / 0.25, 0.0, 1.0)));
    float ballGrowT = easeInOutQuart(t);
    float br = mix(BR, CR, ballGrowT);
    float db = sdCircle(p - vec2(bx, by), br);
    d = opSmoothUnion(d, db, K_PONG);
    float circleOnly = sdCircle(p, CR);
    float toCircle = easeInOutQuart(clamp((t - 0.70) / 0.30, 0.0, 1.0));
    float easeToSettle = smoothstep(0.88, 1.0, t);
    toCircle = max(toCircle, easeToSettle);
    d = mix(d, circleOnly, toCircle);
    return d;
  }

  float lt = (phase - T_MERGE) / (DURATION - T_MERGE);
  float circleAtRest = sdCircle(p, CR);
  float bounce = 1.0 + BOUNCE_AMP * pow(2.0, -5.0 * lt) * sin(lt * 2.5 * 3.14159);
  float pulse = 1.0 + SETTLE_AMP * sin((lt - 0.25) * BREATHE_OMEGA_SLOW / 0.75);
  float blend = smoothstep(0.2, 0.45, lt);
  float scale = mix(bounce, pulse, blend);
  float easeToLoop = smoothstep(0.78, 1.0, lt);
  scale = mix(scale, 1.0, easeToLoop);
  float d = sdCircle(p, CR * scale);
  float fromMerge = 1.0 - smoothstep(0.0, MERGE_TO_SETTLE_BLEND, lt);
  d = mix(circleAtRest, d, 1.0 - fromMerge);
  return d;
}

void main() {
  vec2 uv = (gl_FragCoord.xy / u_res - 0.5);
  float d = sceneSDF(uv, u_time);
  float px = 1.0 / u_res.y;
  __ALPHA_CALC__
  /* Page gray (#f5f5f5) everywhere except pong play — avoids faint accent blue on SDF edges
     during idle pulse / morph / settle (semi-transparent fringe would otherwise read as a halo). */
  vec3 dotBg = vec3(245.0/255.0);
  float ph = u_time;
  float pongPlay = smoothstep(T_SPLIT - 0.1, T_SPLIT + 0.12, ph) * (1.0 - smoothstep(T_PONG - 0.12, T_PONG + 0.1, ph));
  vec3 baseColor = mix(dotBg, u_color, pongPlay);
  vec3 rgb = baseColor;
  if (u_hasDotTex > 0.5) {
    vec4 bp = ballParams(u_time);
    vec2 bc = bp.xy;
    float br = bp.z;
    vec2 q = (uv - bc) / max(br, 1e-5);
    float rlen = length(q);
    vec2 tuv = q * 0.5 + 0.5;
    tuv.y = 1.0 - tuv.y;
    vec4 tex = texture2D(u_dotTex, tuv);
    vec3 texColor = mix(dotBg, tex.rgb, tex.a);
    float edgeW = px * 3.0 / max(br, 1e-5);
    float inDisc = 1.0 - smoothstep(1.0 - edgeW, 1.0 + edgeW, rlen);
    rgb = mix(baseColor, texColor, inDisc);
  }
  /* Premultiplied rgb + ONE/ONE_MINUS_SRC_ALPHA matches canvas premultipliedAlpha. */
  gl_FragColor = vec4(rgb * alpha, alpha);
}
`.replace('__ALPHA_CALC__', alphaCalc)

  function compileShader(type: number, src: string): WebGLShader | null {
    const s = ctx.createShader(type)
    if (!s) return null
    ctx.shaderSource(s, src)
    ctx.compileShader(s)
    if (!ctx.getShaderParameter(s, ctx.COMPILE_STATUS)) {
      console.error(ctx.getShaderInfoLog(s))
      return null
    }
    return s
  }

  const vs = compileShader(ctx.VERTEX_SHADER, vsrc)
  const fs = compileShader(ctx.FRAGMENT_SHADER, fsrc)
  if (!vs || !fs) return createCSSFallback(container, canvas, size, color)

  const prog = ctx.createProgram()
  if (!prog) return createCSSFallback(container, canvas, size, color)
  ctx.attachShader(prog, vs)
  ctx.attachShader(prog, fs)
  ctx.linkProgram(prog)
  ctx.useProgram(prog)

  const buf = ctx.createBuffer()
  ctx.bindBuffer(ctx.ARRAY_BUFFER, buf)
  ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), ctx.STATIC_DRAW)
  const aPos = ctx.getAttribLocation(prog, 'a_pos')
  ctx.enableVertexAttribArray(aPos)
  ctx.vertexAttribPointer(aPos, 2, ctx.FLOAT, false, 0, 0)

  const uTime = ctx.getUniformLocation(prog, 'u_time')
  const uRes = ctx.getUniformLocation(prog, 'u_res')
  const uColor = ctx.getUniformLocation(prog, 'u_color')
  const uPong = ctx.getUniformLocation(prog, 'u_pong')
  const uDotTex = ctx.getUniformLocation(prog, 'u_dotTex')
  const uHasDotTex = ctx.getUniformLocation(prog, 'u_hasDotTex')

  let destroyed = false
  const dotTex = ctx.createTexture()
  let dotTexReady = false

  function loadDotTexture(url: string | null) {
    if (!url) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (destroyed) return
      ctx.bindTexture(ctx.TEXTURE_2D, dotTex)
      ctx.pixelStorei(ctx.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
      try {
        ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, img)
      } catch {
        const c = document.createElement('canvas')
        const w = img.naturalWidth || 52
        const h = img.naturalHeight || 52
        c.width = w
        c.height = h
        const c2d = c.getContext('2d')
        if (c2d) {
          c2d.drawImage(img, 0, 0)
          ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, c)
        }
      }
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE)
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE)
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR)
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR)
      dotTexReady = true
    }
    img.onerror = () => {
      dotTexReady = false
    }
    img.src = url
  }
  loadDotTexture(dotTextureUrl)

  ctx.uniform2f(uRes, size * DPR, size * DPR)
  ctx.uniform3f(uColor, color[0], color[1], color[2])
  ctx.viewport(0, 0, size * DPR, size * DPR)
  ctx.enable(ctx.BLEND)
  ctx.blendFunc(ctx.ONE, ctx.ONE_MINUS_SRC_ALPHA)
  ctx.clearColor(0, 0, 0, 0)

  const AW = 0.42
  const CR = 0.2
  const PN = {
    pw: 0.04,
    ph: 0.15,
    br: 0.025,
    p1x: -AW / 2 + 0.04 / 2 + 0.02,
    p2x: AW / 2 - 0.04 / 2 - 0.02,
    top: -CR,
    bot: CR,
  }

  let ballX = 0,
    ballY = 0,
    ballVX = 0.012,
    ballVY = 0.008
  let pad1Y = 0,
    pad2Y = 0,
    pad1VY = 0,
    pad2VY = 0
  let pongActive = false
  let frozenPong: [number, number, number, number] = [0, 0, 0, 0]

  function clamp(v: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, v))
  }

  function resetPong() {
    ballX = 0
    ballY = 0
    ballVX = 0.012
    ballVY = 0.008
    pad1Y = 0
    pad2Y = 0
    pad1VY = 0
    pad2VY = 0
  }

  function stepPong() {
    ballX += ballVX
    ballY += ballVY

    if (ballY - PN.br < PN.top) {
      ballY = PN.top + PN.br
      ballVY = Math.abs(ballVY)
    }
    if (ballY + PN.br > PN.bot) {
      ballY = PN.bot - PN.br
      ballVY = -Math.abs(ballVY)
    }

    const p1Spd = 0.011
    let p1Target: number
    if (ballVX < 0) {
      p1Target = ballY
    } else {
      p1Target = ballY + ballVY * 15
    }
    pad1VY += (p1Target - pad1Y) * 0.14
    pad1VY *= 0.82
    pad1VY = clamp(pad1VY, -p1Spd, p1Spd)
    pad1Y += pad1VY
    pad1Y = clamp(pad1Y, PN.top + PN.ph / 2, PN.bot - PN.ph / 2)

    const p2Spd = 0.01
    let p2Target: number
    if (ballVX > 0) {
      const framesUntilArrival = Math.abs((PN.p2x - ballX) / (ballVX || 0.001))
      p2Target = ballY + ballVY * Math.min(framesUntilArrival * 0.7, 20)
    } else {
      p2Target = -ballY * 0.5
    }
    pad2VY += (p2Target - pad2Y) * 0.07
    pad2VY *= 0.9
    pad2VY = clamp(pad2VY, -p2Spd, p2Spd)
    pad2Y += pad2VY
    pad2Y = clamp(pad2Y, PN.top + PN.ph / 2, PN.bot - PN.ph / 2)

    if (ballX - PN.br < PN.p1x + PN.pw / 2 && ballVX < 0) {
      if (Math.abs(ballY - pad1Y) < PN.ph / 2 + PN.br) {
        ballX = PN.p1x + PN.pw / 2 + PN.br
        ballVX = Math.abs(ballVX)
        ballVY = (ballY - pad1Y) * 0.15
        if (Math.abs(ballVY) < 0.005)
          ballVY = (ballVY >= 0 ? 1 : -1) * 0.005 + (Math.random() - 0.5) * 0.004
      }
    }
    if (ballX + PN.br > PN.p2x - PN.pw / 2 && ballVX > 0) {
      if (Math.abs(ballY - pad2Y) < PN.ph / 2 + PN.br) {
        ballX = PN.p2x - PN.pw / 2 - PN.br
        ballVX = -Math.abs(ballVX)
        ballVY = (ballY - pad2Y) * 0.15
        if (Math.abs(ballVY) < 0.005)
          ballVY = (ballVY >= 0 ? 1 : -1) * 0.005 + (Math.random() - 0.5) * 0.004
      }
    }

    ballVY = clamp(ballVY, -0.014, 0.014)

    if (ballX < PN.p1x - 0.05 || ballX > PN.p2x + 0.05) {
      ballX = 0
      ballY = 0
      ballVX = ballVX > 0 ? -0.012 : 0.012
      ballVY = (Math.random() - 0.5) * 0.012
    }
  }

  const DURATION = 11.0
  const T_SPLIT = 3.7
  const T_PONG = 9.0

  let startTime: number | null = null
  let rafId: number | null = null

  function animate(timestamp: number) {
    if (destroyed) return
    if (startTime === null) startTime = timestamp

    const elapsed = ((timestamp - startTime) / 1000) * speed
    const phase = elapsed % DURATION

    if (phase >= T_SPLIT && phase < T_PONG) {
      if (!pongActive) {
        resetPong()
        pongActive = true
      }
      stepPong()
      frozenPong = [pad1Y, pad2Y, ballX, ballY]
    } else if (phase >= T_PONG && pongActive) {
      frozenPong = [pad1Y, pad2Y, ballX, ballY]
      pongActive = false
    } else if (phase < T_SPLIT) {
      pongActive = false
    }

    ctx.clear(ctx.COLOR_BUFFER_BIT)
    ctx.uniform1f(uTime, phase)
    ctx.uniform4f(uPong, frozenPong[0], frozenPong[1], frozenPong[2], frozenPong[3])
    ctx.activeTexture(ctx.TEXTURE0)
    ctx.bindTexture(ctx.TEXTURE_2D, dotTex)
    if (uDotTex) ctx.uniform1i(uDotTex, 0)
    if (uHasDotTex) ctx.uniform1f(uHasDotTex, dotTexReady ? 1 : 0)
    ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4)

    rafId = requestAnimationFrame(animate)
  }

  rafId = requestAnimationFrame(animate)

  return {
    destroy() {
      destroyed = true
      if (rafId !== null) cancelAnimationFrame(rafId)
      ctx.deleteProgram(prog)
      ctx.deleteShader(vs)
      ctx.deleteShader(fs)
      ctx.deleteBuffer(buf)
      ctx.deleteTexture(dotTex)
      canvas.remove()
    },
  }
}

/** Alias: use this name when you want the "Pong Dot" animation explicitly. */
export { createPongLoader as createPongDotLoader }

function createCSSFallback(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  size: number,
  color: [number, number, number]
): { destroy: () => void } {
  canvas.remove()
  const r = Math.round(color[0] * 255)
  const g = Math.round(color[1] * 255)
  const b = Math.round(color[2] * 255)
  const el = document.createElement('div')
  el.style.cssText =
    `width:${size * 0.4}px;height:${size * 0.4}px;border-radius:50%;` +
    `background:rgb(${r},${g},${b});animation:pong-pulse 1.5s ease-in-out infinite;`
  const style = document.createElement('style')
  style.textContent = `@keyframes pong-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.08);opacity:0.85}}`
  container.appendChild(style)
  container.appendChild(el)
  return {
    destroy() {
      el.remove()
      style.remove()
    },
  }
}
