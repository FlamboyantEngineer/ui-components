import type { MiniAppSource } from '../../src/components/mini-app/index.js';

/** Plain, legible defaults every sample shares, since the host stylesheet stops at the frame. */
const baseCss = `
  :root { color: #1f2328; background: #ffffff; font: 15px/1.4 system-ui, sans-serif; }
  body { margin: 0; padding: 16px; }
  h1 { margin: 0 0 12px; font-size: 17px; }
  label { display: grid; gap: 4px; }
  input, button { font: inherit; }
  input { padding: 4px 6px; border: 1px solid #6e7781; border-radius: 4px; }
  button { padding: 4px 12px; border: 1px solid #1f6feb; border-radius: 4px; color: #ffffff; background: #0969da; }
  button[aria-pressed='false'] { color: #0550ae; background: #ffffff; }
  :focus-visible { outline: 2px solid #0969da; outline-offset: 2px; }
`;

/**
 * A loan payment calculator: it reads its inputs, computes the monthly payment, asks the host to
 * format it through the `formatMoney` capability, and saves its inputs as state.
 */
export const calculatorSource: MiniAppSource = {
  html: `
    <main aria-labelledby="title">
      <h1 id="title">Loan payment</h1>
      <form id="calculator">
        <label>Amount <input id="amount" type="number" min="0" step="100" required></label>
        <label>Yearly rate (%) <input id="rate" type="number" min="0" max="50" step="0.1" required></label>
        <label>Years <input id="years" type="number" min="1" max="40" step="1" required></label>
        <button type="submit">Calculate</button>
      </form>
      <p>Monthly payment: <output id="payment" for="amount rate years">–</output></p>
    </main>`,
  css: `${baseCss}
    form { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; align-items: end; }
    p { margin: 16px 0 0; }
    output { font-weight: 600; }`,
  script: `
    const fields = ['amount', 'rate', 'years'].map((id) => document.getElementById(id));
    const output = document.getElementById('payment');
    const start = miniApp.state ?? { amount: 20000, rate: 4.5, years: 5 };
    fields.forEach((field) => { field.value = String(start[field.id]); });

    async function calculate() {
      const [amount, rate, years] = fields.map((field) => Number(field.value));
      const months = years * 12;
      const monthly = rate / 100 / 12;
      const payment = monthly === 0 ? amount / months : (amount * monthly) / (1 - (1 + monthly) ** -months);
      output.textContent = await miniApp.call('formatMoney', Math.round(payment * 100) / 100);
      miniApp.setState({ amount, rate, years });
    }

    document.getElementById('calculator').addEventListener('submit', (event) => {
      event.preventDefault();
      void calculate();
    });
    void calculate();`,
};

/**
 * An interactive bar chart drawn in SVG: buttons switch the year, a slider moves the highlight
 * threshold, and both are saved as state so a restart restores them.
 */
export const chartSource: MiniAppSource = {
  html: `
    <main aria-labelledby="title">
      <h1 id="title">Monthly visitors</h1>
      <div role="group" aria-label="Year">
        <button type="button" data-year="previous">Last year</button>
        <button type="button" data-year="current">This year</button>
      </div>
      <label>Highlight months above <output id="threshold-value"></output>
        <input id="threshold" type="range" min="0" max="100" step="5">
      </label>
      <svg id="chart" viewBox="0 0 360 140" role="img"></svg>
      <p id="summary"></p>
    </main>`,
  css: `${baseCss}
    [role='group'] { display: flex; gap: 8px; margin-bottom: 12px; }
    svg { display: block; width: 100%; max-width: 480px; margin-top: 12px; }
    rect { fill: #8c959f; }
    rect.high { fill: #0969da; }
    text { font-size: 9px; fill: #1f2328; }
    p { margin: 8px 0 0; }`,
  script: `
    const data = {
      previous: [42, 38, 51, 47, 60, 72, 80, 77, 64, 55, 49, 58],
      current: [48, 45, 59, 66, 71, 85, 93, 90, 70, 61, 57, 69],
    };
    const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    const state = { year: 'current', threshold: 60, ...(miniApp.state ?? {}) };
    const chart = document.getElementById('chart');
    const slider = document.getElementById('threshold');
    const buttons = [...document.querySelectorAll('[data-year]')];
    slider.value = String(state.threshold);

    function draw() {
      const values = data[state.year];
      const above = values.filter((value) => value > state.threshold).length;
      chart.setAttribute('aria-label', (state.year === 'current' ? 'This year' : 'Last year') + ': ' + values.join(', '));
      chart.innerHTML = values.map((value, index) => {
        const x = 8 + index * 29;
        const height = value * 1.1;
        const high = value > state.threshold ? ' class="high"' : '';
        return '<rect x="' + x + '" y="' + (120 - height) + '" width="20" height="' + height + '"' + high + '></rect>' +
          '<text x="' + (x + 6) + '" y="134">' + months[index] + '</text>';
      }).join('');
      buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.year === state.year)));
      document.getElementById('threshold-value').textContent = String(state.threshold);
      document.getElementById('summary').textContent = above + ' of 12 months above ' + state.threshold + '.';
    }

    function update(change) {
      Object.assign(state, change);
      draw();
      miniApp.setState(state);
    }

    buttons.forEach((button) => button.addEventListener('click', () => update({ year: button.dataset.year })));
    slider.addEventListener('input', () => update({ threshold: Number(slider.value) }));
    draw();`,
};

/** The outcomes the state matrix shows, each a small source. */
export const outcomeSources = {
  ready: {
    html: '<main aria-labelledby="title"><h1 id="title">Ready</h1><p>Ready to use.</p></main>',
    css: baseCss,
  },
  'script error': {
    html: '<main aria-labelledby="title"><h1 id="title">Rates</h1><p>Starting…</p></main>',
    css: baseCss,
    script: "throw new Error('The rate table is missing.');",
  },
  timeout: {
    html: '<main aria-labelledby="title"><h1 id="title">Slow tool</h1><p>Never ready in time.</p></main>',
    css: baseCss,
  },
} satisfies Record<string, MiniAppSource>;
