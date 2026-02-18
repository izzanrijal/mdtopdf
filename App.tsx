import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, FileText, Loader2, Link as LinkIcon, Server } from 'lucide-react';
import MarkdownViewer from './components/MarkdownViewer';
import ControlPanel from './components/ControlPanel';
import { ConversionOptions, AppStatus, MarkdownFile } from './types';

// Alamat Backend Express.js
const BACKEND_URL = 'http://localhost:3000';

const DEFAULT_MARKDOWN = `# MD2PDF Viewer

Aplikasi ini terdiri dari dua bagian:
1. **Frontend**: Untuk melihat preview (yang sedang Anda lihat ini).
2. **Backend**: Untuk memproses PDF berkualitas tinggi (Express.js).

## Cara Mengunduh
Klik tombol "Unduh PDF" di sidebar. Aplikasi akan menghubungi Backend di \`${BACKEND_URL}\` untuk membuatkan PDF satu halaman yang rapi.

## Pastikan Server Berjalan
Buka terminal baru dan jalankan:
\`node server.js\`
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

  // Function to load markdown from URL (Client side fetch for preview only)
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
      setErrorMsg('Gagal memuat preview. Pastikan URL bisa diakses publik (CORS). Coba download langsung via Backend.');
      setStatus(AppStatus.ERROR);
    }
  }, []);

  // Check URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fileUrl = params.get('file');

    if (fileUrl && fileUrl.startsWith('http')) {
        loadMarkdownFromUrl(fileUrl);
    }
  }, [loadMarkdownFromUrl]);

  // Handle Download via Backend
  const handleDownload = () => {
    if (!markdownFile.url) {
        alert("Silakan muat URL markdown terlebih dahulu atau masukkan URL di kolom input.");
        return;
    }
    
    // Redirect browser to Backend API
    const targetUrl = `${BACKEND_URL}/?file=${encodeURIComponent(markdownFile.url)}`;
    window.location.href = targetUrl;
  };

  const handleManualUrlSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const url = formData.get('url') as string;
    if (url) {
        try {
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('file', url);
          window.history.pushState({}, '', newUrl);
        } catch (e) { console.warn(e); }
        loadMarkdownFromUrl(url);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      
      {/* Sidebar / Controls */}
      <ControlPanel 
        options={options} 
        setOptions={setOptions} 
        onDownload={handleDownload}
        status={status}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen relative">
        
        {/* Header / Manual Input */}
        <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                        <FileText className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-800">Markdown Preview</h2>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Server className="w-3 h-3" />
                          <span>Backend PDF: {BACKEND_URL}</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleManualUrlSubmit} className="flex-1 w-full md:w-auto flex gap-2">
                    <div className="relative flex-1">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            name="url"
                            type="url" 
                            placeholder="https://raw.githubusercontent.com/..." 
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            defaultValue={markdownFile.url}
                        />
                    </div>
                    <button 
                        type="submit"
                        className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                        Preview
                    </button>
                </form>
            </div>
        </div>

        {/* Error State */}
        {status === AppStatus.ERROR && (
          <div className="max-w-4xl mx-auto mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Masalah Preview</h3>
              <p className="text-sm opacity-90">{errorMsg}</p>
              <button onClick={() => setStatus(AppStatus.IDLE)} className="mt-2 text-xs font-bold hover:underline">Tutup</button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {status === AppStatus.LOADING && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-40 flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Memuat preview...</p>
            </div>
          </div>
        )}

        {/* Preview Area */}
        <div className="flex justify-center pb-24 md:pb-0">
          <div className="relative">
             <MarkdownViewer id="markdown-container" content={markdownFile.content} options={options} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;