'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Camera, FileImage, Calendar, BarChart3, RefreshCw, Trash2, Download } from 'lucide-react';

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  type: 'timetable' | 'attendance' | 'auto';
  preview: string;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  progress: number;
  result?: any;
  confidence?: number;
}

interface Props {
  onAnalyze: (files: UploadedFile[]) => Promise<void>;
  loading: boolean;
}

export default function EnhancedUpload({ onAnalyze, loading }: Props) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) return 'Only image files are allowed';
    if (file.size > 10 * 1024 * 1024) return 'File size must be less than 10MB';
    return null;
  };

  const detectFileType = (fileName: string): 'timetable' | 'attendance' | 'auto' => {
    const name = fileName.toLowerCase();
    if (name.includes('timetable') || name.includes('schedule')) return 'timetable';
    if (name.includes('attendance') || name.includes('report')) return 'attendance';
    return 'auto';
  };

  const createFilePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const maxWidth = 1200;
        const maxHeight = 1200;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.8);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newFiles: UploadedFile[] = [];

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        alert(`${file.name}: ${error}`);
        continue;
      }

      // Check for duplicates
      const isDuplicate = uploadedFiles.some(f => 
        f.file.name === file.name && f.file.size === file.size
      );
      if (isDuplicate) {
        alert(`${file.name} is already uploaded`);
        continue;
      }

      const compressedFile = await compressImage(file);
      const preview = await createFilePreview(compressedFile);
      
      const uploadedFile: UploadedFile = {
        id: Date.now().toString() + Math.random(),
        file: compressedFile,
        name: file.name,
        type: detectFileType(file.name),
        preview,
        status: 'pending',
        progress: 0
      };

      newFiles.push(uploadedFile);
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, [uploadedFiles]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
      e.target.value = '';
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearAll = () => {
    setUploadedFiles([]);
  };

  const updateFileName = (id: string, newName: string) => {
    setUploadedFiles(prev => prev.map(f => 
      f.id === id ? { ...f, name: newName } : f
    ));
  };

  const updateFileType = (id: string, type: 'timetable' | 'attendance') => {
    setUploadedFiles(prev => prev.map(f => 
      f.id === id ? { ...f, type } : f
    ));
  };

  const retryFile = (id: string) => {
    setUploadedFiles(prev => prev.map(f => 
      f.id === id ? { ...f, status: 'pending', progress: 0 } : f
    ));
  };

  const exportResults = () => {
    const results = uploadedFiles
      .filter(f => f.result)
      .map(f => ({ name: f.name, type: f.type, result: f.result }));
    
    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analysis-results-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAnalyze = async () => {
    const pendingFiles = uploadedFiles.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    await onAnalyze(pendingFiles);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Upload Screenshots
        </h3>
        <p className="text-gray-600 mb-4">
          Drag and drop files here, or click to select
        </p>
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FileImage className="w-4 h-4 inline mr-2" />
            Choose Files
          </button>
          
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Camera className="w-4 h-4 inline mr-2" />
            Take Photo
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
        
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileInput}
          className="hidden"
        />

        <p className="text-xs text-gray-500 mt-4">
          Supports: PNG, JPG, JPEG • Max size: 10MB • Auto-compression enabled
        </p>
      </div>

      {/* File Queue */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              Uploaded Files ({uploadedFiles.length})
            </h3>
            <div className="flex space-x-2">
              {uploadedFiles.some(f => f.result) && (
                <button
                  onClick={exportResults}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  <Download className="w-4 h-4 inline mr-1" />
                  Export Results
                </button>
              )}
              <button
                onClick={clearAll}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 inline mr-1" />
                Clear All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="border rounded-lg p-4 relative">
                <button
                  onClick={() => removeFile(file.id)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>

                <img
                  src={file.preview}
                  alt={file.name}
                  className="w-full h-32 object-cover rounded mb-3"
                />

                <input
                  type="text"
                  value={file.name}
                  onChange={(e) => updateFileName(file.id, e.target.value)}
                  className="w-full text-sm font-medium mb-2 px-2 py-1 border rounded"
                />

                <div className="flex items-center justify-between mb-2">
                  <select
                    value={file.type}
                    onChange={(e) => updateFileType(file.id, e.target.value as 'timetable' | 'attendance')}
                    className="text-xs border rounded px-2 py-1"
                  >
                    <option value="auto">Auto-detect</option>
                    <option value="timetable">Timetable</option>
                    <option value="attendance">Attendance</option>
                  </select>

                  {file.type === 'timetable' ? (
                    <Calendar className="w-4 h-4 text-blue-500" />
                  ) : file.type === 'attendance' ? (
                    <BarChart3 className="w-4 h-4 text-green-500" />
                  ) : (
                    <FileImage className="w-4 h-4 text-gray-500" />
                  )}
                </div>

                {/* Status and Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-1 rounded ${
                      file.status === 'completed' ? 'bg-green-100 text-green-800' :
                      file.status === 'analyzing' ? 'bg-blue-100 text-blue-800' :
                      file.status === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {file.status}
                    </span>
                    
                    {file.confidence && (
                      <span className="text-gray-600">
                        {Math.round(file.confidence * 100)}% confidence
                      </span>
                    )}
                  </div>

                  {file.status === 'analyzing' && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}

                  {file.status === 'error' && (
                    <button
                      onClick={() => retryFile(file.id)}
                      className="w-full px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                    >
                      <RefreshCw className="w-3 h-3 inline mr-1" />
                      Retry
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Analyze Button */}
          {uploadedFiles.some(f => f.status === 'pending') && (
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Analyzing...
                </div>
              ) : (
                `Analyze ${uploadedFiles.filter(f => f.status === 'pending').length} Files`
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}