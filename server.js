const express = require('express');
const puppeteer = require('puppeteer');
const axios = require('axios');
const { marked } = require('marked');

const app = express();
const PORT = 3000;

// Allow CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/', async (req, res) => {
  const fileUrl = req.query.file;

  if (!fileUrl) {
    return res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1>MD2PDF Backend Ready</h1>
        <p>Gunakan: <code>/?file=URL_MARKDOWN</code></p>
      </div>
    `);
  }

  let browser = null;

  try {
    console.log(`[Start] Request: ${fileUrl}`);
    
    // 1. Fetch Markdown (Timeout 5 detik saja cukup)
    const response = await axios.get(fileUrl, { timeout: 5000 });
    const markdownText = response.data || "";

    if (!markdownText) throw new Error("File markdown kosong");

    // 2. Convert to HTML
    const htmlContent = marked.parse(markdownText);

    // 3. Build HTML dengan CSS Inline (TANPA CDN/External Request)
    // Ini mencegah loading terus menerus jika jaringan server lambat
    const finalHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page { size: A4; margin: 0; }
          
          body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10px; /* Ukuran font dasar kecil untuk pemadatan */
            line-height: 1.4;
            color: #1a1a1a;
            background: white;
            padding: 15mm; /* Margin kertas */
            width: 210mm;
            box-sizing: border-box;
          }

          /* Layout 2 Kolom Padat */
          .content {
            column-count: 2;
            column-gap: 10mm;
            column-fill: auto;
            text-align: justify;
            width: 100%;
          }

          /* Elemen Typography */
          h1 {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 12px;
            padding-bottom: 5px;
            border-bottom: 2px solid #333;
            column-span: all; /* Judul membentang lebar */
            color: #000;
          }

          h2 {
            font-size: 14px;
            font-weight: 700;
            margin-top: 15px;
            margin-bottom: 8px;
            color: #2563eb;
            break-after: avoid; /* Jangan putus setelah judul */
          }

          h3 {
            font-size: 12px;
            font-weight: 600;
            margin-top: 10px;
            margin-bottom: 5px;
          }

          p { margin-bottom: 8px; }
          
          ul, ol { 
            padding-left: 20px; 
            margin-bottom: 8px; 
          }
          
          li { margin-bottom: 2px; }

          /* Code block styling sederhana */
          pre {
            background: #f1f5f9;
            padding: 8px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 9px;
            white-space: pre-wrap;
            word-wrap: break-word;
            margin-bottom: 10px;
            break-inside: avoid; /* Usahakan code block tidak terpotong */
            border: 1px solid #e2e8f0;
          }

          code {
            font-family: 'Courier New', monospace;
            background: #f1f5f9;
            padding: 1px 3px;
            border-radius: 2px;
            font-size: 0.95em;
          }

          blockquote {
            border-left: 3px solid #cbd5e1;
            padding-left: 10px;
            margin: 0 0 10px 0;
            color: #475569;
            font-style: italic;
          }

          img {
            max-width: 100%;
            height: auto;
            margin: 10px 0;
            display: block;
            border-radius: 4px;
          }

          a { color: #2563eb; text-decoration: none; }
          
          /* Utility untuk tabel */
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            font-size: 9px;
          }
          th, td {
            border: 1px solid #e2e8f0;
            padding: 4px;
            text-align: left;
          }
          th { background-color: #f8fafc; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="content">
          ${htmlContent}
        </div>
      </body>
      </html>
    `;

    // 4. Puppeteer Process
    browser = await puppeteer.launch({
      headless: "new",
      // Args penting untuk environment server/docker/windows
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // Mencegah crash memori
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set viewport A4
    await page.setViewport({ width: 794, height: 1123 }); // ~96 DPI A4

    // LOAD HTML: Karena tidak ada external resource (CDN), gunakan 'load' event
    // ini lebih cepat dan pasti selesai.
    await page.setContent(finalHtml, { 
      waitUntil: 'load',
      timeout: 10000 
    });

    // 5. Intelligent Scaling Logic
    const contentHeight = await page.evaluate(() => document.body.scrollHeight);
    const A4HeightPx = 1123; // Tinggi A4 standar di 96 DPI
    const safeHeight = A4HeightPx - 100; // Kurangi margin
    
    let scaleFactor = 1.0;
    
    // Jika konten lebih panjang dari 1 halaman, kecilkan scale
    if (contentHeight > safeHeight) {
      scaleFactor = safeHeight / contentHeight;
      // Batas minimal scale agar masih terbaca (0.5 = 50%)
      scaleFactor = Math.max(0.5, scaleFactor);
    }

    console.log(`[PDF Info] Height: ${contentHeight}, Scale: ${scaleFactor.toFixed(2)}`);

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      scale: scaleFactor,
      margin: { top: '0', bottom: '0', left: '0', right: '0' }, // Margin sudah diatur di CSS body
      preferCSSPageSize: true
    });

    // Clean filename
    const filename = (fileUrl.split('/').pop().split('?')[0] || 'document').replace(/[^a-zA-Z0-9-_]/g, '');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
    res.send(pdfBuffer);
    
    console.log(`[Success] Sent ${filename}.pdf`);

  } catch (error) {
    console.error('[Error]', error.message);
    res.status(500).send(`Gagal memproses PDF: ${error.message}`);
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 SERVER STABIL SIAP!`);
  console.log(`Jalankan di browser: http://localhost:${PORT}/?file=https://raw.githubusercontent.com/adam-p/markdown-here/master/README.md\n`);
});