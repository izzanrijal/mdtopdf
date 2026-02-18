const express = require('express');
const puppeteer = require('puppeteer');
const axios = require('axios');
const { marked } = require('marked');
const cors = require('cors'); // Enable CORS if installed, or just handle via simple headers

const app = express();
const PORT = 3000;

// Allow CORS so Frontend can check status if needed (optional)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/', async (req, res) => {
  const fileUrl = req.query.file;

  if (!fileUrl) {
    return res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1>MD2PDF Backend Service</h1>
        <p>Backend siap.</p>
        <p>Gunakan parameter <code>?file=URL_MARKDOWN</code> untuk mengunduh PDF.</p>
      </div>
    `);
  }

  try {
    console.log(`[Processing] Fetching: ${fileUrl}`);
    
    // 1. Fetch Markdown with timeout
    const response = await axios.get(fileUrl, { timeout: 10000 });
    const markdownText = response.data;

    // 2. Convert to HTML
    const htmlContent = marked.parse(markdownText);

    // 3. Build HTML
    const finalHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
        <style>
          @page { size: A4; margin: 0; }
          body { font-family: sans-serif; padding: 20px; width: 210mm; background: white; }
          .markdown-body {
            font-size: 11px; 
            line-height: 1.4;
            column-count: 2; 
            column-gap: 25px;
            text-align: justify;
          }
          .markdown-body h1 { font-size: 1.8em; margin-bottom: 0.5em; column-span: all; border-bottom: 1px solid #ddd; }
          .markdown-body h2 { font-size: 1.4em; margin-top: 1em; break-after: avoid; color: #333; }
          .markdown-body pre { background: #f1f5f9; padding: 8px; border-radius: 4px; overflow-x: hidden; white-space: pre-wrap; word-wrap: break-word; }
          .markdown-body img { max-width: 100%; height: auto; display: block; margin: 10px auto; }
          /* Force images to not break layout */
          .markdown-body p { margin-bottom: 1em; }
        </style>
      </head>
      <body>
        <div class="markdown-body">
          ${htmlContent}
        </div>
      </body>
      </html>
    `;

    // 4. Puppeteer Process
    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // PENTING: Menggunakan 'domcontentloaded' jauh lebih cepat daripada 'networkidle0'
    // Ini mencegah loading macet jika ada gambar eksternal yang lambat
    await page.setContent(finalHtml, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });

    // Sedikit delay untuk memastikan rendering tailwind selesai
    await new Promise(r => setTimeout(r, 1000));

    // 5. Intelligent Scaling
    const contentHeight = await page.evaluate(() => document.body.scrollHeight);
    const A4HeightPx = 1100;
    
    let scaleFactor = 1.0;
    if (contentHeight > A4HeightPx) {
      scaleFactor = A4HeightPx / contentHeight;
      // Jangan terlalu kecil
      scaleFactor = Math.max(0.5, scaleFactor);
    }

    console.log(`[Generated] Height: ${contentHeight}, Scale: ${scaleFactor}`);

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      scale: scaleFactor,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
    });

    await browser.close();

    const filename = fileUrl.split('/').pop().replace('.md', '') || 'document';
    
    // Headers agar browser langsung download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
    res.send(pdfBuffer);
    console.log(`[Success] Sent PDF for ${filename}`);

  } catch (error) {
    console.error('[Error]', error.message);
    res.status(500).send(`Gagal: ${error.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 SERVER SIAP! Akses di: http://localhost:${PORT}`);
  console.log(`Contoh: http://localhost:${PORT}/?file=https://raw.githubusercontent.com/adam-p/markdown-here/master/README.md\n`);
});