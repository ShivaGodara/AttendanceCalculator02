import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { type, imageData } = await request.json();
    
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    let prompt = '';
    if (type === 'timetable') {
      prompt = `IMPORTANT: This screenshot contains mobile browser UI and website elements that must be ignored.
      
      VISUAL CROPPING INSTRUCTIONS:
      1. Locate the main data table in the center of the image
      2. Ignore everything above the table (browser bar, website header, navigation)
      3. Ignore everything below the table (footer, copyright, buttons)
      4. Focus ONLY on the table with days and subject names
      
      EXTRACT from the cropped table area:
      - Days of the week (Monday, Tuesday, etc.)
      - Subject names in each time slot
      - Ignore time periods and room numbers
      
      Return JSON:
      {
        "schedule": [
          {"day": "Monday", "subjects": ["ADVANCED PYTHON", "CLOUD COMPUTING"]},
          {"day": "Tuesday", "subjects": ["MINI PROJECT", "ARTIFICIAL INTELLIGENCE"]}
        ]
      }
      
      Combine similar subjects (Theory + Practical = one subject name).`;
    } else if (type === 'attendance') {
      prompt = `IMPORTANT: This screenshot contains mobile browser UI that must be ignored.
      
      VISUAL CROPPING INSTRUCTIONS:
      1. Find the attendance data table (usually has blue header "Attendance")
      2. Ignore mobile status bar, browser address bar, website logo
      3. Ignore footer text, buttons, and navigation elements
      4. Focus ONLY on the table with columns: Subject Name, Conducted, Present, Percentage
      
      EXTRACT from the cropped table:
      - Subject names from the "Subject Name" column
      - Numbers from "Conducted" column (total classes)
      - Numbers from "Present" column (attended classes)
      
      CRITICAL: Combine Theory + Practical for same subject:
      Example: "MINI PROJECT Theory: Present=1, Conducted=1" + "MINI PROJECT Practical: Present=18, Conducted=28" 
      Result: "MINI PROJECT: attended=19, total=29"
      
      Return JSON:
      {
        "subjects": [
          {"name": "MINI PROJECT", "attended": 19, "total": 29},
          {"name": "AR/VR", "attended": 44, "total": 53}
        ]
      }`;
    } else if (type === 'leaves') {
      prompt = `VISUAL CROPPING: Focus only on the absence details table, ignore all browser UI and headers.
      
      Count colored text entries:
      - GREEN text = co-curricular leaves
      - ORANGE text = medical leaves
      
      Return JSON: {"cocurricular": number, "medical": number, "attendance": {"attended": number, "total": number}}`;
    }

    const result = await model.generateContent([prompt, imageData]);
    const response = await result.response;
    const text = response.text();
    
    const data = JSON.parse(text.replace(/```json|```/g, '').trim());
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}