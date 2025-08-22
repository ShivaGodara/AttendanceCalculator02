'use client';

import { useState } from 'react';
import { Subject, Settings } from '@/types';
import { calculatePercentage, calculateBunkingBuffer, getRemainingWorkingDays } from '@/lib/utils';

interface Props {
  subjects: Subject[];
  settings: Settings;
}

export default function BunkPlannerTab({ subjects, settings }: Props) {
  const [extraAttended, setExtraAttended] = useState(0);
  const [extraHeld, setExtraHeld] = useState(0);

  const calculateAggregate = () => {
    if (subjects.length === 0) return { attended: 0, total: 0 };
    
    const totalAttended = subjects.reduce((sum, s) => sum + s.attended, 0);
    const totalHeld = subjects.reduce((sum, s) => sum + s.total, 0);
    
    return { attended: totalAttended, total: totalHeld };
  };

  const aggregate = calculateAggregate();
  const remainingDays = getRemainingWorkingDays(settings.semesterEndDate);

  const simulateScenario = () => {
    const newAttended = aggregate.attended + extraAttended;
    const newTotal = aggregate.total + extraHeld;
    return calculatePercentage(newAttended, newTotal);
  };

  return (
    <div className="space-y-6">
      {/* Bunking Buffer Section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:shadow-gray-900/50 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Bunking Buffer Calculator</h2>
        
        {/* Aggregate Buffer */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Overall Bunking Buffer</h3>
          <div className="text-2xl font-bold text-blue-600">
            {calculateBunkingBuffer(aggregate.attended, aggregate.total, settings.aggregateGoal)} classes
          </div>
          <p className="text-sm text-blue-700 mt-1">
            You can miss this many classes without falling below your {settings.aggregateGoal}% goal
          </p>
        </div>

        {/* Individual Subject Buffers */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Individual Subject Buffers</h3>
          {subjects.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No subjects available. Add subjects in the Analysis tab.</p>
          ) : (
            subjects.map((subject) => {
              const buffer = calculateBunkingBuffer(subject.attended, subject.total, subject.goal);
              const currentPercentage = calculatePercentage(subject.attended, subject.total);
              
              return (
                <div key={subject.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium">{subject.name}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      ({currentPercentage.toFixed(1)}% current)
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">
                      {buffer} classes
                    </div>
                    <div className="text-xs text-gray-600">
                      can miss
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* What If Simulator */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:shadow-gray-900/50 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">'What If?' Simulator</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Extra Classes You Attend
              </label>
              <input
                type="number"
                value={extraAttended}
                onChange={(e) => setExtraAttended(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Extra Classes Held
              </label>
              <input
                type="number"
                value={extraHeld}
                onChange={(e) => setExtraHeld(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="0"
              />
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-300">
              <p>Remaining working days: {remainingDays}</p>
              <p>Current aggregate: {calculatePercentage(aggregate.attended, aggregate.total).toFixed(1)}%</p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
              <div className="text-sm text-gray-600 mb-2">Projected Final Percentage</div>
              <div className="text-4xl font-bold text-blue-600">
                {simulateScenario().toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 mt-2">
                {simulateScenario() >= settings.aggregateGoal ? (
                  <span className="text-green-600 font-medium">✓ Goal Achieved</span>
                ) : (
                  <span className="text-red-600 font-medium">✗ Below Goal</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scenario Analysis */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Scenario Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Current Total:</span>
              <div className="font-medium">{aggregate.attended} / {aggregate.total}</div>
            </div>
            <div>
              <span className="text-gray-600">After Scenario:</span>
              <div className="font-medium">
                {aggregate.attended + extraAttended} / {aggregate.total + extraHeld}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Difference:</span>
              <div className="font-medium">
                {(simulateScenario() - calculatePercentage(aggregate.attended, aggregate.total)).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Scenarios */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:shadow-gray-900/50 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Quick Scenarios</h2>
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
                className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-900"
                onClick={() => {
                  setExtraAttended(scenario.attended);
                  setExtraHeld(scenario.held);
                }}
              >
                <div className="font-medium text-gray-900">{scenario.label}</div>
                <div className="text-2xl font-bold text-blue-600 my-1">
                  {projectedPercentage.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600">
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