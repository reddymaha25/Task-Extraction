import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { runApi, uploadApi } from '../api/client';

export function NewRunPage() {
  const navigate = useNavigate();
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [timezone, setTimezone] = useState('UTC');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      let fileIds: string[] = [];
      let inputType = 'TEXT';

      // Upload files if in file mode
      if (inputMode === 'file' && files.length > 0) {
        // Upload all files
        for (const file of files) {
          const uploadResult = await uploadApi.upload(file);
          fileIds.push(uploadResult.data.fileId);
        }
        
        // Determine input type based on first file's mime type or extension
        const firstFile = files[0];
        const mimeType = firstFile.type;
        const fileName = firstFile.name.toLowerCase();
        
        if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
          inputType = 'PDF';
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
          inputType = 'DOCX';
        } else if (mimeType === 'message/rfc822' || fileName.endsWith('.eml')) {
          inputType = 'EML';
        } else {
          // Default to DOCX for unknown types
          inputType = 'DOCX';
        }
      }

      // Create run
      const runResult = await runApi.create({
        inputType,
        timezone,
      });

      const runId = runResult.data.runId;

      // Process run
      await runApi.process(runId, {
        text: inputMode === 'text' ? text : undefined,
        fileId: fileIds.length === 1 ? fileIds[0] : undefined,
        fileIds: fileIds.length > 1 ? fileIds : undefined,
      });

      // Navigate to run detail
      navigate(`/runs/${runId}`);
    } catch (error) {
      console.error('Failed to process:', error);
      alert('Failed to process. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Run</h1>

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit}>
          {/* Input Mode Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  type="button"
                  onClick={() => setInputMode('text')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    inputMode === 'text'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Paste Text
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('file')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    inputMode === 'file'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Upload File
                </button>
              </nav>
            </div>
          </div>

          {/* Text Input */}
          {inputMode === 'text' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste your content
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={12}
                className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Paste meeting notes, email content, or any text containing tasks..."
                required={inputMode === 'text'}
              />
            </div>
          )}

          {/* File Upload */}
          {inputMode === 'file' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload files (PDF, DOCX, or EML) - Multiple files supported 📎
              </label>
              <input
                type="file"
                accept=".pdf,.docx,.eml"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                required={inputMode === 'file'}
              />
              {files.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-sm font-medium text-gray-700">
                    {files.length} file{files.length > 1 ? 's' : ''} selected:
                  </p>
                  {files.map((file, idx) => (
                    <div key={idx} className="text-sm text-gray-600 flex items-center">
                      <span className="mr-2">📄</span>
                      <span>{file.name}</span>
                      <span className="ml-2 text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Options */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full max-w-xs border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
            <p className="mt-2 text-sm text-gray-500">
              🤖 LLM provider is automatically selected based on availability
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isProcessing || (inputMode === 'text' && !text) || (inputMode === 'file' && files.length === 0)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Extract Tasks'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
