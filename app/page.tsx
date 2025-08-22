'use client';

import { useState, useEffect } from 'react';
import { Subject, Settings, AppData } from '@/types';
import { saveToLocalStorage, loadFromLocalStorage } from '@/lib/utils';
import AnalysisTab from '@/components/AnalysisTab';
import BunkPlannerTab from '@/components/BunkPlannerTab';
import LeaveAnalysisTab from '@/components/LeaveAnalysisTab';
import SettingsPanel from '@/components/SettingsPanel';
import { Settings as SettingsIcon, BarChart3, Calendar, FileText, Sun, Moon } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('analysis');
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [appData, setAppData] = useState<AppData>({
    subjects: [],
    settings: {
      individualGoal: 75,
      aggregateGoal: 75,
      semesterEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    timetable: []
  });

  useEffect(() => {
    const saved = loadFromLocalStorage('attendanceData');
    if (saved) {
      setAppData(saved);
    }
    const savedDarkMode = loadFromLocalStorage('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(savedDarkMode);
    }
  }, []);

  useEffect(() => {
    setSaveStatus('saving');
    try {
      saveToLocalStorage('attendanceData', appData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('saved'), 2000);
    } catch {
      setSaveStatus('error');
    }
  }, [appData]);

  useEffect(() => {
    saveToLocalStorage('darkMode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const updateSubjects = (subjects: Subject[]) => {
    setAppData(prev => ({ ...prev, subjects }));
  };

  const updateSettings = (settings: Settings) => {
    setAppData(prev => ({ ...prev, settings }));
  };

  const clearAllData = () => {
    setAppData({
      subjects: [],
      settings: {
        individualGoal: 75,
        aggregateGoal: 75,
        semesterEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      timetable: []
    });
    setShowClearDialog(false);
  };

  const exportData = () => {
    const dataStr = JSON.stringify(appData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.subjects && data.settings) {
          setAppData(data);
        }
      } catch {
        alert('Invalid file format');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const tabs = [
    { id: 'analysis', label: 'Analysis', icon: BarChart3 },
    { id: 'bunk-planner', label: 'Bunk Planner', icon: Calendar },
    { id: 'leave-analysis', label: 'Leave Analysis', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Attendance Tracker</h1>
            <div className="flex items-center space-x-2">
              {/* Save Status */}
              <div className="flex items-center space-x-1 text-xs">
                {saveStatus === 'saving' && (
                  <div className="animate-spin w-3 h-3 border border-blue-600 border-t-transparent rounded-full"></div>
                )}
                <span className={`${
                  saveStatus === 'saved' ? 'text-green-600 dark:text-green-400' :
                  saveStatus === 'saving' ? 'text-blue-600 dark:text-blue-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Error'}
                </span>
              </div>
              
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <SettingsIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'analysis' && (
          <AnalysisTab
            subjects={appData.subjects}
            settings={appData.settings}
            onUpdateSubjects={updateSubjects}
          />
        )}
        {activeTab === 'bunk-planner' && (
          <BunkPlannerTab
            subjects={appData.subjects}
            settings={appData.settings}
          />
        )}
        {activeTab === 'leave-analysis' && (
          <LeaveAnalysisTab subjects={appData.subjects} />
        )}
      </main>

      {showSettings && (
        <SettingsPanel
          settings={appData.settings}
          onUpdateSettings={updateSettings}
          onClose={() => setShowSettings(false)}
          onClearData={() => setShowClearDialog(true)}
          onExportData={exportData}
          onImportData={importData}
        />
      )}

      {/* Clear Data Confirmation Dialog */}
      {showClearDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Clear All Data</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              This will permanently delete all subjects, settings, and data. This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowClearDialog(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={clearAllData}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}