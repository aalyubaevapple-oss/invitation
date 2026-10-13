/* Общий движок приглашения: собирает письмо из window.INVITE, ведёт отсчёт, рисует иллюстрации, открывает экран-заставку. */
(() => {
  const I = window.INVITE, root = document.documentElement;
  const $ = id => document.getElementById(id);
  const when = new Date(I.date), msk = {timeZone: 'Europe/Moscow'};
  const T = Object.assign({count: 'До встречи', place: 'Место', plan: 'Программа дня', dress: 'Дресс-код'}, I.titles || {});

  /* ---------- письмо ---------- */
  const dateText = I.dateFormat === 'long'
    ? when.toLocaleDateString('ru-RU', {...msk, day: 'numeric', month: 'long', year: 'numeric'}).replace(' г.', '')
    : when.toLocaleDateString('ru-RU', {...msk, day: '2-digit', month: '2-digit', year: 'numeric'}).replace(/\./g, I.dateSep || ' · ');
  const weekday = when.toLocaleDateString('ru-RU', {...msk, weekday: 'long'}) + ', начало в ' +
    when.toLocaleTimeString('ru-RU', {...msk, hour: '2-digit', minute: '2-digit'});
  const rule = '<div class="rule"><i></i></div>';
  const art = I.art === 'none' ? '' : I.art === 'html' ? I.artHtml : I.art === 'route'
    ? `<svg class="route" viewBox="0 0 320 110" role="img" aria-label="Маршрут к свадьбе">
        <path d="M24 86 Q160 -24 296 86" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="3 6" stroke-linecap="round"/>
        <circle cx="24" cy="86" r="4.5" fill="currentColor"/><circle cx="296" cy="86" r="4.5" fill="none" stroke="currentColor" stroke-width="1.6"/>
        <path d="M0-9 3-2 12 2 12 4 3 3 2 9 5 11 5 12 0 11-5 12-5 11-2 9-3 3-12 4-12 2-3-2Z" transform="translate(160 31) rotate(90) scale(1.25)" fill="var(--accent)"/>
        <text x="24" y="105" font-size="9" text-anchor="middle" fill="currentColor" letter-spacing="1.5">${I.route[0]}</text>
        <text x="296" y="105" font-size="9" text-anchor="middle" fill="currentColor" letter-spacing="1.5">${I.route[1]}</text>
      </svg>`
    : `<canvas class="scene" width="760" height="470" data-kind="${I.art}" data-seed="${I.seed || 11}" role="img" aria-label="${I.artLabel || 'Иллюстрация'}"></canvas>`;

  /* ---------- календарь ---------- */
  const z = n => String(n).padStart(2, '0');
  const stamp = d => d.getUTCFullYear() + z(d.getUTCMonth() + 1) + z(d.getUTCDate()) + 'T' + z(d.getUTCHours()) + z(d.getUTCMinutes()) + '00Z';
  const esc = t => String(t).replace(/[\\;,]/g, '\\$&');
  const couple = I.names.join(' ' + (I.joiner || 'и') + ' ');
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//wedding-invitation//RU', 'BEGIN:VEVENT',
    'UID:' + when.getTime() + '@wedding-invitation', 'DTSTAMP:' + stamp(new Date()),
    'DTSTART:' + stamp(when), 'DTEND:' + stamp(new Date(when.getTime() + (I.hours || 7) * 36e5)),
    'SUMMARY:' + esc('Свадьба: ' + couple), 'LOCATION:' + esc(I.location || I.venues[0].place),
    'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const icsHref = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);

  const letter = $('letter');
  if (I.left) letter.classList.add('left');
  letter.innerHTML = `
    <section class="cover">
      <div class="label">${I.eyebrow || 'Приглашение на свадьбу'}</div>
      <h1><span>${I.names[0]}</span><span class="amp">${I.joiner || 'и'}</span><span>${I.names[1]}</span></h1>
      ${art}
      <div class="dateline">${dateText}</div>
      <div class="label">${weekday}</div>
    </section>
    <section class="rv">${rule}<p>${I.lead}</p></section>
    <section class="rv">
      <h2>${T.count}</h2>
      <div class="count">
        <div><b id="cd">0</b><span id="cdl">дней</span></div><div><b id="ch">0</b><span id="chl">часов</span></div>
        <div><b id="cm">0</b><span id="cml">минут</span></div><div><b id="cs">0</b><span id="csl">секунд</span></div>
      </div>
      <a class="btn" href="${icsHref}" download="wedding.ics">Добавить в календарь</a>
    </section>
    <section class="rv">
      <h2>${T.place}</h2>
      <div class="venues">${I.venues.map((v, i) => `
        <div class="venue">
          ${v.kind ? `<canvas width="640" height="320" data-kind="${v.kind}" data-seed="${(I.seed || 11) + i + 3}" role="img" aria-label="${v.title}: набросок"></canvas>` : ''}
          <h3>${v.title}</h3>
          <div class="when">${v.time} · ${v.place}</div>
          <div class="addr">${v.address}</div>
          ${v.mapUrl ? `<a class="btn sm" href="${v.mapUrl}" target="_blank" rel="noopener">Маршрут</a>` : ''}
        </div>`).join('')}</div>
    </section>
    <section class="rv">
      <h2>${T.plan}</h2>
      <ol class="plan">${I.plan.map(([t, s]) => `<li><time>${t}</time><span>${s}</span></li>`).join('')}</ol>
    </section>
    <section class="rv">
      <h2>${T.dress}</h2>
      <div class="dress"><p>${I.dress}</p>
        <div class="sw" aria-label="Палитра праздника">${I.swatches.map(c => `<i style="background:${c}"></i>`).join('')}</div>
      </div>
    </section>
    <section class="rv">${rule}<p>${I.bye}</p>
      <div class="sign">${couple}</div>
      <button class="again" id="again" type="button">Открыть заново</button>
    </section>`;
  document.body.insertAdjacentHTML('beforeend', '<a class="back" href="../">← Все приглашения</a>');

  /* ---------- обратный отсчёт ---------- */
  const plural = (n, f) => f[n % 10 === 1 && n % 100 !== 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2];
  function tick() {
    let s = Math.max(0, Math.floor((when - Date.now()) / 1000));
    const d = Math.floor(s / 86400); s -= d * 86400;
    const h = Math.floor(s / 3600); s -= h * 3600;
    const m = Math.floor(s / 60); s -= m * 60;
    $('cd').textContent = d; $('cdl').textContent = plural(d, ['день', 'дня', 'дней']);
    $('ch').textContent = h; $('chl').textContent = plural(h, ['час', 'часа', 'часов']);
    $('cm').textContent = m; $('cml').textContent = plural(m, ['минута', 'минуты', 'минут']);
    $('cs').textContent = s; $('csl').textContent = plural(s, ['секунда', 'секунды', 'секунд']);
  }
  tick(); setInterval(tick, 1000);

  /* ---------- иллюстрации ---------- */
  function rng(seed) {
    return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function paint(cv) {
    const kind = cv.dataset.kind, c = cv.getContext('2d'), W = cv.width, H = cv.height, r = rng(+cv.dataset.seed * 7919);
    const css = getComputedStyle(root), col = n => css.getPropertyValue(n).trim();
    const sky = col('--w-sky'), l1 = col('--w-leaf1'), l2 = col('--w-leaf2'), water = col('--w-water'),
          bloom = col('--w-bloom'), reed = col('--w-reed'), ink = col('--ink'), paper = col('--paper');
    c.clearRect(0, 0, W, H);
    // пятно краски: несколько неровных прозрачных слоёв
    const blob = (x, y, rx, ry, color, a, layers = 4) => {
      c.fillStyle = color;
      for (let k = 0; k < layers; k++) {
        c.globalAlpha = a * (.6 + r() * .6);
        const n = 9, pts = [];
        for (let i = 0; i < n; i++) {
          const an = i / n * Math.PI * 2, j = .72 + r() * .5;
          pts.push([x + Math.cos(an) * rx * j, y + Math.sin(an) * ry * j]);
        }
        c.beginPath();
        for (let i = 0; i <= n; i++) {
          const p = pts[i % n], q = pts[(i + 1) % n], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
          i ? c.quadraticCurveTo(p[0], p[1], mx, my) : c.moveTo(mx, my);
        }
        c.fill();
      }
      c.globalAlpha = 1;
    };
    const hz = H * .5;

    if (kind === 'night') {            // ночной сад с гирляндами
      for (let i = 0; i < 150; i++) {
        c.globalAlpha = .25 + r() * .7; c.fillStyle = r() > .6 ? bloom : ink;
        c.beginPath(); c.arc(r() * W, r() * H * .62, .5 + r() * 1.3, 0, 7); c.fill();
      }
      c.globalAlpha = 1;
      for (let i = 0; i < 34; i++) { const s = 30 + r() * 50; blob(r() * W, H * .8 - r() * 40, s, s * .8, l2, .16); }
      for (let i = 0; i < 12; i++) blob(r() * W, H * .92, 120, 26, l1, .14, 3);
      for (let g = 0; g < 3; g++) {
        const y0 = H * (.2 + g * .12), sag = 46 + r() * 30, n = 15 + g * 2;
        c.strokeStyle = ink; c.globalAlpha = .3; c.lineWidth = 1;
        c.beginPath(); c.moveTo(-10, y0); c.quadraticCurveTo(W / 2, y0 + sag * 2, W + 10, y0 - 12 + g * 10); c.stroke();
        for (let i = 1; i < n; i++) {
          const u = i / n, x = (1 - u) * (1 - u) * -10 + 2 * u * (1 - u) * W / 2 + u * u * (W + 10),
                y = (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * (y0 + sag * 2) + u * u * (y0 - 12 + g * 10) + 5;
          const gr = c.createRadialGradient(x, y, 0, x, y, 20);
          gr.addColorStop(0, bloom); gr.addColorStop(1, 'transparent');
          c.globalAlpha = .5; c.fillStyle = gr; c.beginPath(); c.arc(x, y, 20, 0, 7); c.fill();
          c.globalAlpha = 1; c.fillStyle = bloom; c.beginPath(); c.arc(x, y, 2.6, 0, 7); c.fill();
        }
      }
      c.globalAlpha = 1;
      return;
    }

    for (let i = 0; i < 14; i++) blob(r() * W, r() * hz * .9, W * .22, H * .16, sky, .09);
    for (let i = 0; i < 46; i++) {     // дальний берег
      const x = r() * W, s = 22 + r() * 46;
      blob(x, hz - s * .55 - r() * 14, s, s * .8, r() > .45 ? l1 : l2, .11);
    }
    for (let i = 0; i < 26; i++) blob(r() * W, hz + 8 + r() * (H - hz), W * (.12 + r() * .2), 7 + r() * 9, water, .12, 3);
    for (let i = 0; i < 16; i++) blob(r() * W, hz + 10 + r() * 46, 40 + r() * 50, 9, l2, .05, 2);

    if (kind === 'river') {            // лодка
      const bx = W * .56, by = hz + 62;
      c.globalAlpha = .55; c.fillStyle = ink;
      c.beginPath(); c.moveTo(bx - 58, by - 9); c.quadraticCurveTo(bx, by + 17, bx + 62, by - 11);
      c.quadraticCurveTo(bx, by + 2, bx - 58, by - 9); c.fill();
      c.globalAlpha = .12; c.fillRect(bx - 50, by + 12, 104, 2); c.globalAlpha = 1;
    }
    if (kind === 'ceremony') {         // арка из зелени
      const ax = W / 2, ay = hz + 44, R = H * .3;
      for (let i = 0; i <= 44; i++) {
        const an = Math.PI + i / 44 * Math.PI, x = ax + Math.cos(an) * R * .82, y = ay + Math.sin(an) * R * 1.15;
        blob(x, y, 13, 12, i % 3 ? l2 : l1, .2, 3);
        if (i % 4 === 1) blob(x + (r() - .5) * 10, y + (r() - .5) * 10, 6, 6, bloom, .5, 2);
      }
    }
    if (kind === 'dinner') {           // шатёр и гирлянда
      const tx = W / 2, ty = hz - 78, tw = W * .27;
      c.fillStyle = paper; c.globalAlpha = .82;
      c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx + tw, ty + 62); c.lineTo(tx - tw, ty + 62); c.closePath(); c.fill();
      c.globalAlpha = .5; c.fillRect(tx - tw * .86, ty + 62, tw * 1.72, 62);
      c.globalAlpha = .45; c.strokeStyle = ink; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx + tw, ty + 62); c.lineTo(tx - tw, ty + 62); c.closePath(); c.stroke();
      for (const k of [-.86, -.3, .3, .86]) { c.beginPath(); c.moveTo(tx + tw * k, ty + 62); c.lineTo(tx + tw * k, ty + 124); c.stroke(); }
      c.globalAlpha = 1;
      for (let i = 0; i <= 16; i++) {
        const u = i / 16, x = tx - tw * .86 + u * tw * 1.72, y = ty + 70 + Math.sin(u * Math.PI) * 16;
        blob(x, y, 4.5, 4.5, bloom, .7, 2);
      }
    }
    c.lineCap = 'round';               // травы и цветы по краям
    for (const side of [0, 1]) for (let i = 0; i < 26; i++) {
      const x = side ? W - r() * W * .3 : r() * W * .3, y0 = H - r() * 20, h = H * (.2 + r() * .36), lean = (r() - .5) * 46;
      c.globalAlpha = .45 + r() * .3; c.strokeStyle = reed; c.lineWidth = 1.2 + r() * 1.6;
      c.beginPath(); c.moveTo(x, y0); c.quadraticCurveTo(x + lean * .3, y0 - h * .6, x + lean, y0 - h); c.stroke();
      c.globalAlpha = 1;
      if (i % 5 === 0) blob(x + lean, y0 - h, 3.6, 12, ink, .22, 2);
      else if (i % 3 === 0) blob(x + lean, y0 - h, 8, 8, bloom, .42, 3);
    }
    for (let i = 0; i < 16; i++) blob(r() * W, H - r() * 34, 46, 16, l1, .1, 3);
  }
  document.querySelectorAll('canvas[data-kind]').forEach(paint);

  /* ---------- экран открытия ---------- */
  const op = $('opener'), ms = +(op.dataset.ms || 2000);
  let timer, enter;
  root.classList.add('locked');
  function open() {
    if (op.classList.contains('open')) return;
    op.classList.add('open');
    clearTimeout(timer);
    timer = setTimeout(() => { op.hidden = true; root.classList.remove('locked'); }, ms);
    enter = setTimeout(() => letter.classList.add('entered'), Math.max(0, ms - 550));
  }
  op.addEventListener('click', open);
  op.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  $('again').addEventListener('click', () => {
    clearTimeout(timer); clearTimeout(enter);
    letter.classList.remove('entered');
    window.scrollTo(0, 0);
    root.classList.add('locked');
    op.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => op.classList.remove('open')));
  });

  /* ---------- сцена открытия слегка поворачивается за указателем ---------- */
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches, tilt = op.querySelector('[data-tilt]');
  if (tilt && !calm) op.addEventListener('pointermove', e => {
    if (op.classList.contains('open')) return;
    tilt.style.setProperty('--ry', ((e.clientX / innerWidth - .5) * 14).toFixed(1) + 'deg');
    tilt.style.setProperty('--rx', ((.5 - e.clientY / innerHeight) * 10).toFixed(1) + 'deg');
  });

  /* ---------- параллакс обложки ---------- */
  const scene = letter.querySelector('.cover .scene, .cover .pair');
  if (scene && !calm) {
    let busy = false;
    addEventListener('scroll', () => {
      if (busy) return; busy = true;
      requestAnimationFrame(() => { scene.style.translate = '0 ' + (Math.min(scrollY, 700) * .14).toFixed(1) + 'px'; busy = false; });
    }, {passive: true});
  }

  /* ---------- появление блоков ---------- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), {threshold: .15});
    document.querySelectorAll('.rv').forEach(el => io.observe(el));
  } else document.querySelectorAll('.rv').forEach(el => el.classList.add('in'));
})();
