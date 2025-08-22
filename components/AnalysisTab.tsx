'use client';

import { useState, useEffect } from 'react';
import { Subject, Settings } from '@/types';
import { calculatePercentage, getAttendanceStatus, getStatusColor, calculateRequiredClasses, getRemainingWorkingDays, isWorkingDay } from '@/lib/utils';
import { analyzeTimetable, analyzeAttendance } from '@/lib/gemini';
import { Upload, Plus, Trash2, AlertCircle, RefreshCw, X } from 'lucide-react';
import Toast from './Toast';
import EnhancedUpload from './EnhancedUpload';

interface Props {
  subjects: Subject[];
  settings: Settings;
  onUpdateSubjects: (subjects: Subject[]) => void;
}

export default function AnalysisTab({ subjects, settings, onUpdateSubjects }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryFunction, setRetryFunction] = useState<(() => void) | null>(null);

  const [toast, setToast] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setError(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addSubject = () => {
    const newSubject: Subject = {
      id: Date.now().toString(),
      name: 'New Subject',
      attended: 0,
      total: 0,
      goal: settings.individualGoal
    };
    onUpdateSubjects([...subjects, newSubject]);
  };

  const updateSubject = (id: string, field: keyof Subject, value: string | number) => {
    const updated = subjects.map(subject =>
      subject.id === id ? { ...subject, [field]: value } : subject
    );
    onUpdateSubjects(updated);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent, callback?: () => void) => {
    if (e.key === 'Enter' && callback) {
      callback();
    }
  };

  const deleteSubject = (id: string) => {
    onUpdateSubjects(subjects.filter(s => s.id !== id));
  };

  const handleEnhancedAnalyze = async (files: any[]) => {
    setLoading(true);
    setError(null);
    
    try {
      for (const uploadedFile of files) {
        if (uploadedFile.type === 'timetable' || uploadedFile.type === 'auto') {
          const result = await analyzeTimetable(uploadedFile.file);
          console.log('Timetable analyzed:', result);
          setToast({ type: 'success', message: 'Timetable analyzed successfully!' });
        }
        
        if (uploadedFile.type === 'attendance' || uploadedFile.type === 'auto') {
          const result = await analyzeAttendance(uploadedFile.file);
          if (result.subjects && result.subjects.length > 0) {
            const newSubjects = result.subjects.map((s: any) => ({
              id: Date.now().toString() + Math.random(),
              name: s.name,
              attended: s.attended,
              total: s.total,
              goal: settings.individualGoal
            }));
            onUpdateSubjects([...subjects, ...newSubjects]);
            setToast({ type: 'success', message: `Successfully added ${newSubjects.length} subjects!` });
          }
        }
      }
    } catch (error) {
      console.error('Error analyzing files:', error);
      setError('Failed to analyze files. Please check your API key and try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateAggregate = () => {
    if (subjects.length === 0) return { percentage: 0, attended: 0, total: 0 };
    
    const totalAttended = subjects.reduce((sum, s) => sum + s.attended, 0);
    const totalHeld = subjects.reduce((sum, s) => sum + s.total, 0);
    
    return {
      percentage: calculatePercentage(totalAttended, totalHeld),
      attended: totalAttended,
      total: totalHeld
    };
  };

  const aggregate = calculateAggregate();
  const aggregateStatus = getAttendanceStatus(
    aggregate.percentage,
    settings.aggregateGoal,
    aggregate.attended,
    aggregate.total,
    settings.semesterEndDate
  );

  const getStatusMessage = (subject: Subject) => {
    const percentage = calculatePercentage(subject.attended, subject.total);
    const status = getAttendanceStatus(percentage, subject.goal, subject.attended, subject.total, settings.semesterEndDate);
    
    if (status === 'safe') return 'Goal met';
    if (status === 'danger') return 'Goal impossible';
    
    const required = calculateRequiredClasses(subject.attended, subject.total, subject.goal);
    
    // Calculate target date
    const today = new Date();
    const targetDate = new Date(today);
    let workingDaysAdded = 0;
    
    while (workingDaysAdded < required) {
      targetDate.setDate(targetDate.getDate() + 1);
      if (isWorkingDay(targetDate)) {
        workingDaysAdded++;
      }
    }
    
    return `Goal by ${targetDate.toLocaleDateString()} (${required} classes)`;
  };

  const getAggregateStatusMessage = () => {
    if (aggregateStatus === 'safe') return 'Goal achieved!';
    
    if (aggregateStatus === 'danger') {
      const required = calculateRequiredClasses(aggregate.attended, aggregate.total, settings.aggregateGoal);
      const remainingDays = getRemainingWorkingDays(settings.semesterEndDate);
      const shortfall = required - remainingDays;
      return `Impossible. Missed by ${shortfall} hours.`;
    }
    
    const required = calculateRequiredClasses(aggregate.attended, aggregate.total, settings.aggregateGoal);
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + required);
    
    // Skip weekends and holidays
    let workingDaysAdded = 0;
    while (workingDaysAdded < required) {
      targetDate.setDate(targetDate.getDate() + 1);
      if (isWorkingDay(targetDate)) {
        workingDaysAdded++;
      }
    }
    
    return `Goal will be reached by ${targetDate.toLocaleDateString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-red-800 dark:text-red-200">{error}</span>
            </div>
            <div className="flex space-x-2">
              {retryFunction && (
                <button
                  onClick={retryFunction}
                  className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              )}
              <button
                onClick={() => setError(null)}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Enhanced AI Upload Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">AI-Powered Data Entry</h2>
        <EnhancedUpload
          onAnalyze={handleEnhancedAnalyze}
          loading={loading}
        />
      </div>

      {/* Aggregate Summary */}
      <div className={`rounded-lg border-2 p-6 ${getStatusColor(aggregateStatus)} dark:bg-opacity-30 dark:border-opacity-60`}>
        <h2 className="text-xl font-bold mb-2">Overall Attendance</h2>
        <div className="text-3xl font-bold mb-2">
          {aggregate.percentage.toFixed(1)}%
        </div>
        <p className="text-sm">
          {aggregate.attended} / {aggregate.total} hours attended
        </p>
        <p className="text-sm mt-1">
          Goal: {settings.aggregateGoal}% • {getAggregateStatusMessage()}
        </p>
      </div>

      {/* Subject Cards */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Individual Subjects</h2>
          <button
            onClick={addSubject}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subject</span>
          </button>
        </div>

        {subjects.map((subject) => {
          const percentage = calculatePercentage(subject.attended, subject.total);
          const status = getAttendanceStatus(percentage, subject.goal, subject.attended, subject.total, settings.semesterEndDate);
          
          return (
            <div key={subject.id} className={`rounded-lg border-2 p-4 ${getStatusColor(status)}`}>
              <div className="flex justify-between items-start mb-3">
                <input
                  type="text"
                  value={subject.name}
                  onChange={(e) => updateSubject(subject.id, 'name', e.target.value)}
                  onKeyDown={(e) => handleInputKeyDown(e)}
                  className="text-lg font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-white"
                />
                <button
                  onClick={() => deleteSubject(subject.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-200">Attended</label>
                  <input
                    type="number"
                    value={subject.attended}
                    onChange={(e) => updateSubject(subject.id, 'attended', parseInt(e.target.value) || 0)}
                    onKeyDown={(e) => handleInputKeyDown(e)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-200">Total</label>
                  <input
                    type="number"
                    value={subject.total}
                    onChange={(e) => updateSubject(subject.id, 'total', parseInt(e.target.value) || 0)}
                    onKeyDown={(e) => handleInputKeyDown(e)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-200">Goal (%)</label>
                  <input
                    type="number"
                    value={subject.goal}
                    onChange={(e) => updateSubject(subject.id, 'goal', parseInt(e.target.value) || 0)}
                    onKeyDown={(e) => handleInputKeyDown(e)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-500 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Current</label>
                  <div className="text-lg font-bold">{percentage.toFixed(1)}%</div>
                </div>
              </div>
              
              <p className="text-sm font-medium">{getStatusMessage(subject)}</p>
            </div>
          );
        })}

        {subjects.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>No subjects added yet. Upload an attendance report or add subjects manually.</p>
          </div>
        )}
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
  );
}