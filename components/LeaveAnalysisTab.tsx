'use client';

import { useState, useEffect } from 'react';
import { analyzeLeaves } from '@/lib/gemini';
import { calculatePercentage } from '@/lib/utils';
import { Subject } from '@/types';
import { Upload, Trash2, Scan, Calculator, AlertCircle, RefreshCw, X } from 'lucide-react';
import Toast from './Toast';

interface LeaveCount {
  cocurricular: number;
  medical: number;
  attendance?: {
    attended: number;
    total: number;
  };
}

interface Props {
  subjects: Subject[];
}

export default function LeaveAnalysisTab({ subjects }: Props) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [leaveCount, setLeaveCount] = useState<LeaveCount | null>(null);
  const [currentAttended, setCurrentAttended] = useState(0);
  const [currentTotal, setCurrentTotal] = useState(0);
  const [extractedAttendance, setExtractedAttendance] = useState<{attended: number, total: number} | null>(null);

  // Auto-fill from Analysis tab data
  useEffect(() => {
    if (subjects.length > 0) {
      const totalAttended = subjects.reduce((sum, s) => sum + s.attended, 0);
      const totalHeld = subjects.reduce((sum, s) => sum + s.total, 0);
      if (totalAttended > 0 && totalHeld > 0) {
        setCurrentAttended(totalAttended);
        setCurrentTotal(totalHeld);
      }
    }
  }, [subjects]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'scan' | 'calculate'>('upload');
  const [error, setError] = useState<string | null>(null);
  const [retryFunction, setRetryFunction] = useState<(() => void) | null>(null);
  const [toast, setToast] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const scanLeaves = async () => {
    if (uploadedFiles.length === 0) return;

    const scanFunction = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await analyzeLeaves(uploadedFiles);
        setLeaveCount(result);
        if (result.attendance) {
          setExtractedAttendance(result.attendance);
          setCurrentAttended(result.attendance.attended);
          setCurrentTotal(result.attendance.total);
        }
        setStep('scan');
        setToast({ type: 'success', message: 'Leave analysis completed successfully!' });
        console.log('Leave analysis result:', result);
      } catch (error) {
        console.error('Error analyzing leaves:', error);
        setError('Failed to analyze leaves. Please check your API key and try again.');
        setRetryFunction(() => scanFunction);
      } finally {
        setLoading(false);
      }
    };

    await scanFunction();
  };

  const calculatePotential = () => {
    if (!leaveCount) return null;

    const originalPercentage = calculatePercentage(currentAttended, currentTotal);
    const totalLeaveHours = leaveCount.cocurricular + leaveCount.medical;
    const newAttended = currentAttended + totalLeaveHours;
    const newPercentage = calculatePercentage(newAttended, currentTotal);

    return {
      original: originalPercentage,
      potential: newPercentage,
      improvement: newPercentage - originalPercentage,
      totalLeaves: totalLeaveHours
    };
  };

  const results = calculatePotential();

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
      {/* Upload Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:shadow-gray-900/50 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Upload Absence Details Screenshots</h2>
        
        <div className="mb-4">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            id="leave-upload"
          />
          <label
            htmlFor="leave-upload"
            className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400"
          >
            <div className="text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <span className="text-sm text-gray-600">Click to upload multiple screenshots</span>
              <p className="text-xs text-gray-500 mt-1">Upload all your absence details pages</p>
            </div>
          </label>
        </div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Uploaded Files ({uploadedFiles.length})</h3>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{file.name}</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scan Button */}
        {uploadedFiles.length > 0 && step === 'upload' && (
          <button
            onClick={scanLeaves}
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Scan className="w-4 h-4" />
            <span>{loading ? 'Scanning...' : 'Scan for Leaves'}</span>
          </button>
        )}
      </div>

      {/* Scan Results */}
      {step === 'scan' && leaveCount && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:shadow-gray-900/50 p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Scan Results</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-800">Co-curricular Leaves</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{leaveCount.cocurricular} hours</div>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="font-medium text-yellow-800">Medical Leaves</span>
              </div>
              <div className="text-2xl font-bold text-yellow-600">{leaveCount.medical} hours</div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
            <span className="font-medium text-blue-800">Total Leave Hours</span>
            <div className="text-3xl font-bold text-blue-600">
              {leaveCount.cocurricular + leaveCount.medical} hours
            </div>
          </div>

          {/* Extracted Attendance Data */}
          {extractedAttendance && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 mb-6">
              <h3 className="font-medium text-purple-800 mb-3">Extracted Attendance Data</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-sm text-purple-600">Hours Attended</div>
                  <div className="text-2xl font-bold text-purple-700">{extractedAttendance.attended}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-purple-600">Total Hours</div>
                  <div className="text-2xl font-bold text-purple-700">{extractedAttendance.total}</div>
                </div>
              </div>
              <div className="text-center mt-2">
                <div className="text-sm text-purple-600">Current Percentage</div>
                <div className="text-xl font-bold text-purple-700">
                  {calculatePercentage(extractedAttendance.attended, extractedAttendance.total).toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          {/* Auto-filled Attendance Data */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Current Attendance Data</h3>
            
            {currentAttended > 0 && currentTotal > 0 ? (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Attended Hours</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{currentAttended}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Total Hours</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">{currentTotal}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Current %</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      {calculatePercentage(currentAttended, currentTotal).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  {subjects.length > 0 ? 'Data from Analysis tab' : 'Data from screenshots'}
                </p>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  No attendance data available. Please add subjects in the Analysis tab first.
                </p>
              </div>
            )}

            <button
              onClick={() => setStep('calculate')}
              disabled={currentAttended === 0 || currentTotal === 0}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Calculator className="w-4 h-4" />
              <span>Calculate Potential Attendance</span>
            </button>
          </div>
        </div>
      )}

      {/* Final Results */}
      {step === 'calculate' && results && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:shadow-gray-900/50 p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Potential Attendance Analysis</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-sm text-red-600 font-medium mb-2">
                {extractedAttendance ? 'Extracted' : 'Current'} Attendance
              </div>
              <div className="text-3xl font-bold text-red-600">{results.original.toFixed(1)}%</div>
              <div className="text-sm text-red-600 mt-1">
                {currentAttended} / {currentTotal} hours
                {extractedAttendance && <div className="text-xs">(from screenshots)</div>}
              </div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm text-green-600 font-medium mb-2">Potential Attendance</div>
              <div className="text-3xl font-bold text-green-600">{results.potential.toFixed(1)}%</div>
              <div className="text-sm text-green-600 mt-1">
                {currentAttended + results.totalLeaves} / {currentTotal} hours
              </div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-600 font-medium mb-2">Improvement</div>
              <div className="text-3xl font-bold text-blue-600">+{results.improvement.toFixed(1)}%</div>
              <div className="text-sm text-blue-600 mt-1">
                +{results.totalLeaves} hours
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Summary</h3>
            <p className="text-sm text-gray-700 dark:text-gray-200">
              If all {results.totalLeaves} leave hours ({leaveCount?.cocurricular} co-curricular + {leaveCount?.medical} medical) 
              are approved and added to your attendance, your percentage would increase from{' '}
              <span className="font-medium">{results.original.toFixed(1)}%</span> to{' '}
              <span className="font-medium">{results.potential.toFixed(1)}%</span>, 
              an improvement of <span className="font-medium">{results.improvement.toFixed(1)} percentage points</span>.
            </p>
          </div>

          <button
            onClick={() => {
              setStep('upload');
              setLeaveCount(null);
              setCurrentAttended(0);
              setCurrentTotal(0);
              setExtractedAttendance(null);
              setUploadedFiles([]);
            }}
            className="w-full mt-4 px-4 py-2 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-900"
          >
            Start New Analysis
          </button>
        </div>
      )}
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