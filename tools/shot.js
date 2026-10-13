// Кадры открытия в реальном времени: node tools/shot.js <папка работы> <префикс файлов> <ширина> <высота> <мс после нажатия через запятую>
const {chromium} = require('/home/vibe/.local/share/3d-tools/node_modules/playwright');
(async () => {
  const [page_, out, w, h, times] = process.argv.slice(2);
  const exe = require('child_process').execSync('ls ~/.cache/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell | tail -1').toString().trim();
  const b = await chromium.launch({executablePath: exe, args: ['--no-sandbox']});
  const p = await b.newPage({viewport: {width: +w, height: +h}, deviceScaleFactor: 2});
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('file://' + require('path').resolve(__dirname, '..') + '/' + page_ + '/index.html');
  await p.waitForTimeout(1200);
  await p.screenshot({path: out + '-0.png'});
  if (times) {
    const t0 = Date.now(); await p.click('#opener');
    for (const t of times.split(',')) {
      const d = +t - (Date.now() - t0); if (d > 0) await p.waitForTimeout(d);
      await p.screenshot({path: out + '-' + t + '.png'});
    }
  }
  if (errs.length) console.log('ERRORS', errs);
  await b.close();
})();
