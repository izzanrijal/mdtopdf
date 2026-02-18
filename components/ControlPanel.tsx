import React from 'react';
import { Settings, FileDown, Type, Columns, Moon, Sun } from 'lucide-react';
import { ConversionOptions, AppStatus } from '../types';

interface ControlPanelProps {
  options: ConversionOptions;
  setOptions: React.Dispatch<React.SetStateAction<ConversionOptions>>;
  onDownload: () => void;
  status: AppStatus;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ options, setOptions, onDownload, status }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50 md:sticky md:top-0 md:bottom-auto md:h-screen md:w-80 md:border-r md:border-t-0 md:flex md:flex-col">
      <div className="mb-6 hidden md:block">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-600" />
          Pengaturan PDF
        </h1>
        <p className="text-sm text-gray-500 mt-1">Sesuaikan tampilan agar muat 1 halaman.</p>
      </div>

      <div className="flex flex-row md:flex-col gap-4 overflow-x-auto md:overflow-visible pb-2 md:pb-0 items-center md:items-stretch justify-between md:justify-start">
        
        {/* Font Size Control */}
        <div className="flex flex-col gap-2 min-w-[120px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <Type className="w-4 h-4" /> Ukuran Font
          </label>
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['small', 'medium', 'large'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setOptions(prev => ({ ...prev, fontSize: size }))}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  options.fontSize === size 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {size === 'small' ? 'Kecil' : size === 'medium' ? 'Sedang' : 'Besar'}
              </button>
            ))}
          </div>
        </div>

        {/* Columns Control */}
        <div className="flex flex-col gap-2 min-w-[120px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <Columns className="w-4 h-4" /> Kolom
          </label>
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[1, 2, 3].map((col) => (
              <button
                key={col}
                onClick={() => setOptions(prev => ({ ...prev, columns: col as 1|2|3 }))}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  options.columns === col 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {col}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Toggle (Visual Only) */}
        <div className="flex flex-col gap-2 min-w-[80px]">
           <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            Tema
          </label>
          <button
            onClick={() => setOptions(prev => ({ ...prev, darkMode: !prev.darkMode }))}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              options.darkMode 
                ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' 
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {options.darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            {options.darkMode ? 'Gelap' : 'Terang'}
          </button>
        </div>

        <div className="md:mt-auto pt-4 md:border-t md:border-gray-200 w-full md:w-auto">
          <button
            onClick={onDownload}
            disabled={status === AppStatus.GENERATING_PDF || status === AppStatus.LOADING}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-semibold"
          >
            {status === AppStatus.GENERATING_PDF ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <FileDown className="w-5 h-5" />
                Unduh PDF (1 Hal)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;