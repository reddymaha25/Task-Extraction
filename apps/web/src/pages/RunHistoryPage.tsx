import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { runApi } from '../api/client';

export function RunHistoryPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['runs'],
    queryFn: () => runApi.list({}).then(res => res.data),
  });

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const runs = data?.runs || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Run History</h1>
        <button
          onClick={() => navigate('/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          New Run
        </button>
      </div>

      <div className="grid gap-4">
        {runs.map((run: any) => (
          <div
            key={run.id}
            onClick={() => navigate(`/runs/${run.id}`)}
            className="bg-white shadow rounded-lg p-6 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {run.sourceName || `${run.inputType} Run`}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(run.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  run.status === 'COMPLETE' ? 'bg-green-100 text-green-800' :
                  run.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                  run.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {run.status}
                </span>
                <p className="text-sm text-gray-600 mt-2">{run.taskCount} tasks</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
