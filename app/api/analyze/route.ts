import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { type, imageData } = await request.json();
    
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    let prompt = '';
    if (type === 'timetable') {
      prompt = `This is a mobile screenshot that may contain browser UI, headers, and other elements. 
      
      STEP 1: Identify and focus ONLY on the timetable/schedule table content. Ignore:
      - Mobile browser UI (address bar, status bar)
      - Website headers and navigation
      - Footer content
      - Any content outside the actual timetable
      
      STEP 2: From the focused timetable area, extract schedule information.
      Return a JSON object with this structure:
      {
        "schedule": [
          {
            "day": "Monday",
            "subjects": ["Subject1", "Subject2"]
          }
        ]
      }
      Only include subject names from the table cells, ignore time slots and periods. Combine similar subjects.`;
    } else if (type === 'attendance') {
      prompt = `This is a mobile screenshot that may contain browser UI, headers, and other elements.
      
      STEP 1: Identify and focus ONLY on the attendance table/data. Ignore:
      - Mobile browser UI (address bar, status bar, battery indicator)
      - Website headers, navigation, and logos
      - Footer content and copyright text
      - Any buttons or UI elements outside the attendance table
      
      STEP 2: From the focused attendance table, extract data for each subject.
      Look for columns like: Subject Name, Conducted/Total, Present/Attended, Percentage
      
      Return JSON with this structure:
      {
        "subjects": [
          {
            "name": "Subject Name",
            "attended": 25,
            "total": 30
          }
        ]
      }
      
      IMPORTANT: Combine Theory and Practical entries for the same subject into one total.
      For example: "MINI PROJECT Theory: 1.0/1.0" + "MINI PROJECT Practical: 18.0/28.0" = "MINI PROJECT: 19.0/29.0"`;
    } else if (type === 'leaves') {
      prompt = `This is a mobile screenshot of absence/leave details.
      
      STEP 1: Focus only on the absence details table, ignore browser UI and headers.
      
      STEP 2: Count leaves by text color:
      - GREEN text entries = co-curricular leaves
      - YELLOW/ORANGE text entries = medical leaves
      
      Return JSON: {"cocurricular": number, "medical": number, "attendance": {"attended": number, "total": number}}
      Count the hours/numbers only. Also extract attendance data if visible in the focused area.`;
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