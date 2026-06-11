const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    });
    console.log('Browser launched successfully!');
    await browser.close();
    console.log('Browser closed successfully!');
  } catch (e) {
    console.error('Failed to launch browser', e);
  }
})();
