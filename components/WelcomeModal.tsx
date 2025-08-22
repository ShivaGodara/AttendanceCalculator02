'use client';

import { X, Upload, Settings, BarChart3 } from 'lucide-react';

interface WelcomeModalProps {
  onClose: () => void;
}

export default function WelcomeModal({ onClose }: WelcomeModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-screen flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Welcome to AI Attendance Tracker</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="text-center mb-6">
            <p className="text-gray-600 dark:text-gray-300">
              Follow these simple steps to track your attendance with AI-powered analysis
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Set Your Goals</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Click the <Settings className="w-4 h-4 inline mx-1" /> settings icon to configure your attendance goals and semester end date.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Upload Screenshots</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Go to the <BarChart3 className="w-4 h-4 inline mx-1" /> Analysis tab and upload screenshots from:
                </p>
                <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded border-l-4 border-yellow-500">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    ⚠️ IMPORTANT: Screenshots must be taken from <strong>Knowledge Pro Portal</strong> only
                  </p>
                  <ul className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 space-y-1">
                    <li>• Attendance Report (from Student Portal)</li>
                    <li>• Timetable/Schedule (from Student Portal)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Analyze & Track</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Click "Analyze Screenshots" to let AI extract your attendance data automatically. View your progress and plan your bunking strategy!
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">📱 Mobile Users</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Take full-screen screenshots of your attendance page. The AI will automatically focus on the important data and ignore browser UI.
            </p>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}