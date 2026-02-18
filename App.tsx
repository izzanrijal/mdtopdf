import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, FileText, Loader2, Link as LinkIcon } from 'lucide-react';
import MarkdownViewer from './components/MarkdownViewer';
import ControlPanel from './components/ControlPanel';
import { generateSinglePagePDF } from './utils/pdfGenerator';
import { ConversionOptions, AppStatus, MarkdownFile } from './types';

const DEFAULT_MARKDOWN = `# Selamat Datang di MD2PDF OnePage

Ini adalah contoh tampilan markdown. Gunakan parameter URL \`?file=URL_MARKDOWN\` untuk memuat file Anda sendiri.

## Fitur Utama
- **Satu Halaman**: Algoritma cerdas akan mengecilkan konten agar muat dalam satu halaman A4.
- **Kolom Otomatis**: Gunakan fitur kolom untuk memadatkan teks.
- **Responsif**: Pratinjau langsung di browser Anda.

## Cara Menggunakan API
Cukup tambahkan parameter \`file\` pada URL aplikasi ini.
Contoh: \`app.com/?file=https://raw.githubusercontent.com/username/repo/main/README.md\`

## Catatan
Aplikasi ini berjalan sepenuhnya di sisi klien (browser) untuk performa maksimal dan privasi.`;

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
  const [isAutoDownload, setIsAutoDownload] = useState<boolean>(false);

  // Function to load markdown from URL
  const loadMarkdownFromUrl = useCallback(async (url: string) => {
    setStatus(AppStatus.LOADING);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Gagal mengambil file (${response.status})`);
      
      const text = await response.text();
      
      // Try to guess filename from URL
      const urlParts = url.split('/');
      const filename = urlParts[urlParts.length - 1].replace('.md', '') || 'download';

      setMarkdownFile({
        url,
        content: text,
        filename
      });
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Terjadi kesalahan saat memuat markdown.');
      setStatus(AppStatus.ERROR);
    }
  }, []);

  // Check URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fileUrl = params.get('file');

    if (fileUrl) {
      // Validate URL simple check
      if (fileUrl.startsWith('http')) {
        setIsAutoDownload(true); // Flag to trigger download after load
        loadMarkdownFromUrl(fileUrl);
      } else {
        setErrorMsg('URL tidak valid. Harap gunakan http:// atau https://');
        setStatus(AppStatus.ERROR);
      }
    }
  }, [loadMarkdownFromUrl]);

  // Auto Download Effect
  useEffect(() => {
    if (status === AppStatus.SUCCESS && isAutoDownload) {
      // Set status to generating
      setStatus(AppStatus.GENERATING_PDF);
      
      // Wait for DOM to fully paint (images, fonts, layout)
      const timer = setTimeout(async () => {
        try {
          await generateSinglePagePDF('markdown-container', markdownFile.filename);
          setStatus(AppStatus.SUCCESS);
          setIsAutoDownload(false); // Reset flag so it doesn't loop
        } catch (err) {
          console.error(err);
          setErrorMsg('Gagal melakukan auto-download PDF.');
          setStatus(AppStatus.ERROR);
        }
      }, 1500); // 1.5s delay to ensure rendering is complete

      return () => clearTimeout(timer);
    }
  }, [status, isAutoDownload, markdownFile.filename]);

  const handleDownload = async () => {
    setStatus(AppStatus.GENERATING_PDF);
    // Small delay to allow UI to update
    setTimeout(async () => {
      try {
        await generateSinglePagePDF('markdown-container', markdownFile.filename);
        setStatus(AppStatus.SUCCESS);
      } catch (err) {
        console.error(err);
        setErrorMsg('Gagal membuat PDF. Silakan coba lagi.');
        setStatus(AppStatus.ERROR);
      }
    }, 100);
  };

  const handleManualUrlSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const url = formData.get('url') as string;
    if (url) {
        // Update URL param without reload
        try {
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('file', url);
          window.history.pushState({}, '', newUrl);
        } catch (e) {
          // Ignore security errors in sandboxed environments (e.g. blob: URLs)
          console.warn('Could not update URL history:', e);
        }
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
                        <h2 className="font-bold text-gray-800">Markdown Viewer</h2>
                        <p className="text-xs text-gray-500">API: ?file=URL</p>
                    </div>
                </div>

                <form onSubmit={handleManualUrlSubmit} className="flex-1 w-full md:w-auto flex gap-2">
                    <div className="relative flex-1">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            name="url"
                            type="url" 
                            placeholder="https://..." 
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            defaultValue={markdownFile.url}
                        />
                    </div>
                    <button 
                        type="submit"
                        className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                        Muat
                    </button>
                </form>
            </div>
        </div>

        {/* Error State */}
        {status === AppStatus.ERROR && (
          <div className="max-w-4xl mx-auto mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-700 animate-fade-in">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Terjadi Kesalahan</h3>
              <p className="text-sm opacity-90">{errorMsg}</p>
              <button 
                onClick={() => setStatus(AppStatus.IDLE)} 
                className="mt-2 text-xs font-bold hover:underline"
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {status === AppStatus.LOADING && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-40 flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Memuat konten markdown...</p>
            </div>
          </div>
        )}

         {/* Auto Generating State Overlay */}
         {isAutoDownload && status === AppStatus.GENERATING_PDF && (
          <div className="absolute inset-0 bg-indigo-900/10 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl shadow-xl text-center">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                <h3 className="font-bold text-gray-800 text-lg">Mengunduh PDF...</h3>
                <p className="text-gray-500 text-sm">Sedang memproses satu halaman.</p>
            </div>
          </div>
        )}

        {/* Preview Area */}
        <div className="flex justify-center pb-24 md:pb-0">
          <div className="relative">
             {/* Paper Shadow Effect */}
             <div className="absolute inset-0 bg-gray-900/5 translate-y-2 translate-x-2 rounded-sm blur-sm" />
             
             {/* The Actual Content */}
             <MarkdownViewer 
                id="markdown-container" 
                content={markdownFile.content} 
                options={options} 
             />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;