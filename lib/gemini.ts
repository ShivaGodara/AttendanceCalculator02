export const analyzeTimetable = async (imageFile: File): Promise<any> => {
  const imageData = await fileToGenerativePart(imageFile);
  
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'timetable', imageData })
  });
  
  if (!response.ok) throw new Error('Analysis failed');
  return response.json();
};

export const analyzeAttendance = async (imageFile: File): Promise<any> => {
  const imageData = await fileToGenerativePart(imageFile);
  
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'attendance', imageData })
  });
  
  if (!response.ok) throw new Error('Analysis failed');
  return response.json();
};

export const analyzeLeaves = async (imageFiles: File[]): Promise<any> => {
  let totalCocurricular = 0;
  let totalMedical = 0;
  let attendanceData = null;
  
  for (const file of imageFiles) {
    const imageData = await fileToGenerativePart(file);
    
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'leaves', imageData })
    });
    
    if (response.ok) {
      const data = await response.json();
      totalCocurricular += data.cocurricular || 0;
      totalMedical += data.medical || 0;
      if (data.attendance && !attendanceData) {
        attendanceData = data.attendance;
      }
    }
  }
  
  return {
    cocurricular: totalCocurricular,
    medical: totalMedical,
    attendance: attendanceData
  };
};

async function fileToGenerativePart(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const base64Data = (reader.result as string).split(',')[1];
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type,
          },
        });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}