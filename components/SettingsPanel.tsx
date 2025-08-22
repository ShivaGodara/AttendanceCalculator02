'use client';

import { useState } from 'react';
import { Settings } from '@/types';
import { X, Save, Download, Upload, Trash2 } from 'lucide-react';
import Toast from './Toast';

interface Props {
  settings: Settings;
  onUpdateSettings: (settings: Settings) => void;
  onClose: () => void;
  onClearData: () => void;
  onExportData: () => void;
  onImportData: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function SettingsPanel({ settings, onUpdateSettings, onClose, onClearData, onExportData, onImportData }: Props) {
  const [formData, setFormData] = useState<Settings>(settings);
  const [toast, setToast] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);

  const handleSave = () => {
    onUpdateSettings(formData);
    setToast({ type: 'success', message: 'Settings saved successfully!' });
    setTimeout(onClose, 1000);
  };

  const handleChange = (field: keyof Settings, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-screen flex flex-col border dark:border-slate-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Attendance Goals Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 border-b border-gray-200 dark:border-slate-600 pb-2">
              Attendance Goals
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Individual Subject Goal (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.individualGoal}
                  onChange={(e) => handleChange('individualGoal', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                />
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Default goal for new subjects
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Overall Aggregate Goal (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.aggregateGoal}
                  onChange={(e) => handleChange('aggregateGoal', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                />
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  Target for overall percentage
                </p>
              </div>
            </div>
          </div>

          {/* Semester Settings Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 border-b border-gray-200 dark:border-slate-600 pb-2">
              Semester Settings
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Semester End Date
              </label>
              <input
                type="date"
                value={formData.semesterEndDate}
                onChange={(e) => handleChange('semesterEndDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
              />
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Used for calculating remaining working days and predictions
              </p>
            </div>
          </div>

          {/* Data Management Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 border-b border-gray-200 dark:border-slate-600 pb-2">
              Data Management
            </h3>
            <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border dark:border-slate-600">
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <button
                    onClick={onExportData}
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Data</span>
                  </button>
                  <label className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Import Data</span>
                    <input type="file" accept=".json" onChange={onImportData} className="hidden" />
                  </label>
                </div>
                <button
                  onClick={onClearData}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All Data</span>
                </button>
              </div>
            </div>
          </div>

          {/* Holiday Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 border-b border-gray-200 dark:border-slate-600 pb-2">
              Holiday Calculation
            </h3>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border dark:border-blue-800/30">
              <div className="text-sm text-blue-700 dark:text-blue-200 space-y-1">
                <p>• Fixed holidays are automatically excluded</p>
                <p>• Third Saturday of each month is excluded</p>
                <p>• Sundays are excluded from working days</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-slate-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
        
        {/* Toast Notification */}
        {toast && (
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
}