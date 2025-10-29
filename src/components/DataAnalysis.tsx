/**
 * Data Analysis Workbench Component
 *
 * Import data, run natural language queries, get visualization recommendations
 */

import React, { useState } from 'react';
import { dataAnalysisService, Dataset, QueryRequest } from '../services/dataAnalysisService';

export const DataAnalysis: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [queryResults, setQueryResults] = useState<any>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const [visualizations, setVisualizations] = useState<any[]>([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataset = await dataAnalysisService.importCSV(file);
      setDatasets(prev => [dataset, ...prev]);
      setSelectedDataset(dataset.id);
    } catch (error) {
      console.error('File import failed:', error);
    }
  };

  const handleQuery = async () => {
    if (!selectedDataset || !query.trim()) return;

    setIsQuerying(true);
    try {
      const request: QueryRequest = {
        datasetId: selectedDataset,
        query: query.trim(),
      };

      const result = await dataAnalysisService.queryWithNaturalLanguage(request);
      setQueryResults(result);
    } catch (error) {
      console.error('Query failed:', error);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleGetVisualizations = () => {
    if (!selectedDataset) return;

    const vizRecs = dataAnalysisService.recommendVisualizations(selectedDataset);
    setVisualizations(vizRecs);
  };

  const currentDataset = datasets.find(d => d.id === selectedDataset);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-cyan-600 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">📊 Data Analysis Workbench</h2>
        <p className="opacity-90">
          Import data, run natural language queries, and get AI-powered insights
        </p>
      </div>

      {/* Import Data */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <h3 className="text-xl font-semibold">Import Dataset</h3>

        <label className="block cursor-pointer">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors">
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="text-5xl mb-3">📊</div>
            <div className="text-gray-700 font-medium mb-1">
              Click to upload CSV or JSON file
            </div>
            <div className="text-sm text-gray-500">
              Supports CSV and JSON formats
            </div>
          </div>
        </label>

        {datasets.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Dataset
            </label>
            <select
              value={selectedDataset || ''}
              onChange={(e) => setSelectedDataset(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Choose a dataset...</option>
              {datasets.map((ds) => (
                <option key={ds.id} value={ds.id}>
                  {ds.name} ({ds.rowCount} rows, {ds.columns.length} columns)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Dataset Preview */}
      {currentDataset && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Dataset: {currentDataset.name}</h3>
            <button
              onClick={handleGetVisualizations}
              className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
            >
              Get Viz Recommendations
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-gray-900">{currentDataset.rowCount}</div>
              <div className="text-sm text-gray-600">Rows</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-gray-900">{currentDataset.columns.length}</div>
              <div className="text-sm text-gray-600">Columns</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Columns</h4>
            <div className="flex flex-wrap gap-2">
              {currentDataset.columns.map((col) => (
                <span key={col.name} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                  {col.name} <span className="text-indigo-600">({col.type})</span>
                </span>
              ))}
            </div>
          </div>

          {currentDataset.preview && currentDataset.preview.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Preview (first 5 rows)</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {currentDataset.columns.map((col) => (
                        <th key={col.name} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          {col.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentDataset.preview.slice(0, 5).map((row: any, idx: number) => (
                      <tr key={idx}>
                        {currentDataset.columns.map((col) => (
                          <td key={col.name} className="px-4 py-2 text-sm text-gray-700">
                            {String(row[col.name] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Natural Language Query */}
      {currentDataset && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h3 className="text-xl font-semibold">Query with Natural Language</h3>

          <div>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask questions about your data... e.g., 'What is the average sales by region?'"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {[
              'Show the top 10 rows',
              'Calculate the average of all numeric columns',
              'Group by category and sum values',
              'Find rows where value > 100',
            ].map((example) => (
              <button
                key={example}
                onClick={() => setQuery(example)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
              >
                {example}
              </button>
            ))}
          </div>

          <button
            onClick={handleQuery}
            disabled={isQuerying || !query.trim()}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isQuerying ? 'Querying...' : 'Run Query'}
          </button>
        </div>
      )}

      {/* Query Results */}
      {queryResults && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h3 className="text-xl font-semibold">Query Results</h3>

          {queryResults.sql && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Generated SQL:</h4>
              <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto">
                <code>{queryResults.sql}</code>
              </pre>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Results ({queryResults.rowCount} rows)
            </h4>
            {queryResults.data && queryResults.data.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(queryResults.data[0]).map((key) => (
                        <th key={key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {queryResults.data.slice(0, 20).map((row: any, idx: number) => (
                      <tr key={idx}>
                        {Object.values(row).map((value: any, cellIdx: number) => (
                          <td key={cellIdx} className="px-4 py-2 text-sm text-gray-700">
                            {String(value ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {queryResults.data.length > 20 && (
                  <div className="text-sm text-gray-500 text-center py-2">
                    Showing 20 of {queryResults.data.length} rows
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Visualization Recommendations */}
      {visualizations.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h3 className="text-xl font-semibold">Visualization Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visualizations.map((viz) => (
              <div key={viz.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <h4 className="font-semibold text-gray-900 mb-2">{viz.type}</h4>
                <p className="text-sm text-gray-600 mb-3">{viz.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Score: {viz.score}/100</span>
                  <button className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 text-sm">
                    Create
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Getting Started */}
      {datasets.length === 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
          <h3 className="font-semibold text-indigo-900 mb-3">Data Analysis Features</h3>
          <ul className="space-y-2 text-sm text-indigo-800">
            <li>✓ Import CSV and JSON datasets</li>
            <li>✓ Query data using natural language</li>
            <li>✓ Automatically generate SQL from questions</li>
            <li>✓ Get AI-powered visualization recommendations</li>
            <li>✓ Export results in multiple formats</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default DataAnalysis;
