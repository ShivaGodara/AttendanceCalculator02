# AI Attendance Tracker

A smart attendance tracking webapp powered by Google Gemini AI for analyzing screenshots and predicting attendance outcomes.

## Features

### 🤖 AI-Powered Analysis
- **Timetable Analysis**: Upload a screenshot of your weekly schedule to automatically extract subjects and timings
- **Attendance Report Analysis**: Upload attendance reports to automatically extract attended/total hours for each subject
- **Leave Analysis**: Scan absence details to count co-curricular and medical leaves by text color

### 📊 Analysis Dashboard
- Real-time attendance percentage calculations
- Color-coded status indicators (Safe/Warning/Danger)
- Individual subject tracking with editable fields
- Aggregate attendance summary with goal tracking

### 📅 Bunk Planner
- Calculate how many classes you can safely miss
- "What if?" scenarios for future attendance planning
- Holiday-aware predictions excluding weekends and holidays
- Quick scenario templates (Perfect, 80%, 60% attendance)

### 🏥 Leave Analysis (Standalone)
- Multi-screenshot analysis of absence details
- AI-powered leave counting by text color
- Potential attendance calculation with approved leaves
- Separate from main attendance tracking

### ⚙️ Smart Features
- **Holiday-Aware**: Automatically excludes fixed holidays and third Saturdays
- **Data Persistence**: Saves all data to browser's local storage
- **Real-time Updates**: All calculations update instantly as you edit
- **Responsive Design**: Works on desktop and mobile devices

## Setup Instructions

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd ai-attendance-tracker
npm install
```

### 2. Get Google Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key

### 3. Configure Environment
1. Copy `.env.local.example` to `.env.local`
2. Replace `your_gemini_api_key_here` with your actual API key:
```
NEXT_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment on Vercel

### Option 1: Deploy from GitHub
1. Push your code to GitHub
2. Visit [Vercel](https://vercel.com)
3. Import your GitHub repository
4. Add environment variable: `NEXT_PUBLIC_GEMINI_API_KEY`
5. Deploy

### Option 2: Deploy with Vercel CLI
```bash
npm install -g vercel
vercel
```

Follow the prompts and add your environment variable when asked.

## Usage Guide

### Getting Started
1. **Configure Settings**: Click the settings icon to set your attendance goals and semester end date
2. **Add Subjects**: Use the Analysis tab to either upload attendance reports or manually add subjects
3. **Upload Timetable**: Upload a screenshot of your weekly schedule for better tracking

### Analysis Tab
- View your overall attendance status with color-coded indicators
- Edit subject details (name, attended hours, total hours, individual goals)
- Get real-time status messages and predictions

### Bunk Planner Tab
- See how many classes you can safely miss for each subject
- Use the "What If?" simulator to test different scenarios
- Try quick scenario templates for common attendance patterns

### Leave Analysis Tab
- Upload multiple screenshots of your absence details
- Let AI count your co-curricular (green) and medical (orange/red) leaves
- Calculate potential attendance improvement if leaves are approved

## Technical Details

### Built With
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better development experience
- **Tailwind CSS** - Utility-first CSS framework
- **Google Gemini AI** - Vision AI for screenshot analysis
- **Lucide React** - Beautiful icons

### Key Algorithms
- **Attendance Calculation**: `(attended / total) * 100`
- **Bunking Buffer**: `(100 * attended - goal * total) / goal`
- **Required Classes**: `(goal * total - 100 * attended) / (100 - goal)`
- **Holiday Detection**: Excludes fixed holidays and third Saturdays

### Data Storage
All data is stored in browser's localStorage with automatic save/load functionality.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

If you encounter any issues or have questions, please create an issue on GitHub.