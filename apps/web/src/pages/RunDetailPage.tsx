import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { runApi, taskApi, exportApi } from '../api/client';

export function RunDetailPage() {
  const { runId } = useParams<{ runId: string }>();
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showIntegrations, setShowIntegrations] = useState(false);

  const { data: run, isLoading: runLoading } = useQuery({
    queryKey: ['run', runId],
    queryFn: () => runApi.get(runId!).then(res => res.data),
    refetchInterval: (data) => {
      // Auto-refresh every 2 seconds if run is still processing
      return data?.status === 'PROCESSING' ? 2000 : false;
    },
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', runId],
    queryFn: () => taskApi.getByRun(runId!).then(res => res.data),
    refetchInterval: (data) => {
      // Auto-refresh every 2 seconds if run is still processing
      return run?.status === 'PROCESSING' ? 2000 : false;
    },
  });

  const handleExport = async (type: 'XLSX' | 'CSV' | 'JSON') => {
    try {
      const result = await exportApi.create(runId!, { type });
      window.location.href = result.data.downloadUrl;
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed');
    }
  };

  const handlePushToIntegration = async (integration: string) => {
    if (selectedTasks.size === 0) {
      alert('Please select at least one task');
      return;
    }

    const integrationMap: Record<string, string> = {
      'Jira': 'JIRA',
      'Asana': 'ASANA',
      'Microsoft To Do': 'MICROSOFT_TODO',
      'Webhook': 'WEBHOOK',
      'Planner': 'PLANNER',
      'Custom': 'CUSTOM_WEBHOOK'
    };

    const targetId = integrationMap[integration] || integration;

    console.log('🚀 Pushing tasks:', {
      integration,
      targetId,
      taskIds: Array.from(selectedTasks),
      taskCount: selectedTasks.size
    });

    try {
      setShowIntegrations(false);
      
      // Call the actual API endpoint
      const response = await fetch(`http://localhost:4000/api/v1/integrations/${runId}/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetId,
          taskIds: Array.from(selectedTasks),
          mappingOptions: {}
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Push failed');
      }

      alert(`✅ Success! Pushed ${result.successCount} tasks to ${integration}\n\nCheck your ${integration} to see the tasks!`);
      setSelectedTasks(new Set());
    } catch (error: any) {
      console.error('Push failed:', error);
      alert(`❌ Error: ${error.message}\n\nMake sure ${integration} credentials are configured in .env file`);
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
    console.log('Selected tasks:', Array.from(newSelected));
  };

  const selectAllTasks = () => {
    const tasks = tasksData?.tasks || [];
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map((t: any) => t.id)));
    }
  };

  if (runLoading || tasksLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const tasks = tasksData?.tasks || [];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Run Details</h1>
        <p className="text-gray-500 mt-1">
          {run?.sourceName || run?.inputType} • {run?.status}
        </p>
      </div>

      {/* Summary */}
      {run?.summary && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Stakeholder Summary</h2>
          
          {run.summary.decisions.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-700 mb-2">Decisions</h3>
              <ul className="list-disc list-inside space-y-1">
                {run.summary.decisions.map((d: string, i: number) => (
                  <li key={i} className="text-gray-600">{d}</li>
                ))}
              </ul>
            </div>
          )}

          {run.summary.risks.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-700 mb-2">Risks & Blockers</h3>
              <ul className="list-disc list-inside space-y-1">
                {run.summary.risks.map((r: string, i: number) => (
                  <li key={i} className="text-gray-600">{r}</li>
                ))}
              </ul>
            </div>
          )}

          {run.summary.asks.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Asks & Questions</h3>
              <ul className="list-disc list-inside space-y-1">
                {run.summary.asks.map((a: string, i: number) => (
                  <li key={i} className="text-gray-600">{a}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Meeting Minutes */}
      {run?.meetingMinutes && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Meeting Minutes</h2>
          
          {run.meetingMinutes.title && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-700 mb-1">Title</h3>
              <p className="text-gray-900">{run.meetingMinutes.title}</p>
            </div>
          )}

          {run.meetingMinutes.date && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-700 mb-1">Date</h3>
              <p className="text-gray-900">{new Date(run.meetingMinutes.date).toLocaleString()}</p>
            </div>
          )}

          {run.meetingMinutes.participants.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-700 mb-2">Participants</h3>
              <div className="flex flex-wrap gap-2">
                {run.meetingMinutes.participants.map((p: string, i: number) => (
                  <span key={i} className="inline-flex px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {run.meetingMinutes.agenda.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-700 mb-2">Agenda</h3>
              <ul className="list-disc list-inside space-y-1">
                {run.meetingMinutes.agenda.map((item: string, i: number) => (
                  <li key={i} className="text-gray-600">{item}</li>
                ))}
              </ul>
            </div>
          )}

          {run.meetingMinutes.notes && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-700 mb-2">Discussion Notes</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{run.meetingMinutes.notes}</p>
            </div>
          )}

          {run.meetingMinutes.nextSteps.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Next Steps</h3>
              <ul className="list-disc list-inside space-y-1">
                {run.meetingMinutes.nextSteps.map((step: string, i: number) => (
                  <li key={i} className="text-gray-600">{step}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="glass p-6 mb-6 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              Tasks ({tasks.length})
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {run?.stats.highConfidenceCount} high confidence • <span className="font-bold text-primary-600">{selectedTasks.size} selected</span>
              {selectedTasks.size > 0 && (
                <span className="ml-2 text-xs">
                  (IDs: {Array.from(selectedTasks).slice(0, 3).join(', ')}{selectedTasks.size > 3 ? '...' : ''})
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleExport('XLSX')}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
            >
              📊 Excel
            </button>
            <button
              onClick={() => handleExport('CSV')}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
            >
              📄 CSV
            </button>
            <button
              onClick={() => setShowIntegrations(!showIntegrations)}
              className="btn-primary"
            >
              🚀 Push to Integration
            </button>
          </div>
        </div>

        {/* Integration Selection */}
        {showIntegrations && (
          <div className="card p-6 mb-4 animate-slide-up border-2 border-accent-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Select Integration</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <button
                onClick={() => handlePushToIntegration('Jira')}
                disabled={selectedTasks.size === 0}
                className="flex items-center gap-3 p-4 rounded-lg border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="text-3xl">🔷</div>
                <div className="text-left">
                  <div className="font-semibold text-gray-800 group-hover:text-blue-600">Jira</div>
                  <div className="text-xs text-gray-500">Atlassian</div>
                </div>
              </button>

              <button
                onClick={() => handlePushToIntegration('Asana')}
                disabled={selectedTasks.size === 0}
                className="flex items-center gap-3 p-4 rounded-lg border-2 border-pink-200 hover:border-pink-400 hover:bg-pink-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="text-3xl">🎯</div>
                <div className="text-left">
                  <div className="font-semibold text-gray-800 group-hover:text-pink-600">Asana</div>
                  <div className="text-xs text-gray-500">Task Management</div>
                </div>
              </button>

              <button
                onClick={() => handlePushToIntegration('Microsoft To Do')}
                disabled={selectedTasks.size === 0}
                className="flex items-center gap-3 p-4 rounded-lg border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="text-3xl">✅</div>
                <div className="text-left">
                  <div className="font-semibold text-gray-800 group-hover:text-purple-600">Microsoft To Do</div>
                  <div className="text-xs text-gray-500">Personal Tasks ⚡ NEW</div>
                </div>
              </button>

              <button
                onClick={() => handlePushToIntegration('Webhook')}
                disabled={selectedTasks.size === 0}
                className="flex items-center gap-3 p-4 rounded-lg border-2 border-green-200 hover:border-green-400 hover:bg-green-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="text-3xl">🔗</div>
                <div className="text-left">
                  <div className="font-semibold text-gray-800 group-hover:text-green-600">Webhook</div>
                  <div className="text-xs text-gray-500">Custom Endpoint ⚡ NEW</div>
                </div>
              </button>

              <button
                onClick={() => handlePushToIntegration('Planner')}
                disabled={selectedTasks.size === 0}
                className="flex items-center gap-3 p-4 rounded-lg border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="text-3xl">📋</div>
                <div className="text-left">
                  <div className="font-semibold text-gray-800 group-hover:text-orange-600">MS Planner</div>
                  <div className="text-xs text-gray-500">Coming Soon</div>
                </div>
              </button>

              <button
                onClick={() => handlePushToIntegration('Custom')}
                disabled={selectedTasks.size === 0}
                className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="text-3xl">⚙️</div>
                <div className="text-left">
                  <div className="font-semibold text-gray-800 group-hover:text-gray-600">Custom</div>
                  <div className="text-xs text-gray-500">Build Your Own</div>
                </div>
              </button>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> Configure integration credentials in your <code className="bg-blue-100 px-1 rounded">.env</code> file. 
                See <a href="/docs/QUICK_INTEGRATION_GUIDE.md" className="underline font-semibold">Quick Integration Guide</a>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Task List */}
      <div className="glass overflow-hidden animate-fade-in">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-primary-50 to-accent-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedTasks.size === tasks.length && tasks.length > 0}
                  onChange={selectAllTasks}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Owner</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Confidence</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {tasks.map((task: any) => (
              <tr key={task.id} className={`hover:bg-primary-50 transition-colors ${selectedTasks.has(task.id) ? 'bg-primary-50' : ''}`}>
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedTasks.has(task.id)}
                    onChange={() => toggleTaskSelection(task.id)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-gray-900">{task.title}</div>
                  <div className="text-sm text-gray-500 italic mt-1">"{task.sourceQuote.substring(0, 100)}..."</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {task.ownerNormalized || task.ownerRaw || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {task.dueDateISO ? new Date(task.dueDateISO).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                    task.confidence >= 0.8 ? 'bg-green-100 text-green-800' :
                    task.confidence >= 0.5 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {Math.round(task.confidence * 100)}%
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {task.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
