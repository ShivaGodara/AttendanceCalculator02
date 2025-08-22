'use client';

import { useState } from 'react';
import { Subject, Settings } from '@/types';
import { calculatePercentage, calculateBunkingBuffer, getRemainingWorkingDays } from '@/lib/utils';

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



  return (
    <div className="space-y-6">
      {/* Bunking Buffer Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:shadow-gray-900/50 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Bunking Buffer Calculator</h2>
        
        {/* Aggregate Buffer */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Overall Bunking Buffer</h3>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {calculateBunkingBuffer(aggregate.attended, aggregate.total, settings.aggregateGoal)} classes
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            You can miss this many classes and still reach your {settings.aggregateGoal}% goal
          </p>
        </div>

        {/* Individual Subject Buffers */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">Individual Subject Buffers</h3>
          {subjects.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No subjects available. Add subjects in the Analysis tab.</p>
          ) : (
            subjects.map((subject) => {
              const buffer = calculateBunkingBuffer(subject.attended, subject.total, subject.goal);
              const currentPercentage = calculatePercentage(subject.attended, subject.total);
              
              return (
                <div key={subject.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{subject.name}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                      ({currentPercentage.toFixed(1)}% current)
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-gray-900 dark:text-gray-100">
                      {buffer} classes
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      can miss & reach {subject.goal}%
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>



      {/* Quick Scenarios */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:shadow-gray-900/50 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Future Projections</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Perfect Attendance', attended: remainingDays, held: remainingDays },
            { label: '80% Attendance', attended: Math.floor(remainingDays * 0.8), held: remainingDays },
            { label: '60% Attendance', attended: Math.floor(remainingDays * 0.6), held: remainingDays }
          ].map((scenario, index) => {
            const projectedPercentage = calculatePercentage(
              aggregate.attended + scenario.attended,
              aggregate.total + scenario.held
            );
            
            return (
              <div
                key={index}
                className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
              >
                <div className="font-medium text-gray-900 dark:text-gray-100">{scenario.label}</div>
                <div className="text-2xl font-bold text-blue-600 my-1">
                  {projectedPercentage.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  +{scenario.attended} / +{scenario.held} classes
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}