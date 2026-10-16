/* =====================================================================
 * animation.js — 模擬畫面
 * 人物與箱子固定在畫面中間，推動時只捲動背景與地面。
 * 所有座標都使用圖片座標（800 × 500）。
 * ===================================================================== */
const Anim = (() => {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  let el = {};
  let boxIndex = 0;
  let scrollPx = 0;      // 目前捲動距離（圖片座標）
  let rafId = null;

  function init() {
    el = {
      stage: document.getElementById('stage'),
      canvas: document.getElementById('canvas'),
      backdrop: document.getElementById('backdrop'),
      ground: document.getElementById('ground'),
      box: document.getElementById('boxImg'),
      person: document.getElementById('personImg'),
      arrows: document.getElementById('arrows'),
    };
    // 依 cropTop 設定畫面比例（寬 ÷ 可見高度），CSS 用它決定畫面大小
    const visibleH = 500 - CONFIG.animation.cropTop;
    document.getElementById('stage').style.setProperty('--vr', 800 / visibleH);
    // 地面高度比例：圖片中地面線以下的高度 ÷ 圖片寬度
    document.getElementById('stage').style.setProperty('--gr', (500 - CONFIG.images.groundY) / 800);

    // 預先載入所有圖片，避免動畫中閃爍
    const imgs = CONFIG.images;
    [imgs.personPush,imgs.personidle, ...imgs.personWalk, ...imgs.boxes.map(b => b.src),
      ...CONFIG.surfaces.map(s => s.ground).filter(Boolean)]
      .forEach(src => { new Image().src = src; });

    el.person.src = imgs.personidle;
    setBox(0);
    applyScroll();
  }

  function setBox(index) {
    boxIndex = index;
    el.box.src = CONFIG.images.boxes[index].src;
  }

  /* 切換地板：有圖片就用圖片（高度貼齊地面、左右重複），否則用內建 CSS 材質 */
  function setSurface(surface) {
    const g = el.ground.style;
    if (surface.ground) {
      el.ground.dataset.texture = 'image';
      g.backgroundImage = `url("${surface.ground}")`;
      g.backgroundSize = 'auto 100%';
      g.backgroundRepeat = 'repeat-x';
    } else {
      el.ground.dataset.texture = surface.texture;
      g.backgroundImage = g.backgroundSize = g.backgroundRepeat = '';
    }
    el.backdrop.dataset.texture = surface.texture;
  }

  function applyScroll() {
    const scale = el.canvas.clientWidth / 800;
    el.stage.style.setProperty('--scroll', `${-scrollPx * scale}px`);
  }

  /* ---------- 力箭頭 ---------- */
  function drawArrow(group, cx, cy, length, dir, color, label) {
    if (length <= 0.5) return;
    const head = Math.min(18, length);
    const tipX = cx + dir * length;
    const baseX = tipX - dir * head;
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', cx); line.setAttribute('y1', cy);
    line.setAttribute('x2', baseX); line.setAttribute('y2', cy);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', 8);
    line.setAttribute('class', 'arrow-line');
    const tri = document.createElementNS(SVG_NS, 'polygon');
    tri.setAttribute('points', `${tipX},${cy} ${baseX},${cy - 12} ${baseX},${cy + 12}`);
    tri.setAttribute('fill', color);
    tri.setAttribute('class', 'arrow-head');
    const text = document.createElementNS(SVG_NS, 'text');
    // 標籤放在箭頭上方，從箱子中心往箭頭方向排列（推力在右、摩擦力在左）
    text.setAttribute('x', cx + dir * 12);
    text.setAttribute('y', cy + 70);
    text.setAttribute('text-anchor', dir > 0 ? 'start' : 'end');
    text.setAttribute('fill', color);
    text.setAttribute('class', 'arrow-label');
    text.textContent = label;
    group.append(line, tri, text);
  }

  function showArrows(force, friction) {
    hideArrows();
    const [cx, cy] = CONFIG.images.boxes[boxIndex].center;
    const k = CONFIG.animation.arrowPxPerNewton;
    const g = document.createElementNS(SVG_NS, 'g');
    drawArrow(g, cx, cy, force * k, 1, 'var(--push-arrow)', `推力 ${fmtN(force)} N`);
    drawArrow(g, cx, cy, friction * k, -1, 'var(--friction-arrow)', `摩擦力 ${friction.toFixed(1)} N`);
    // 箱子中心點
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', cx); dot.setAttribute('cy', cy); dot.setAttribute('r', 6);
    dot.setAttribute('class', 'arrow-origin');
    g.append(dot);
    el.arrows.append(g);
  }

  function hideArrows() {
    el.arrows.replaceChildren();
  }

  /* ---------- 播放 ----------
   * result：Physics.compute() 的結果，加上 force
   * 回傳 Promise，播放結束後 resolve
   */
  function play(result) {
    stop();
    const ms = CONFIG.animation.seconds * 1000;
    const walk = CONFIG.images.personWalk;
    showArrows(result.force, result.friction);

    return new Promise(resolve => {
      if (result.state !== 'sliding') {
        // 推不動 / 即將滑動：用力推的姿勢＋輕微抖動，箱子不動
        el.person.src = CONFIG.images.personPush;
        el.person.classList.add('strain');
        setTimeout(() => {
          el.person.classList.remove('strain');
          finish(resolve);
        }, ms);
        return;
      }

      // 滑動：等加速運動 d = ½·a·t²，加速度用平方根壓縮到合理的視覺範圍
      const aVis = CONFIG.animation.visualAccelScale * Math.sqrt(result.accel);
      const startScroll = scrollPx;
      const t0 = performance.now();
      let lastFrame = -1;

      const step = now => {
        const t = Math.min((now - t0) / 1000, ms / 1000);
        const d = 0.5 * aVis * t * t;
        scrollPx = startScroll + d;
        applyScroll();
        // 走過的距離越長換越多張 → 速度越快，換圖越快
        const f = Math.floor(d / CONFIG.animation.stridePx) % walk.length;
        if (f !== lastFrame) { el.person.src = walk[f]; lastFrame = f; }

        if (now - t0 < ms) {
          rafId = requestAnimationFrame(step);
        } else {
          rafId = null;
          finish(resolve);
        }
      };
      rafId = requestAnimationFrame(step);
    });
  }

  function finish(resolve) {
    el.person.src = CONFIG.images.personidle;
    hideArrows();
    resolve();
  }

  function stop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  window.addEventListener('resize', applyScroll);

  return { init, setBox, setSurface, play };
})();

function fmtN(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
