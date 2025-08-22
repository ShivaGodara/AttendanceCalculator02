'use client';

import { useState } from 'react';
import { Subject } from '@/types';
import { Upload, FileImage, Calculator, AlertCircle } from 'lucide-react';
import { analyzeLeaves } from '@/lib/gemini';
import Toast from './Toast';

interface Props {
  subjects: Subject[];
}

interface LeaveResult {
  cocurricular: number;
  medical: number;
  attendance?: {
    attended: number;
    total: number;
  };
}

export default function LeaveAnalysisTab({ subjects }: Props) {
  const [loading, setLoading] = useState(false);
  const [absenceFiles, setAbsenceFiles] = useState<File[]>([]);
  const [leaveResult, setLeaveResult] = useState<LeaveResult | null>(null);
  const [toast, setToast] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);

  const handleAbsenceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setAbsenceFiles(Array.from(files));
      setLeaveResult(null);
    }
  };

  const removeFile = (index: number) => {
    setAbsenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const analyzeAbsenceFiles = async () => {
    if (absenceFiles.length === 0) return;

    setLoading(true);
    try {
      let totalCocurricular = 0;
      let totalMedical = 0;

      // Analyze all files at once
      const result = await analyzeLeaves(absenceFiles);
      totalCocurricular = result.cocurricular || 0;
      totalMedical = result.medical || 0;

      setLeaveResult({
        cocurricular: totalCocurricular,
        medical: totalMedical
      });
      
      setToast({ 
        type: 'success', 
        message: `Analyzed ${absenceFiles.length} screenshots successfully!` 
      });
    } catch (error) {
      console.error('Error analyzing absence details:', error);
      setToast({ type: 'error', message: 'Failed to analyze absence details. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const calculatePotentialAttendance = () => {
    if (!leaveResult || subjects.length === 0) return null;

    const totalAttended = subjects.reduce((sum, s) => sum + s.attended, 0);
    const totalHeld = subjects.reduce((sum, s) => sum + s.total, 0);
    
    // Add approved leaves to attended hours
    const potentialAttended = totalAttended + leaveResult.cocurricular + leaveResult.medical;
    const potentialPercentage = totalHeld > 0 ? (potentialAttended / totalHeld) * 100 : 0;

    return {
      current: totalHeld > 0 ? (totalAttended / totalHeld) * 100 : 0,
      potential: potentialPercentage,
      improvement: potentialPercentage - (totalHeld > 0 ? (totalAttended / totalHeld) * 100 : 0)
    };
  };

  const potentialCalc = calculatePotentialAttendance();

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">How Leave Analysis Works</h3>
            <p className="text-sm text-blue-700 mt-1">
              Upload multiple screenshots of your absence details pages. The AI will count your leaves across all images and calculate 
              potential attendance improvement using data from your Analysis tab.
            </p>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Upload Absence Details</h2>
        
        <div className="mb-4">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleAbsenceUpload}
            className="hidden"
            id="absence-upload"
          />
          <label
            htmlFor="absence-upload"
            className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg cursor-pointer"
          >
            <div className="text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <span className="text-sm text-gray-600">
                Click to upload absence details screenshots (multiple files supported)
              </span>
            </div>
          </label>
          
          {absenceFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-sm font-medium text-gray-700">
                {absenceFiles.length} file(s) selected:
              </div>
              {absenceFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                  <span className="text-sm text-green-800">✓ {file.name}</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {absenceFiles.length > 0 && (
          <button
            onClick={analyzeAbsenceFiles}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <FileImage className="w-4 h-4" />
            )}
            <span>{loading ? 'Analyzing...' : `Analyze ${absenceFiles.length} Screenshots`}</span>
          </button>
        )}
      </div>

      {/* Results Section */}
      {leaveResult && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Leave Analysis Results</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <h3 className="font-medium text-green-900">Co-curricular Leaves</h3>
              </div>
              <div className="text-2xl font-bold text-green-600">{leaveResult.cocurricular}</div>
              <p className="text-sm text-green-700">Hours of approved activities</p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <h3 className="font-medium text-orange-900">Medical Leaves</h3>
              </div>
              <div className="text-2xl font-bold text-orange-600">{leaveResult.medical}</div>
              <p className="text-sm text-orange-700">Hours of medical absences</p>
            </div>
          </div>

          {/* Potential Attendance Calculation */}
          {potentialCalc && subjects.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Calculator className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-blue-900">Potential Attendance Impact</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-gray-600">Current Attendance</div>
                  <div className="text-xl font-bold text-gray-900">
                    {potentialCalc.current.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">With Approved Leaves</div>
                  <div className="text-xl font-bold text-blue-600">
                    {potentialCalc.potential.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Improvement</div>
                  <div className={`text-xl font-bold ${
                    potentialCalc.improvement > 0 ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    +{potentialCalc.improvement.toFixed(1)}%
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-blue-700 mt-3 text-center">
                If your {leaveResult.cocurricular + leaveResult.medical} leave hours are approved, 
                your attendance could improve by {potentialCalc.improvement.toFixed(1)} percentage points.
              </p>
            </div>
          )}

          {subjects.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Add subjects in the Analysis tab to see potential attendance impact.
              </p>
            </div>
          )}
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