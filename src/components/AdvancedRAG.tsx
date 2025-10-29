/**
 * Advanced RAG Component
 *
 * Hybrid search (vector + BM25), reranking, citation tracking
 */

import React, { useState } from 'react';
import { advancedRAGService, SearchConfig, Document } from '../services/advancedRAGService';

export const AdvancedRAG: React.FC = () => {
  const [query, setQuery] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState<'hybrid' | 'vector' | 'keyword'>('hybrid');
  const [useReranking, setUseReranking] = useState(true);
  const [useExpansion, setUseExpansion] = useState(true);
  const [topK, setTopK] = useState(10);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newDocs: Document[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const text = await file.text();

      const doc: Document = {
        id: `doc-${Date.now()}-${i}`,
        content: text,
        metadata: {
          filename: file.name,
          uploadedAt: new Date().toISOString(),
          size: file.size,
        },
      };

      newDocs.push(doc);
      advancedRAGService.addDocument(doc);
    }

    setDocuments(prev => [...prev, ...newDocs]);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const config: SearchConfig = {
        mode: searchMode,
        useReranking,
        useQueryExpansion: useExpansion,
        topK,
      };

      const searchResults = await advancedRAGService.search(query, config);
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearDocuments = () => {
    advancedRAGService.clearDocuments();
    setDocuments([]);
    setResults([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">📚 Advanced RAG</h2>
        <p className="opacity-90">
          Hybrid search (vector + BM25) with reranking and citation tracking
        </p>
      </div>

      {/* Document Management */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <h3 className="text-xl font-semibold">Document Library</h3>

        <div className="flex gap-4">
          <label className="flex-1 cursor-pointer">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                multiple
                accept=".txt,.md,.json,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="text-4xl mb-2">📄</div>
              <div className="text-sm text-gray-600">
                Click to upload documents (.txt, .md, .json, .csv)
              </div>
            </div>
          </label>
        </div>

        {documents.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                {documents.length} document(s) loaded
              </span>
              <button
                onClick={handleClearDocuments}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Clear All
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{doc.metadata.filename}</div>
                    <div className="text-xs text-gray-500">
                      {(doc.metadata.size / 1024).toFixed(2)} KB
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      advancedRAGService.removeDocument(doc.id);
                      setDocuments(prev => prev.filter(d => d.id !== doc.id));
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search Configuration */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <h3 className="text-xl font-semibold">Search Configuration</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Mode
            </label>
            <select
              value={searchMode}
              onChange={(e) => setSearchMode(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="hybrid">Hybrid (Vector + BM25)</option>
              <option value="vector">Vector Only</option>
              <option value="keyword">Keyword Only (BM25)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Results to Return
            </label>
            <input
              type="number"
              value={topK}
              onChange={(e) => setTopK(parseInt(e.target.value))}
              min={1}
              max={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useReranking}
              onChange={(e) => setUseReranking(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Use Cross-Encoder Reranking</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useExpansion}
              onChange={(e) => setUseExpansion(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Use Query Expansion</span>
          </label>
        </div>

        <div>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your search query..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
            rows={3}
          />
        </div>

        <button
          onClick={handleSearch}
          disabled={isSearching || !query.trim() || documents.length === 0}
          className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isSearching ? 'Searching...' : 'Search Documents'}
        </button>
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">
            Search Results ({results.length})
          </h3>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={result.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-semibold">
                      {index + 1}
                    </span>
                    <h4 className="font-semibold text-gray-900">
                      {result.metadata.filename || `Document ${result.id}`}
                    </h4>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-purple-600">
                      Score: {(result.score * 100).toFixed(1)}%
                    </div>
                    {result.rerankScore && (
                      <div className="text-xs text-gray-500">
                        Rerank: {(result.rerankScore * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-gray-700 mb-3">{result.content}</p>

                {result.metadata && Object.keys(result.metadata).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(result.metadata).map(([key, value]) => (
                      <span key={key} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Getting Started */}
      {documents.length === 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="font-semibold text-purple-900 mb-3">How to use Advanced RAG</h3>
          <ul className="space-y-2 text-sm text-purple-800">
            <li>✓ Upload documents to create your knowledge base</li>
            <li>✓ Choose between hybrid, vector, or keyword search</li>
            <li>✓ Enable reranking for improved accuracy</li>
            <li>✓ Use query expansion to find more relevant results</li>
            <li>✓ Get ranked results with citation tracking</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default AdvancedRAG;
