const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Accept dialogs automatically
  page.on('dialog', async dialog => {
    console.log('[DIALOG]', dialog.message());
    await dialog.accept();
  });

  page.on('console', msg => {
    if(msg.text().includes('Bắt đầu') || msg.text().includes('Đã mô phỏng') || msg.text().includes('Hoàn tất') || msg.text().includes('Không còn trận')) {
        console.log('[BROWSER]', msg.text());
    }
  });

  console.log("Navigating to http://localhost:5173...");
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

  // Bypass auth by setting localStorage
  await page.evaluate(() => {
    localStorage.setItem('hd_admin', '1');
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  // 1. Tạo đội mẫu
  console.log("Clicking 'Tạo đội mẫu'...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Tạo đội mẫu'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 3000));

  // 2. Tạo lịch vòng bảng
  console.log("Clicking 'Tạo lịch vòng bảng'...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Tạo lịch vòng bảng'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 3000));

  // 3. Simulate group stage
  console.log("Simulating group stage matches...");
  await page.evaluate(async () => {
    await window.simulateTournament();
  });
  await new Promise(r => setTimeout(r, 8000));

  // 4. Tạo lượt 2 và chung kết
  console.log("Clicking 'Tạo lượt 2 & chung kết'...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Tạo lượt 2 & chung kết'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 3000));

  // 5. Simulate Phase 2 & Finals
  console.log("Simulating Phase 2 & Finals matches...");
  await page.evaluate(async () => {
    await window.simulateTournament();
  });
  await new Promise(r => setTimeout(r, 15000));

  console.log("Reading final rankings and MVP...");
  const data = await page.evaluate(() => {
    // switch to standings tab
    const tabs = Array.from(document.querySelectorAll('.main-tab-btn'));
    const standingsTab = tabs.find(t => t.textContent.includes('Chung cuộc'));
    if(standingsTab) standingsTab.click();
    
    // wait for render
    return new Promise(resolve => {
        setTimeout(() => {
            const rows = Array.from(document.querySelectorAll('.standings-table tbody tr'));
            const standings = rows.map(r => r.innerText.replace(/\t|\n/g, '  ')).slice(0, 16);
            
            // Get MVP
            const mvpDivs = Array.from(document.querySelectorAll('.hero-mvp-item'));
            const mvp = mvpDivs.map(d => d.innerText.replace(/\t|\n/g, ' '));
            
            resolve({ standings, mvp });
        }, 500);
    });
  });
  console.log("\n--- BẢNG XẾP HẠNG CUỐI CÙNG ---");
  data.standings.forEach(r => console.log(r));
  console.log("\n--- BẢNG XẾP HẠNG MVP (Top 5) ---");
  data.mvp.forEach(r => console.log(r));
  
  await browser.close();
  console.log("Simulation complete.");
})();
