/* =====================================================================
 * graph.js — 推力－摩擦力折線圖（使用 Chart.js）
 * 每一組「質量 × 接觸面」是一條線；顏色代表接觸面、深淺與點形狀代表質量。
 * 同一組相同推力只保留最新的一筆（覆蓋舊數據）。
 * ===================================================================== */
const Graph = (() => {
  const groups = new Map();   // key "質量索引-介面索引" → { mi, si, points: Map(推力 → 摩擦力), hidden }
  let chart = null;
  let current = { mi: 0, si: 0 };
  let range = CONFIG.chart.ranges[0];
  let el = {};

  const key = (mi, si) => `${mi}-${si}`;

  function colorOf(mi, si) {
    const list = CONFIG.chart.colors[CONFIG.surfaces[si].name] || [];
    return list[mi] || '#888780';
  }
  function shapeOf(mi) {
    const s = CONFIG.chart.pointShapes;
    return s[mi] || s[s.length - 1];
  }
  function labelOf(mi, si) {
    return `${CONFIG.masses[mi]} kg・${CONFIG.surfaces[si].name}`;
  }

  function init() {
    el = {
      canvas: document.getElementById('chartCanvas'),
      legend: document.getElementById('legend'),
      ranges: document.getElementById('rangeButtons'),
      count: document.getElementById('recordCount'),
      empty: document.getElementById('chartEmpty'),
    };
    el.empty.textContent = CONFIG.messages.chartEmpty;
    buildRangeButtons();
    buildChart();
    render();
  }

  function buildRangeButtons() {
    CONFIG.chart.ranges.forEach((r, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = `0–${r}`;
      b.setAttribute('aria-pressed', i === 0);
      b.addEventListener('click', () => {
        range = r;
        el.ranges.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
        applyRange();
        chart.update();
      });
      el.ranges.append(b);
    });
  }

  function tickStep(r) {
    if (r <= 5) return 1;
    if (r <= 10) return 2;
    return 5;
  }

  function applyRange() {
    ['x', 'y'].forEach(ax => {
      chart.options.scales[ax].max = range;
      chart.options.scales[ax].ticks.stepSize = tickStep(range);
    });
  }

  function buildChart() {
    const axisColor = '#5F5E5A';
    const gridColor = 'rgba(95, 94, 90, 0.15)';
    const axis = title => ({
      type: 'linear',
      min: 0,
      max: range,
      title: { display: true, text: title, color: axisColor, font: { size: 13 } },
      ticks: { stepSize: tickStep(range), color: axisColor },
      grid: { color: gridColor },
    });

    chart = new Chart(el.canvas, {
      type: 'line',
      data: { datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 250 },
        clip: 6,
        // 觸控時找出最接近的推力，列出所有組在該推力的數值（重疊的組也看得到）
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: items => `推力 ${fmtN(items[0].parsed.x)} N`,
              label: c => `${c.dataset.label}：摩擦力 ${c.parsed.y.toFixed(1)} N`,
            },
          },
        },
        scales: { x: axis('推力 (N)'), y: axis('摩擦力 (N)') },
      },
    });
  }

  /* 依目前紀錄重建所有線條與圖例 */
  function render() {
    const curKey = key(current.mi, current.si);
    const list = [...groups.values()].filter(g => g.points.size > 0);

    // Chart.js 先畫後面的資料集，所以目前組別放在第一個，才會疊在最上層
    list.sort((a, b) => (key(b.mi, b.si) === curKey) - (key(a.mi, a.si) === curKey));

    chart.data.datasets = list.map(g => {
      const isCur = key(g.mi, g.si) === curKey;
      const color = colorOf(g.mi, g.si);
      const shape = shapeOf(g.mi);
      const data = [...g.points.entries()]
        .map(([x, y]) => ({ x, y }))
        .sort((a, b) => a.x - b.x);
      return {
        label: labelOf(g.mi, g.si),
        data,
        hidden: g.hidden,
        borderColor: color,
        borderWidth: isCur ? 3.5 : 1.75,
        pointStyle: shape.style,
        pointRadius: shape.radius,
        pointHoverRadius: shape.radius + 2,
        pointBorderWidth: isCur ? 2.5 : 1.75,
        pointBorderColor: color,
        pointBackgroundColor: shape.filled ? color : 'transparent',
        tension: 0,
      };
    });
    chart.update();

    renderLegend(list, curKey);
    el.count.textContent = `已記錄 ${count()} / ${CONFIG.maxRecords} 筆`;
    el.empty.hidden = count() > 0;
  }

  function renderLegend(list, curKey) {
    el.legend.replaceChildren();
    const shown = [...list];
    // 目前組別即使還沒有數據，也先列在圖例中，讓學生知道會用什麼顏色和形狀
    if (!shown.some(g => key(g.mi, g.si) === curKey)) {
      shown.unshift({ mi: current.mi, si: current.si, hidden: false, empty: true });
    }
    shown.sort((a, b) => a.si - b.si || a.mi - b.mi);

    shown.forEach(g => {
      const isCur = key(g.mi, g.si) === curKey;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'legend-item';
      if (isCur) b.classList.add('is-current');
      if (g.hidden) b.classList.add('is-hidden');
      b.setAttribute('aria-pressed', !g.hidden);
      b.title = g.empty ? '尚無數據' : '點一下可隱藏／顯示這條線';
      b.innerHTML = symbolSVG(g.mi, colorOf(g.mi, g.si)) +
        `<span>${labelOf(g.mi, g.si)}${isCur ? '（目前）' : ''}</span>`;
      if (!g.empty) {
        b.addEventListener('click', () => {
          const grp = groups.get(key(g.mi, g.si));
          grp.hidden = !grp.hidden;
          render();
        });
      } else {
        b.disabled = true;
      }
      el.legend.append(b);
    });
  }

  function symbolSVG(mi, color) {
    const s = shapeOf(mi);
    const fill = s.filled ? color : 'none';
    const common = `fill="${fill}" stroke="${color}" stroke-width="2"`;
    let shape;
    if (s.style === 'triangle') shape = `<polygon points="10,3 17,16 3,16" ${common}/>`;
    else if (s.style === 'rect') shape = `<rect x="3.5" y="3.5" width="13" height="13" ${common}/>`;
    else if (s.style === 'rectRot') shape = `<polygon points="10,2 18,10 10,18 2,10" ${common}/>`;
    else shape = `<circle cx="10" cy="10" r="${s.filled ? 5 : 7}" ${common}/>`;
    return `<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">` +
      `<line x1="0" y1="10" x2="20" y2="10" stroke="${color}" stroke-width="2"/>${shape}</svg>`;
  }

  function count() {
    let n = 0;
    groups.forEach(g => { n += g.points.size; });
    return n;
  }

  /* 新增這一筆是否會超過上限（覆蓋舊數據不算新增） */
  function wouldExceed(mi, si, force) {
    const g = groups.get(key(mi, si));
    const isOverwrite = g && g.points.has(force);
    return !isOverwrite && count() >= CONFIG.maxRecords;
  }

  function add(mi, si, force, friction) {
    const k = key(mi, si);
    if (!groups.has(k)) groups.set(k, { mi, si, points: new Map(), hidden: false });
    const g = groups.get(k);
    g.points.set(force, friction);
    g.hidden = false;
    render();
  }

  function setCurrent(mi, si) {
    current = { mi, si };
    render();
  }

  function reset() {
    groups.clear();
    render();
  }

  return { init, add, setCurrent, reset, wouldExceed, count };
})();
