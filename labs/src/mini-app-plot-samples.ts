import type { MiniAppSource } from '../../src/components/mini-app/index.js';
import { baseCss } from './mini-app-samples.js';

/**
 * A small SVG plotting kit the plot samples paste into their scripts, as a mini-app author would:
 * each mini-app is self-contained, so nothing is shared at run time.
 */
const plotKit = `
  const svgNs = 'http://www.w3.org/2000/svg';
  function node(parent, name, attributes, text) {
    const element = document.createElementNS(svgNs, name);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
    if (text !== undefined) element.textContent = text;
    parent.append(element);
    return element;
  }
  function linearTicks(min, max, count) {
    const raw = (max - min) / count;
    const magnitude = 10 ** Math.floor(Math.log10(raw));
    const fraction = raw / magnitude;
    const step = (fraction < 1.5 ? 1 : fraction < 3 ? 2 : fraction < 7 ? 5 : 10) * magnitude;
    const ticks = [];
    for (let value = Math.ceil(min / step) * step; value <= max + step / 1e6; value += step) {
      ticks.push(Math.round(value / step) * step);
    }
    return ticks;
  }
  function formatTick(value) {
    if (Math.abs(value) >= 1000) return Number((value / 1000).toPrecision(3)) + 'k';
    return String(Number(value.toPrecision(3)));
  }
  /** Draws a plot's grid, axes, tick labels and titles; returns its scales. */
  function drawFrame(svg, options) {
    const { box, x, y } = options;
    const toX = x.log
      ? (value) => box.left + ((Math.log10(value) - Math.log10(x.min)) / (Math.log10(x.max) - Math.log10(x.min))) * box.width
      : (value) => box.left + ((value - x.min) / (x.max - x.min)) * box.width;
    const toY = (value) => box.top + box.height - ((value - y.min) / (y.max - y.min)) * box.height;
    const grid = node(svg, 'g', { class: 'grid' });
    for (const tick of x.minor ?? []) {
      node(grid, 'line', { x1: toX(tick), x2: toX(tick), y1: box.top, y2: box.top + box.height, class: 'minor' });
    }
    for (const tick of x.ticks) {
      node(grid, 'line', { x1: toX(tick), x2: toX(tick), y1: box.top, y2: box.top + box.height });
      node(svg, 'text', { x: toX(tick), y: box.top + box.height + 14, 'text-anchor': 'middle' }, formatTick(tick));
    }
    for (const tick of y.ticks) {
      node(grid, 'line', { x1: box.left, x2: box.left + box.width, y1: toY(tick), y2: toY(tick) });
      node(svg, 'text', { x: box.left - 6, y: toY(tick) + 4, 'text-anchor': 'end' }, formatTick(tick));
    }
    node(svg, 'rect', { x: box.left, y: box.top, width: box.width, height: box.height, class: 'axes' });
    if (x.title) {
      node(svg, 'text', { x: box.left + box.width / 2, y: box.top + box.height + 30, 'text-anchor': 'middle', class: 'title' }, x.title);
    }
    const middle = box.top + box.height / 2;
    node(svg, 'text', { x: 12, y: middle, 'text-anchor': 'middle', transform: 'rotate(-90 12 ' + middle + ')', class: 'title' }, y.title);
    return { toX, toY };
  }
  function tracePath(points, toX, toY) {
    return points.map(([px, py], index) => (index ? 'L' : 'M') + toX(px).toFixed(1) + ' ' + toY(py).toFixed(1)).join('');
  }
`;

const plotCss = `${baseCss}
  .controls { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; align-items: end; }
  .field { display: grid; gap: 4px; }
  .field label { display: flex; justify-content: space-between; gap: 8px; }
  select { font: inherit; padding: 4px 6px; border: 1px solid #6e7781; border-radius: 4px; background: #ffffff; color: inherit; }
  svg { display: block; width: 100%; margin-top: 12px; touch-action: none; }
  svg text { font-size: 11px; fill: #1f2328; }
  svg text.title { font-size: 12px; font-weight: 600; }
  .grid line { stroke: #d0d7de; stroke-width: 1; }
  .grid line.minor { stroke: #eaeef2; }
  .axes { fill: none; stroke: #57606a; }
  .curve { fill: none; stroke: #0969da; stroke-width: 2; }
  .curve.secondary { stroke: #bf3989; }
  .curve.reference { stroke: #6e7781; stroke-dasharray: 6 4; stroke-width: 1.5; }
  .marker { stroke: #9a6700; stroke-dasharray: 4 3; }
  .probe { stroke: #1f2328; }
  .dot { fill: #1f2328; }
  p { margin: 8px 0 0; }
  table { margin-top: 12px; border-collapse: collapse; }
  th, td { padding: 4px 12px 4px 0; text-align: start; }
  td { font-variant-numeric: tabular-nums; }
`;

/**
 * An engineering chart: the Bode plot of a second-order low-pass filter. Sliders set the cutoff
 * frequency and damping ratio, and a probe (slider or pointer) reads gain and phase at any
 * frequency. The settings are saved as state.
 */
export const bodeSource: MiniAppSource = {
  html: `
    <main aria-labelledby="title">
      <h1 id="title">Second-order low-pass filter</h1>
      <div class="controls">
        <div class="field">
          <label for="cutoff">Cutoff frequency <output id="cutoff-value" for="cutoff"></output></label>
          <input id="cutoff" type="range" min="1" max="4" step="0.01">
        </div>
        <div class="field">
          <label for="damping">Damping ratio ζ <output id="damping-value" for="damping"></output></label>
          <input id="damping" type="range" min="0.05" max="1.5" step="0.01">
        </div>
        <div class="field">
          <label for="probe">Probe frequency <output id="probe-value" for="probe"></output></label>
          <input id="probe" type="range" min="0" max="5" step="0.01">
        </div>
      </div>
      <svg id="bode" viewBox="0 0 560 380" role="img" aria-label="Bode plot: gain and phase against frequency" aria-describedby="readout"></svg>
      <p id="readout" aria-live="polite"></p>
      <p id="peak"></p>
    </main>`,
  css: plotCss,
  script: `${plotKit}
    const inputs = { cutoff: document.getElementById('cutoff'), damping: document.getElementById('damping'), probe: document.getElementById('probe') };
    const state = { cutoff: 3, damping: 0.71, probe: 3, ...(miniApp.state ?? {}) };
    for (const [key, input] of Object.entries(inputs)) input.value = String(state[key]);
    const svg = document.getElementById('bode');
    const magnitudeBox = { left: 56, top: 8, width: 490, height: 150 };
    const phaseBox = { left: 56, top: 196, width: 490, height: 140 };
    const frequencies = { min: 1, max: 1e5, log: true, ticks: [1, 10, 100, 1e3, 1e4, 1e5] };
    frequencies.minor = [];
    for (let decade = 1; decade < 1e5; decade *= 10) {
      for (let step = 2; step < 10; step += 1) frequencies.minor.push(decade * step);
    }

    function formatHz(value) {
      return value >= 1000 ? (value / 1000).toPrecision(3) + ' kHz' : value.toPrecision(3) + ' Hz';
    }
    function response(frequency) {
      const ratio = frequency / 10 ** state.cutoff;
      const real = 1 - ratio * ratio;
      const imaginary = 2 * state.damping * ratio;
      return {
        gain: -10 * Math.log10(real * real + imaginary * imaginary),
        phase: (-Math.atan2(imaginary, real) * 180) / Math.PI,
      };
    }

    function draw() {
      svg.replaceChildren();
      const cutoff = 10 ** state.cutoff;
      const probe = 10 ** state.probe;
      const samples = [];
      for (let index = 0; index <= 400; index += 1) samples.push(10 ** (index / 80));
      const gainPlot = drawFrame(svg, { box: magnitudeBox, x: frequencies, y: { min: -80, max: 20, ticks: linearTicks(-80, 20, 5), title: 'Gain (dB)' } });
      const phasePlot = drawFrame(svg, { box: phaseBox, x: { ...frequencies, title: 'Frequency (Hz)' }, y: { min: -180, max: 0, ticks: [-180, -135, -90, -45, 0], title: 'Phase (°)' } });
      const clampGain = (value) => Math.max(-80, Math.min(20, value));
      node(svg, 'line', { x1: magnitudeBox.left, x2: magnitudeBox.left + magnitudeBox.width, y1: gainPlot.toY(-3), y2: gainPlot.toY(-3), class: 'marker' });
      for (const [plot, box] of [[gainPlot, magnitudeBox], [phasePlot, phaseBox]]) {
        node(svg, 'line', { x1: plot.toX(cutoff), x2: plot.toX(cutoff), y1: box.top, y2: box.top + box.height, class: 'marker' });
      }
      node(svg, 'path', { d: tracePath(samples.map((f) => [f, clampGain(response(f).gain)]), gainPlot.toX, gainPlot.toY), class: 'curve' });
      node(svg, 'path', { d: tracePath(samples.map((f) => [f, response(f).phase]), phasePlot.toX, phasePlot.toY), class: 'curve secondary' });
      const atProbe = response(probe);
      for (const [plot, box, value] of [[gainPlot, magnitudeBox, clampGain(atProbe.gain)], [phasePlot, phaseBox, atProbe.phase]]) {
        node(svg, 'line', { x1: plot.toX(probe), x2: plot.toX(probe), y1: box.top, y2: box.top + box.height, class: 'probe' });
        node(svg, 'circle', { cx: plot.toX(probe), cy: plot.toY(value), r: 4, class: 'dot' });
      }

      document.getElementById('cutoff-value').textContent = formatHz(cutoff);
      document.getElementById('damping-value').textContent = state.damping.toFixed(2);
      document.getElementById('probe-value').textContent = formatHz(probe);
      document.getElementById('readout').textContent =
        'At ' + formatHz(probe) + ': ' + atProbe.gain.toFixed(1) + ' dB, ' + atProbe.phase.toFixed(1) + '°.';
      const peaks = state.damping < Math.SQRT1_2;
      document.getElementById('peak').textContent = peaks
        ? 'Resonance peak: +' + (-20 * Math.log10(2 * state.damping * Math.sqrt(1 - state.damping ** 2))).toFixed(1) +
          ' dB at ' + formatHz(cutoff * Math.sqrt(1 - 2 * state.damping ** 2)) + '.'
        : 'No resonance peak: the filter is damped enough not to ring.';
    }

    function update(change) {
      Object.assign(state, change);
      for (const [key, input] of Object.entries(inputs)) input.value = String(state[key]);
      draw();
      miniApp.setState(state);
    }

    for (const [key, input] of Object.entries(inputs)) {
      input.addEventListener('input', () => update({ [key]: Number(input.value) }));
    }
    svg.addEventListener('pointermove', (event) => {
      const bounds = svg.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width) * 560;
      const share = (x - magnitudeBox.left) / magnitudeBox.width;
      if (share >= 0 && share <= 1) update({ probe: Math.round(share * 500) / 100 });
    });
    draw();`,
};

/**
 * A physics calculator: a projectile launched with a speed, angle and height, flown in a vacuum
 * and through air with quadratic drag (integrated with RK4), plotted and tabulated.
 */
export const projectileSource: MiniAppSource = {
  html: `
    <main aria-labelledby="title">
      <h1 id="title">Projectile with air drag</h1>
      <form class="controls" id="inputs">
        <label>Launch speed (m/s) <input id="speed" type="number" min="1" max="200" step="1"></label>
        <label>Launch angle (°) <input id="angle" type="number" min="1" max="89" step="1"></label>
        <label>Launch height (m) <input id="height" type="number" min="0" max="100" step="0.5"></label>
        <label>Ball mass (kg) <input id="mass" type="number" min="0.01" max="20" step="0.01"></label>
        <label>Ball diameter (cm) <input id="diameter" type="number" min="1" max="50" step="0.5"></label>
        <label>World
          <select id="world">
            <option value="earth">Earth</option>
            <option value="mars">Mars</option>
            <option value="moon">Moon</option>
          </select>
        </label>
      </form>
      <svg id="plot" viewBox="0 0 560 300" role="img" aria-label="Trajectories in a vacuum and with drag"></svg>
      <p>Dashed: in a vacuum. Solid: with air drag (drag coefficient 0.47, a smooth sphere).</p>
      <table>
        <thead><tr><th scope="col">Result</th><th scope="col">In a vacuum</th><th scope="col">With drag</th></tr></thead>
        <tbody id="results"></tbody>
      </table>
    </main>`,
  css: `${plotCss}
    label { display: grid; gap: 4px; }`,
  script: `${plotKit}
    const worlds = {
      earth: { gravity: 9.81, air: 1.225 },
      mars: { gravity: 3.71, air: 0.02 },
      moon: { gravity: 1.62, air: 0 },
    };
    const ids = ['speed', 'angle', 'height', 'mass', 'diameter', 'world'];
    const fields = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
    const start = { speed: 30, angle: 45, height: 1.5, mass: 0.43, diameter: 22, world: 'earth', ...(miniApp.state ?? {}) };
    for (const id of ids) fields[id].value = String(start[id]);

    function read() {
      const values = Object.fromEntries(ids.map((id) => [id, id === 'world' ? fields[id].value : Number(fields[id].value)]));
      return { ...values, ...worlds[values.world] };
    }

    /** Flies the projectile with RK4 until it lands; drag is ½ρCdA|v|v. */
    function fly(input, withDrag) {
      const angle = (input.angle * Math.PI) / 180;
      const radius = input.diameter / 200;
      const k = withDrag ? (0.5 * input.air * 0.47 * Math.PI * radius * radius) / input.mass : 0;
      const g = input.gravity;
      const accelerate = ([, , vx, vy]) => {
        const speed = Math.hypot(vx, vy);
        return [vx, vy, -k * speed * vx, -g - k * speed * vy];
      };
      const vy0 = input.speed * Math.sin(angle);
      const vacuumTime = (vy0 + Math.sqrt(vy0 * vy0 + 2 * g * input.height)) / g;
      const dt = vacuumTime / 2000;
      let s = [0, input.height, input.speed * Math.cos(angle), vy0];
      let time = 0;
      let peak = input.height;
      const points = [[0, input.height]];
      while (time < vacuumTime * 4) {
        const add = (a, b, scale) => a.map((value, index) => value + b[index] * scale);
        const k1 = accelerate(s);
        const k2 = accelerate(add(s, k1, dt / 2));
        const k3 = accelerate(add(s, k2, dt / 2));
        const k4 = accelerate(add(s, k3, dt));
        const next = s.map((value, index) => value + (dt / 6) * (k1[index] + 2 * k2[index] + 2 * k3[index] + k4[index]));
        if (next[1] < 0) {
          const share = s[1] / (s[1] - next[1]);
          const landed = s.map((value, index) => value + (next[index] - value) * share);
          points.push([landed[0], 0]);
          return { points, range: landed[0], peak, time: time + dt * share, impact: Math.hypot(landed[2], landed[3]) };
        }
        s = next;
        time += dt;
        peak = Math.max(peak, s[1]);
        points.push([s[0], s[1]]);
      }
      return { points, range: s[0], peak, time, impact: Math.hypot(s[2], s[3]) };
    }

    function calculate() {
      const input = read();
      if (Object.values(input).some((value) => typeof value === 'number' && !Number.isFinite(value))) return;
      if (input.speed <= 0 || input.mass <= 0 || input.diameter <= 0) return;
      const vacuum = fly(input, false);
      const drag = fly(input, true);
      const svg = document.getElementById('plot');
      svg.replaceChildren();
      const xMax = Math.max(vacuum.range, drag.range) * 1.05;
      const yMax = Math.max(vacuum.peak, drag.peak) * 1.15;
      const plot = drawFrame(svg, {
        box: { left: 56, top: 8, width: 490, height: 240 },
        x: { min: 0, max: xMax, ticks: linearTicks(0, xMax, 6), title: 'Distance (m)' },
        y: { min: 0, max: yMax, ticks: linearTicks(0, yMax, 4), title: 'Height (m)' },
      });
      node(svg, 'path', { d: tracePath(vacuum.points.filter((_, index) => index % 4 === 0 || index === vacuum.points.length - 1), plot.toX, plot.toY), class: 'curve reference' });
      node(svg, 'path', { d: tracePath(drag.points.filter((_, index) => index % 4 === 0 || index === drag.points.length - 1), plot.toX, plot.toY), class: 'curve' });
      const rows = [
        ['Range', (result) => result.range.toFixed(1) + ' m'],
        ['Peak height', (result) => result.peak.toFixed(1) + ' m'],
        ['Flight time', (result) => result.time.toFixed(2) + ' s'],
        ['Impact speed', (result) => result.impact.toFixed(1) + ' m/s'],
      ];
      document.getElementById('results').replaceChildren(...rows.map(([name, format]) => {
        const row = document.createElement('tr');
        const header = document.createElement('th');
        header.scope = 'row';
        header.textContent = name;
        row.append(header);
        for (const result of [vacuum, drag]) {
          const cell = document.createElement('td');
          cell.textContent = format(result);
          row.append(cell);
        }
        return row;
      }));
      const { gravity, air, ...saved } = input;
      miniApp.setState(saved);
    }

    document.getElementById('inputs').addEventListener('input', calculate);
    document.getElementById('inputs').addEventListener('submit', (event) => event.preventDefault());
    calculate();`,
};
