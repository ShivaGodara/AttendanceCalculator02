'use client';

import { Subject, Settings } from '@/types';
import { calculatePercentage, getRemainingWorkingDays } from '@/lib/utils';

interface Props {
  subjects: Subject[];
  settings: Settings;
}

export default function BunkPlannerTab({ subjects, settings }: Props) {
  const calculateAggregate = () => {
    if (subjects.length === 0) return { attended: 0, total: 0 };
    
    const totalAttended = subjects.reduce((sum, s) => sum + s.attended, 0);
    const totalHeld = subjects.reduce((sum, s) => sum + s.total, 0);
    
    return { attended: totalAttended, total: totalHeld };
  };

  const aggregate = calculateAggregate();
  const remainingDays = getRemainingWorkingDays(settings.semesterEndDate);

  // Calculate aggregate bunking buffer by semester end
  const calculateAggregateBunkBuffer = () => {
    // Total classes by semester end (current + remaining)
    const totalClassesBySemesterEnd = aggregate.total + remainingDays;
    
    // Minimum classes needed to achieve goal by semester end
    const minClassesNeeded = Math.ceil((settings.aggregateGoal * totalClassesBySemesterEnd) / 100);
    
    // Maximum classes that can be missed
    const maxCanMiss = aggregate.attended + remainingDays - minClassesNeeded;
    
    return Math.max(0, maxCanMiss);
  };

  // Calculate individual subject bunking buffer
  const calculateSubjectBunkBuffer = (subject: Subject) => {
    const currentPercentage = calculatePercentage(subject.attended, subject.total);
    
    // If already below goal, can't miss any
    if (currentPercentage < subject.goal) return 0;
    
    // Formula: (current_attended * 100 - goal * current_total) / goal
    // This gives the number of classes that can be missed while maintaining the goal
    const buffer = Math.floor((100 * subject.attended - subject.goal * subject.total) / subject.goal);
    
    return Math.max(0, buffer);
  };

  const aggregateBuffer = calculateAggregateBunkBuffer();

  return (
    <div className="space-y-6">
      {/* Aggregate Bunking Buffer */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Overall Bunking Buffer</h2>
        
        <div className="bg-blue-50 rounded-lg p-6 mb-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {aggregateBuffer}
            </div>
            <div className="text-lg text-blue-800 mb-2">Classes you can miss</div>
            <div className="text-sm text-blue-600">
              Current: {aggregate.attended}/{aggregate.total} ({calculatePercentage(aggregate.attended, aggregate.total).toFixed(1)}%)
            </div>
            <div className="text-sm text-blue-600">
              Goal: {settings.aggregateGoal}% • Days left: {remainingDays}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-50 p-3 rounded">
            <div className="font-medium text-gray-700">Current Status</div>
            <div className="text-lg font-bold text-gray-900">
              {calculatePercentage(aggregate.attended, aggregate.total).toFixed(1)}%
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="font-medium text-gray-700">Remaining Days</div>
            <div className="text-lg font-bold text-gray-900">{remainingDays}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="font-medium text-gray-700">Target Goal</div>
            <div className="text-lg font-bold text-gray-900">{settings.aggregateGoal}%</div>
          </div>
        </div>
      </div>

      {/* Individual Subject Buffers */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Individual Subject Buffers</h2>
        
        {subjects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No subjects available. Add subjects in the Analysis tab to see individual bunking buffers.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => {
              const buffer = calculateSubjectBunkBuffer(subject);
              const currentPercentage = calculatePercentage(subject.attended, subject.total);
              const status = currentPercentage >= subject.goal ? 'safe' : 'warning';
              
              return (
                <div 
                  key={subject.id} 
                  className={`p-4 rounded-lg border-2 ${
                    status === 'safe' 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-yellow-200 bg-yellow-50'
                  }`}
                >
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-900 truncate" title={subject.name}>
                      {subject.name}
                    </h3>
                    <div className="text-sm text-gray-600">
                      {subject.attended}/{subject.total} ({currentPercentage.toFixed(1)}%)
                    </div>
                  </div>
                  
                  <div className="text-center mb-3">
                    <div className={`text-3xl font-bold ${
                      status === 'safe' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {buffer}
                    </div>
                    <div className="text-sm text-gray-600">classes can miss</div>
                  </div>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Goal: {subject.goal}%</div>
                    <div>
                      {buffer > 0 
                        ? `Can miss ${buffer} and still reach goal`
                        : currentPercentage < subject.goal
                          ? 'Need to attend more classes'
                          : 'Cannot miss any classes'
                      }
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


    </div>
  );
}