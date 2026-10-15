/* =====================================================================
 * main.js — 總指揮：建立控制區、處理按鈕，串起物理、動畫、圖表三個模組
 * ===================================================================== */
(() => {
  const state = { mi: 0, si: 0, force: CONFIG.force.initial, running: false };
  const $ = id => document.getElementById(id);

  /* ---------- 初始化 ---------- */
  function init() {
    document.title = CONFIG.title;
    $('siteTitle').textContent = CONFIG.title;
    $('footerText').textContent = CONFIG.footer;

    buildSegment($('massSeg'), CONFIG.masses.map(m => `${m} kg`), i => {
      state.mi = i;
      Anim.setBox(i);
      onGroupChange();
    });
    buildSegment($('surfaceSeg'), CONFIG.surfaces.map(s => s.name), i => {
      state.si = i;
      Anim.setSurface(CONFIG.surfaces[i]);
      onGroupChange();
    });

    // 推力滑桿
    const slider = $('forceSlider');
    Object.assign(slider, { min: CONFIG.force.min, max: CONFIG.force.max, step: CONFIG.force.step });
    slider.value = state.force;
    slider.addEventListener('input', () => setForce(Number(slider.value)));
    $('forceMinus').addEventListener('click', () => setForce(state.force - CONFIG.force.step));
    $('forcePlus').addEventListener('click', () => setForce(state.force + CONFIG.force.step));
    setForce(state.force);

    $('startBtn').addEventListener('click', start);
    $('resetBtn').addEventListener('click', confirmReset);
    $('toChart').addEventListener('click', () => {
      $('chartCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    Anim.init();
    Anim.setSurface(CONFIG.surfaces[0]);
    Graph.init();
    Graph.setCurrent(state.mi, state.si);
    setValues(null);
    initTutorial();
  }

  /* 分段按鈕（質量、接觸面） */
  function buildSegment(container, labels, onSelect) {
    labels.forEach((text, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = text;
      b.setAttribute('aria-pressed', i === 0);
      b.addEventListener('click', () => {
        if (state.running) return;
        container.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
        onSelect(i);
      });
      container.append(b);
    });
  }

  function setForce(v) {
    const { min, max, step } = CONFIG.force;
    v = Math.round(Math.min(max, Math.max(min, v)) / step) * step;
    v = Math.round(v * 1000) / 1000;
    state.force = v;
    $('forceSlider').value = v;
    $('forceOut').textContent = `${fmtN(v)} N`;
    $('forceMinus').disabled = state.running || v <= min;
    $('forcePlus').disabled = state.running || v >= max;
  }

  function onGroupChange() {
    Graph.setCurrent(state.mi, state.si);
    clearResult();
  }

  /* ---------- 數值卡：只有動畫播放中才顯示 ---------- */
  function setValues(r) {
    $('forceValue').textContent = r ? `${fmtN(r.force)} N` : '-';
    $('frictionValue').textContent = r ? `${r.friction.toFixed(1)} N` : '-';
  }

  /* ---------- 結果文字 ---------- */
  function showResult(kind, text, withLink) {
    const box = $('result');
    box.dataset.kind = kind;
    $('resultText').textContent = text;
    $('toChart').hidden = !withLink;
    $('toChart').textContent = CONFIG.messages.chartLink;
    box.hidden = false;
  }
  function clearResult() {
    $('result').hidden = true;
  }

  /* ---------- 鎖住控制區 ---------- */
  function lock(on) {
    state.running = on;
    document.querySelectorAll('.controls button, .controls input').forEach(c => { c.disabled = on; });
    $('resetBtn').disabled = on;
    $('startBtn').classList.toggle('is-running', on);
    $('startLabel').textContent = on ? '推動中…' : '開始推';
    if (!on) setForce(state.force);   // 恢復 −／＋ 在上下限時的停用狀態
  }

  /* ---------- 開始推 ---------- */
  async function start() {
    if (state.running) return;
    const { mi, si, force } = state;

    if (Graph.wouldExceed(mi, si, force)) {
      showResult('limit', CONFIG.messages.limit, false);
      return;
    }

    clearResult();
    lock(true);
    const r = Physics.compute(force, CONFIG.masses[mi], CONFIG.surfaces[si]);
    const result = { ...r, force };
    setValues(result);

    await Anim.play(result);

    setValues(null);
    Graph.add(mi, si, force, result.friction);
    showResult(result.state, CONFIG.messages[result.state], true);
    lock(false);
  }

  /* ---------- 重置 ---------- */
  function confirmReset() {
    const dlg = $('confirmDialog');
    $('confirmText').textContent = CONFIG.messages.resetConfirm;
    dlg.showModal();
    dlg.addEventListener('close', () => {
      if (dlg.returnValue === 'ok') {
        Graph.reset();
        clearResult();
      }
    }, { once: true });
  }

  /* ---------- 操作教學 ---------- */
  function initTutorial() {
    const dlg = $('tutorialDialog');
    const pages = CONFIG.tutorial;
    let page = 0;

    const dots = $('tutorialDots');
    pages.forEach(() => dots.append(document.createElement('span')));

    const show = () => {
      $('tutorialTitle').textContent = pages[page].title;
      $('tutorialText').textContent = pages[page].text;
      [...dots.children].forEach((d, i) => d.classList.toggle('on', i === page));
      $('tutorialPrev').hidden = page === 0;
      $('tutorialNext').textContent = page === pages.length - 1 ? '開始實驗' : '下一步';
    };
    const open = () => { page = 0; show(); dlg.showModal(); };

    $('helpBtn').addEventListener('click', open);
    $('tutorialPrev').addEventListener('click', () => { page--; show(); });
    $('tutorialNext').addEventListener('click', () => {
      if (page < pages.length - 1) { page++; show(); } else { dlg.close(); }
    });
    $('tutorialClose').addEventListener('click', () => dlg.close());
    // 點視窗外的暗色區域也可以關閉
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

    // 第一次進入網站自動開啟一次
    const KEY = 'friction-lab-tutorial-seen';
    let seen = false;
    try { seen = localStorage.getItem(KEY) === '1'; } catch (e) { /* 無痕模式等情況 */ }
    if (!seen) {
      open();
      try { localStorage.setItem(KEY, '1'); } catch (e) { /* 忽略 */ }
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
