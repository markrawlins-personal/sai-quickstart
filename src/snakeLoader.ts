/**
 * Snake Dot — Big dot shrinks to a food dot; snake square appears a few steps away,
 * moves one cell at a time to consume it; new food appears elsewhere, snake changes
 * course and consumes second food; then that food dot morphs into the big pulsing dot
 * (like Pong Dot's return). See snake-game/ for full playable reference.
 *
 * createSnakeLoader(container, options?)
 * Options: { size?: number, color?: [r,g,b], speed?: number }
 * Returns: { destroy(): void }
 */
export function createSnakeLoader(
  container: HTMLElement,
  opts: { size?: number; color?: [number, number, number]; speed?: number } = {}
): { destroy: () => void } {
  const size = opts.size ?? 200
  const color = opts.color ?? [0.157, 0.412, 0.867] // #2869DD
  const speed = opts.speed ?? 1.0
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  const DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, isMobile ? 2 : 4) : 1

  const canvas = document.createElement('canvas')
  canvas.width = size * DPR
  canvas.height = size * DPR
  canvas.style.width = size + 'px'
  canvas.style.height = size + 'px'
  canvas.style.borderRadius = '16px'
  container.appendChild(canvas)

  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false })
  if (!gl) return createCSSFallback(container, canvas, size, color)
  const ctx = gl

  const vsrc = `attribute vec2 a_pos;void main(){gl_Position=vec4(a_pos,0,1);}`
  const fsrc = `
precision highp float;
uniform float u_time;
uniform vec2 u_res;
uniform vec3 u_color;
uniform vec2 u_head;
uniform vec2 u_b0;
uniform vec2 u_b1;
uniform vec2 u_b2;
uniform vec2 u_b3;
uniform vec2 u_b4;
uniform vec2 u_b5;
uniform vec2 u_b6;
uniform vec2 u_b7;
uniform vec2 u_b8;
uniform vec2 u_b9;
uniform vec2 u_b10;
uniform vec2 u_b11;
uniform float u_bodyLen;
uniform vec2 u_food;
uniform float u_foodVis;

#define CR 0.2
#define SZ 0.036
#define DURATION 12.0
#define T_CIRCLE 2.8
#define T_SHRINK  3.5
#define T_SNAKE_START 3.7
#define T_SNAKE_END   8.0
#define T_MORPH_END   8.7
#define BREATHE_AMP 0.07
#define BREATHE_OMEGA_SLOW 1.4
#define SETTLE_AMP 0.04
#define BOUNCE_AMP 0.08
#define K 0.03
#define SHRINK_BLEND 0.4
#define MORPH_TO_SETTLE_BLEND 0.22

float sdCircle(vec2 p, float r) { return length(p) - r; }

float sdBox(vec2 p, vec2 b, float r) {
  vec2 d = abs(p) - b + r;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
}

float opSmoothUnion(float d1, float d2, float k) {
  float h = clamp(0.5 + 0.5*(d2-d1)/k, 0.0, 1.0);
  return mix(d2, d1, h) - k*h*(1.0-h);
}

float easeInOutQuart(float t) { return t<0.5 ? 8.0*t*t*t*t : 1.0 - pow(-2.0*t+2.0, 4.0)/2.0; }

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

  if (phase < T_SHRINK) {
    float t = (phase - T_CIRCLE) / (T_SHRINK - T_CIRCLE);
    float startScale = 1.0 + BREATHE_AMP * sin(T_CIRCLE * BREATHE_OMEGA_SLOW);
    float r = mix(CR * startScale, SZ, easeInOutQuart(smoothstep(0.0, SHRINK_BLEND, t)));
    return sdCircle(p, r);
  }

  if (phase < T_SNAKE_START) {
    return sdCircle(p, SZ);
  }

  if (phase < T_SNAKE_END) {
    vec2 hb = vec2(SZ, SZ);
    float d = sdBox(p - u_head, hb, 0.0);
    if (u_bodyLen > 0.5) d = min(d, sdBox(p - u_b0, hb, 0.0));
    if (u_bodyLen > 1.5) d = min(d, sdBox(p - u_b1, hb, 0.0));
    if (u_bodyLen > 2.5) d = min(d, sdBox(p - u_b2, hb, 0.0));
    if (u_bodyLen > 3.5) d = min(d, sdBox(p - u_b3, hb, 0.0));
    if (u_bodyLen > 4.5) d = min(d, sdBox(p - u_b4, hb, 0.0));
    if (u_bodyLen > 5.5) d = min(d, sdBox(p - u_b5, hb, 0.0));
    if (u_bodyLen > 6.5) d = min(d, sdBox(p - u_b6, hb, 0.0));
    if (u_bodyLen > 7.5) d = min(d, sdBox(p - u_b7, hb, 0.0));
    if (u_bodyLen > 8.5) d = min(d, sdBox(p - u_b8, hb, 0.0));
    if (u_bodyLen > 9.5) d = min(d, sdBox(p - u_b9, hb, 0.0));
    if (u_bodyLen > 10.5) d = min(d, sdBox(p - u_b10, hb, 0.0));
    if (u_bodyLen > 11.5) d = min(d, sdBox(p - u_b11, hb, 0.0));
    if (u_foodVis > 0.5) d = min(d, sdCircle(p - u_food, SZ));
    return d;
  }

  if (phase < T_MORPH_END) {
    float t = (phase - T_SNAKE_END) / (T_MORPH_END - T_SNAKE_END);
    float r = mix(SZ, CR, easeInOutQuart(t));
    return sdCircle(p, r);
  }

  float lt = (phase - T_MORPH_END) / (DURATION - T_MORPH_END);
  float circleAtRest = sdCircle(p, CR);
  float bounce = 1.0 + BOUNCE_AMP * pow(2.0, -5.0 * lt) * sin(lt * 2.5 * 3.14159);
  float pulse = 1.0 + SETTLE_AMP * sin((lt - 0.25) * BREATHE_OMEGA_SLOW / 0.75);
  float blend = smoothstep(0.2, 0.45, lt);
  float scale = mix(bounce, pulse, blend);
  float easeToLoop = smoothstep(0.78, 1.0, lt);
  scale = mix(scale, 1.0, easeToLoop);
  float d = sdCircle(p, CR * scale);
  float fromMerge = 1.0 - smoothstep(0.0, MORPH_TO_SETTLE_BLEND, lt);
  d = mix(circleAtRest, d, 1.0 - fromMerge);
  return d;
}

void main() {
  vec2 uv = (gl_FragCoord.xy / u_res - 0.5);
  float d = sceneSDF(uv, u_time);
  float px = 1.0 / u_res.y;
  float alpha = 1.0 - smoothstep(-px * 1.5, px * 0.5, d);
  gl_FragColor = vec4(u_color * alpha, alpha);
}
`

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
  const uHead = ctx.getUniformLocation(prog, 'u_head')
  const uB0 = ctx.getUniformLocation(prog, 'u_b0')
  const uB1 = ctx.getUniformLocation(prog, 'u_b1')
  const uB2 = ctx.getUniformLocation(prog, 'u_b2')
  const uB3 = ctx.getUniformLocation(prog, 'u_b3')
  const uB4 = ctx.getUniformLocation(prog, 'u_b4')
  const uB5 = ctx.getUniformLocation(prog, 'u_b5')
  const uB6 = ctx.getUniformLocation(prog, 'u_b6')
  const uB7 = ctx.getUniformLocation(prog, 'u_b7')
  const uB8 = ctx.getUniformLocation(prog, 'u_b8')
  const uB9 = ctx.getUniformLocation(prog, 'u_b9')
  const uB10 = ctx.getUniformLocation(prog, 'u_b10')
  const uB11 = ctx.getUniformLocation(prog, 'u_b11')
  const uBodyLen = ctx.getUniformLocation(prog, 'u_bodyLen')
  const uFood = ctx.getUniformLocation(prog, 'u_food')
  const uFoodVis = ctx.getUniformLocation(prog, 'u_foodVis')

  ctx.uniform2f(uRes, size * DPR, size * DPR)
  ctx.uniform3f(uColor, color[0], color[1], color[2])
  ctx.viewport(0, 0, size * DPR, size * DPR)
  ctx.enable(ctx.BLEND)
  ctx.blendFunc(ctx.SRC_ALPHA, ctx.ONE_MINUS_SRC_ALPHA)
  ctx.clearColor(0, 0, 0, 0)

  const DURATION = 12.0
  const T_SNAKE_START = 3.7
  const T_SNAKE_END = 8.0

  const SEG = 0.06
  const FOOD1: [number, number] = [0, 0]
  const FOOD2: [number, number] = [2 * SEG, -2 * SEG]
  const PATH: [number, number][] = [
    [-2 * SEG, 0],
    [-1.5 * SEG, 0],
    [-SEG, 0],
    [0, 0],
    [SEG, 0],
    [2 * SEG, 0],
    [2 * SEG, -SEG],
    [2 * SEG, -2 * SEG],
  ]
  const TOTAL_STEPS = PATH.length - 1
  const EAT1_AT = 3
  const EAT2_AT = 7

  function pathAt(i: number): [number, number] {
    if (i < 0 || i >= PATH.length) return OFF
    return [PATH[i][0], PATH[i][1]]
  }

  const OFF: [number, number] = [2, 2]
  let startTime: number | null = null
  let rafId: number | null = null
  let destroyed = false
  let frozenHead: [number, number] = [0, 0]
  let frozenB0: [number, number] = OFF
  let frozenB1: [number, number] = OFF
  let frozenB2: [number, number] = OFF
  let frozenB3: [number, number] = OFF
  let frozenB4: [number, number] = OFF
  let frozenB5: [number, number] = OFF
  let frozenB6: [number, number] = OFF
  let frozenB7: [number, number] = OFF
  let frozenB8: [number, number] = OFF
  let frozenB9: [number, number] = OFF
  let frozenB10: [number, number] = OFF
  let frozenB11: [number, number] = OFF
  let frozenBodyLen = 0

  function animate(timestamp: number) {
    if (destroyed) return
    if (startTime === null) startTime = timestamp

    const elapsed = ((timestamp - startTime) / 1000) * speed
    const phase = elapsed % DURATION

    let head: [number, number] = [0, 0]
    let b0: [number, number] = OFF
    let b1: [number, number] = OFF
    let b2: [number, number] = OFF
    let b3: [number, number] = OFF
    let b4: [number, number] = OFF
    let b5: [number, number] = OFF
    let b6: [number, number] = OFF
    let b7: [number, number] = OFF
    let b8: [number, number] = OFF
    let b9: [number, number] = OFF
    let b10: [number, number] = OFF
    let b11: [number, number] = OFF
    let bodyLen = 0
    let food: [number, number] = [0, 0]
    let foodVis = 0

    if (phase >= T_SNAKE_START && phase < T_SNAKE_END) {
      const snakeT = (phase - T_SNAKE_START) / (T_SNAKE_END - T_SNAKE_START)
      const speedFactor = 1.15
      const stepIndex = Math.min(TOTAL_STEPS, Math.floor(snakeT * (TOTAL_STEPS + 1) * speedFactor))
      head = pathAt(stepIndex)
      bodyLen = Math.min(12, stepIndex)
      if (bodyLen >= 1) b0 = pathAt(stepIndex - 1)
      if (bodyLen >= 2) b1 = pathAt(stepIndex - 2)
      if (bodyLen >= 3) b2 = pathAt(stepIndex - 3)
      if (bodyLen >= 4) b3 = pathAt(stepIndex - 4)
      if (bodyLen >= 5) b4 = pathAt(stepIndex - 5)
      if (bodyLen >= 6) b5 = pathAt(stepIndex - 6)
      if (bodyLen >= 7) b6 = pathAt(stepIndex - 7)
      if (bodyLen >= 8) b7 = pathAt(stepIndex - 8)
      if (bodyLen >= 9) b8 = pathAt(stepIndex - 9)
      if (bodyLen >= 10) b9 = pathAt(stepIndex - 10)
      if (bodyLen >= 11) b10 = pathAt(stepIndex - 11)
      if (bodyLen >= 12) b11 = pathAt(stepIndex - 12)

      if (stepIndex < EAT1_AT) {
        food = FOOD1
        foodVis = 1
      } else if (stepIndex < EAT2_AT) {
        food = FOOD2
        foodVis = 1
      } else {
        foodVis = 0
        food = OFF
      }

      frozenHead = head
      frozenB0 = b0
      frozenB1 = b1
      frozenB2 = b2
      frozenB3 = b3
      frozenB4 = b4
      frozenB5 = b5
      frozenB6 = b6
      frozenB7 = b7
      frozenB8 = b8
      frozenB9 = b9
      frozenB10 = b10
      frozenB11 = b11
      frozenBodyLen = bodyLen
    } else if (phase >= T_SNAKE_END) {
      head = frozenHead
      b0 = frozenB0
      b1 = frozenB1
      b2 = frozenB2
      b3 = frozenB3
      b4 = frozenB4
      b5 = frozenB5
      b6 = frozenB6
      b7 = frozenB7
      b8 = frozenB8
      b9 = frozenB9
      b10 = frozenB10
      b11 = frozenB11
      bodyLen = frozenBodyLen
      foodVis = 0
      food = OFF
    }

    ctx.clear(ctx.COLOR_BUFFER_BIT)
    ctx.uniform1f(uTime, phase)
    ctx.uniform2f(uHead, head[0], head[1])
    ctx.uniform2f(uB0, b0[0], b0[1])
    ctx.uniform2f(uB1, b1[0], b1[1])
    ctx.uniform2f(uB2, b2[0], b2[1])
    ctx.uniform2f(uB3, b3[0], b3[1])
    ctx.uniform2f(uB4, b4[0], b4[1])
    ctx.uniform2f(uB5, b5[0], b5[1])
    ctx.uniform2f(uB6, b6[0], b6[1])
    ctx.uniform2f(uB7, b7[0], b7[1])
    ctx.uniform2f(uB8, b8[0], b8[1])
    ctx.uniform2f(uB9, b9[0], b9[1])
    ctx.uniform2f(uB10, b10[0], b10[1])
    ctx.uniform2f(uB11, b11[0], b11[1])
    ctx.uniform1f(uBodyLen, bodyLen)
    ctx.uniform2f(uFood, food[0], food[1])
    ctx.uniform1f(uFoodVis, foodVis)
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
      canvas.remove()
    },
  }
}

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
    `background:rgb(${r},${g},${b});animation:snake-pulse 1.5s ease-in-out infinite;`
  const style = document.createElement('style')
  style.textContent = `@keyframes snake-pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.08);opacity:0.85}}`
  container.appendChild(style)
  container.appendChild(el)
  return {
    destroy() {
      el.remove()
      style.remove()
    },
  }
}
