import React, { useState } from 'react';
import { OfficeConfig } from '../types';
import { Sliders, Save, RotateCcw, Building2 } from 'lucide-react';

interface SettingsModalProps {
  config: OfficeConfig;
  onSaveConfig: (newConfig: OfficeConfig) => void;
  onResetDefault: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ config, onSaveConfig, onResetDefault }) => {
  const [officeName, setOfficeName] = useState(config.officeName);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: OfficeConfig = {
      officeName: officeName.trim() || 'Kantor Pusat',
      paperTypeList: config.paperTypeList,
    };
    onSaveConfig(updated);
    setSavedMessage(true);
    setTimeout(() => {
      setSavedMessage(false);
    }, 2500);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Pengaturan Profil Kantor
            </h3>
            <p className="text-xs text-slate-500">
              Ubah nama perusahaan/instansi yang tertera pada slip dan laporan cetak
            </p>
          </div>
        </div>

        <button
          onClick={onResetDefault}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Default</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {savedMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold">
            ✅ Pengaturan nama kantor berhasil disimpan!
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            Nama Perusahaan / Instansi / Kantor
          </label>
          <input
            type="text"
            value={officeName}
            onChange={(e) => setOfficeName(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Unggul Digital Printing"
            required
          />
          <p className="text-xs text-slate-500 mt-1.5">
            Nama ini akan dicetak pada header slip nota dan laporan audit resmi.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </form>
    </div>
  );
};
