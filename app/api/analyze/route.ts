import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { type, imageData } = await request.json();
    
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    let prompt = '';
    if (type === 'timetable') {
      prompt = `Analyze this weekly class timetable screenshot and extract the schedule information. 
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
    } else if (type === 'attendance') {
      prompt = `Analyze this attendance report screenshot and extract attendance data.
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
    } else if (type === 'leaves') {
      prompt = `Count leaves by color in this absence details screenshot:
      - GREEN text entries = co-curricular leaves
      - YELLOW/ORANGE text entries = medical leaves
      Return JSON: {"cocurricular": number, "medical": number, "attendance": {"attended": number, "total": number}}
      Count the hours/numbers only. Also extract attendance data if visible.`;
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