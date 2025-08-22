import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export const analyzeTimetable = async (imageFile: File): Promise<any> => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const imageData = await fileToGenerativePart(imageFile);
  
  const prompt = `Analyze this weekly class timetable screenshot and extract the schedule information. 
  Return a JSON object with the following structure:
  {
    "schedule": [
      {
        "day": "Monday",
        "subjects": ["Subject1", "Subject2"]
      }
    ]
  }
  Only include the subject names, ignore time slots. Combine similar subjects (like "Math Theory" and "Math Practical" should both be "Math").`;

  const result = await model.generateContent([prompt, imageData]);
  const response = await result.response;
  const text = response.text();
  
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    throw new Error('Failed to parse timetable data');
  }
};

export const analyzeAttendance = async (imageFile: File): Promise<any> => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const imageData = await fileToGenerativePart(imageFile);
  
  const prompt = `Analyze this attendance report screenshot and extract attendance data.
  Return a JSON object with this structure:
  {
    "subjects": [
      {
        "name": "Subject Name",
        "attended": 25,
        "total": 30
      }
    ]
  }
  Combine Theory and Practical entries for the same subject into one total. Extract only the numbers for attended and total hours.`;

  const result = await model.generateContent([prompt, imageData]);
  const response = await result.response;
  const text = response.text();
  
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    throw new Error('Failed to parse attendance data');
  }
};

export const analyzeLeaves = async (imageFiles: File[]): Promise<any> => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  let totalCocurricular = 0;
  let totalMedical = 0;
  let attendanceData = null;
  
  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const imageData = await fileToGenerativePart(file);
    
    // For first 2 images, also extract attendance data
    if (i < 2) {
      const attendancePrompt = `Extract attendance data from this screenshot. Look for:
      - Total hours present/attended
      - Total hours conducted/held
      Return JSON: {"attended": number, "total": number, "cocurricular": number, "medical": number}
      For leaves: GREEN text = co-curricular, YELLOW/ORANGE text = medical`;
      
      const result = await model.generateContent([attendancePrompt, imageData]);
      const response = await result.response;
      const text = response.text();
      
      try {
        const data = JSON.parse(text.replace(/```json|```/g, '').trim());
        if (data.attended && data.total && !attendanceData) {
          attendanceData = { attended: data.attended, total: data.total };
        }
        totalCocurricular += data.cocurricular || 0;
        totalMedical += data.medical || 0;
      } catch {
        console.error('Failed to parse data from image', i + 1);
      }
    } else {
      // For remaining images, only extract leaves
      const leavePrompt = `Count leaves by color in this absence details screenshot:
      - GREEN text entries = co-curricular leaves
      - YELLOW/ORANGE text entries = medical leaves
      Return JSON: {"cocurricular": number, "medical": number}
      Count the hours/numbers only.`;

      const result = await model.generateContent([leavePrompt, imageData]);
      const response = await result.response;
      const text = response.text();
      
      try {
        const data = JSON.parse(text.replace(/```json|```/g, '').trim());
        totalCocurricular += data.cocurricular || 0;
        totalMedical += data.medical || 0;
      } catch {
        console.error('Failed to parse leave data from image', i + 1);
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