import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, FileText, Loader2, Link as LinkIcon, Server, Download } from 'lucide-react';
import MarkdownViewer from './components/MarkdownViewer';
import ControlPanel from './components/ControlPanel';
import { ConversionOptions, AppStatus, MarkdownFile } from './types';

const BACKEND_URL = 'http://localhost:3000';

const DEFAULT_MARKDOWN = `# MD2PDF Viewer

Aplikasi ini menggunakan **Backend Express** untuk konversi Markdown ke PDF satu halaman.

## Status
- **Backend URL**: \`${BACKEND_URL}\`
- **Mode**: Server-Side Rendering (Puppeteer)

## Cara Menggunakan
1. Masukkan URL markdown di kolom atas.
2. Klik "Preview" untuk melihat isi.
3. Klik "Unduh PDF" untuk memproses di server.

Atau gunakan URL langsung:
\`http://localhost:3000/?file=URL_MARKDOWN\`
`;

function App() {
  const [markdownFile, setMarkdownFile] = useState<MarkdownFile>({
    url: '',
    content: DEFAULT_MARKDOWN,
    filename: 'document'
  });
  
  const [options, setOptions] = useState<ConversionOptions>({
    fontSize: 'medium',
    columns: 1,
    darkMode: false
  });

  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [autoDownloadTriggered, setAutoDownloadTriggered] = useState(false);

  // Load preview only
  const loadMarkdownFromUrl = useCallback(async (url: string) => {
    setStatus(AppStatus.LOADING);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Gagal mengambil file (${response.status})`);
      const text = await response.text();
      
      const urlParts = url.split('/');
      const filename = urlParts[urlParts.length - 1].replace('.md', '') || 'download';

      setMarkdownFile({ url, content: text, filename });
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Gagal memuat preview. Namun Anda tetap bisa mencoba tombol Unduh PDF.');
      // Tetap simpan URL agar tombol download backend berfungsi
      setMarkdownFile(prev => ({...prev, url}));
      setStatus(AppStatus.ERROR);
    }
  }, []);

  // Check params & Auto Download
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fileUrl = params.get('file');

    if (fileUrl && fileUrl.startsWith('http') && !autoDownloadTriggered) {
        // 1. Load Preview
        loadMarkdownFromUrl(fileUrl);
        
        // 2. Trigger Backend Download automatically after 1s
        setAutoDownloadTriggered(true);
        setTimeout(() => {
           window.location.href = `${BACKEND_URL}/?file=${encodeURIComponent(fileUrl)}`;
        }, 1500); 
    }
  }, [loadMarkdownFromUrl, autoDownloadTriggered]);

  const handleDownload = () => {
    if (!markdownFile.url) {
        alert("Masukkan URL Markdown terlebih dahulu.");
        return;
    }
    window.location.href = `${BACKEND_URL}/?file=${encodeURIComponent(markdownFile.url)}`;
  };

  const handleManualUrlSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const url = formData.get('url') as string;
    if (url) {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('file', url);
        window.history.pushState({}, '', newUrl);
        loadMarkdownFromUrl(url);
        // Reset auto download trigger for manual submission to allow manual download click
        setAutoDownloadTriggered(true); 
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      
      <ControlPanel 
        options={options} 
        setOptions={setOptions} 
        onDownload={handleDownload}
        status={status}
      />

      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen relative">
        
        {/* Auto Download Banner */}
        {autoDownloadTriggered && status !== AppStatus.ERROR && (
           <div className="max-w-4xl mx-auto mb-4 bg-indigo-600 text-white px-4 py-3 rounded-lg shadow-md flex items-center justify-between animate-bounce-short">
              <div className="flex items-center gap-3">
                 <Loader2 className="w-5 h-5 animate-spin" />
                 <span className="font-medium">Sedang mengunduh PDF dari server...</span>
              </div>
              <span className="text-xs opacity-80">Jika tidak mulai, klik tombol Unduh.</span>
           </div>
        )}

        {/* Input Header */}
        <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                        <Server className="w-6 h-6 text-green-700" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-800">MD2PDF Service</h2>
                        <p className="text-xs text-gray-500">Backend: Port 3000</p>
                    </div>
                </div>

                <form onSubmit={handleManualUrlSubmit} className="flex-1 w-full md:w-auto flex gap-2">
                    <input 
                        name="url"
                        type="url" 
                        placeholder="https://..." 
                        className="flex-1 min-w-[200px] px-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-500"
                        defaultValue={markdownFile.url}
                    />
                    <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700">
                        Muat
                    </button>
                </form>
            </div>
        </div>

        {status === AppStatus.ERROR && (
          <div className="max-w-4xl mx-auto mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
             <p className="font-bold">{errorMsg}</p>
          </div>
        )}

        {status === AppStatus.LOADING && (
          <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
             <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        )}

        <div className="flex justify-center pb-24 md:pb-0 opacity-75 grayscale-[0.5] pointer-events-none select-none">
          <div className="relative">
             <div className="absolute top-0 right-0 bg-yellow-300 text-yellow-900 text-xs px-2 py-1 font-bold z-10">PREVIEW ONLY</div>
             <MarkdownViewer id="markdown-container" content={markdownFile.content} options={options} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;