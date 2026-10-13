// Письмо целиком, без экрана открытия: node tools/full.js <префикс файлов> <ширина> <папка работы>...
const {chromium} = require('/home/vibe/.local/share/3d-tools/node_modules/playwright');
(async () => {
  const [out, w, ...pages] = process.argv.slice(2);
  const exe = require('child_process').execSync('ls ~/.cache/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell | tail -1').toString().trim();
  const b = await chromium.launch({executablePath: exe, args: ['--no-sandbox']});
  for (const pg of pages) {
    const p = await b.newPage({viewport: {width: +w, height: 800}});
    p.on('pageerror', e => console.log(pg, 'ERROR', e.message));
    await p.goto('file://' + require('path').resolve(__dirname, '..') + '/' + pg + '/index.html');
    await p.waitForTimeout(1200);
    await p.evaluate(() => { document.getElementById('opener').hidden = true; document.documentElement.classList.remove('locked');
      document.getElementById('letter').classList.add('entered'); document.querySelectorAll('.rv').forEach(e => e.classList.add('in'));
      document.querySelectorAll('details').forEach((d, i) => d.open = i === 0); });
    await p.waitForTimeout(1300);
    await p.screenshot({path: out + '-' + pg + '.png', fullPage: true});
    await p.close();
  }
  await b.close();
})();
