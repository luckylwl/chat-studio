/**
 * Smart Search Component
 *
 * Perplexity-style search with citations and multi-source verification
 */

import React, { useState } from 'react';
import { smartSearchService, SearchQuery, SearchResult } from '../services/smartSearchService';

export const SmartSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchResult[]>([]);
  const [includeDomains, setIncludeDomains] = useState<string>('');
  const [excludeDomains, setExcludeDomains] = useState<string>('');

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const searchQuery: SearchQuery = {
        query: query.trim(),
        maxResults: 10,
        includeDomains: includeDomains ? includeDomains.split(',').map(d => d.trim()) : undefined,
        excludeDomains: excludeDomains ? excludeDomains.split(',').map(d => d.trim()) : undefined,
      };

      const result = await smartSearchService.search(searchQuery);
      setResults(result);
      setSearchHistory(prev => [result, ...prev.slice(0, 9)]);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100';
    if (confidence >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">🔍 Smart Search</h2>
        <p className="opacity-90">
          Perplexity-style search with citations and multi-source verification
        </p>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask anything... (e.g., 'What are the latest developments in quantum computing?')"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
          />
        </div>

        {/* Advanced Options */}
        <details className="text-sm">
          <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
            Advanced Options
          </summary>
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-gray-700 mb-1">Include Domains (comma-separated)</label>
              <input
                type="text"
                value={includeDomains}
                onChange={(e) => setIncludeDomains(e.target.value)}
                placeholder="e.g., arxiv.org, scholar.google.com"
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Exclude Domains (comma-separated)</label>
              <input
                type="text"
                value={excludeDomains}
                onChange={(e) => setExcludeDomains(e.target.value)}
                placeholder="e.g., reddit.com, quora.com"
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>
          </div>
        </details>

        <button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Search Results */}
      {results && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Confidence Score */}
          <div className="flex items-center justify-between pb-4 border-b">
            <h3 className="text-xl font-semibold">Search Results</h3>
            <div className={`px-4 py-2 rounded-lg ${getConfidenceBg(results.confidence)}`}>
              <span className={`font-semibold ${getConfidenceColor(results.confidence)}`}>
                Confidence: {results.confidence}%
              </span>
            </div>
          </div>

          {/* Answer */}
          <div className="prose max-w-none">
            <h4 className="text-lg font-semibold mb-3">Answer</h4>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {results.answer}
            </p>
          </div>

          {/* Citations */}
          {results.citations.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-3">Citations</h4>
              <div className="space-y-2">
                {results.citations.map((citation, index) => (
                  <div
                    key={citation.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{citation.text}</div>
                      <a
                        href={citation.source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {citation.source.title || citation.source.url}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sources */}
          {results.sources.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-3">
                Sources ({results.sources.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.sources.map((source) => (
                  <a
                    key={source.id}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-semibold text-gray-900 flex-1 line-clamp-2">
                        {source.title}
                      </h5>
                      <span className="ml-2 text-sm text-gray-500">
                        {source.credibilityScore}/100
                      </span>
                    </div>
                    {source.snippet && (
                      <p className="text-sm text-gray-600 line-clamp-3 mb-2">
                        {source.snippet}
                      </p>
                    )}
                    <div className="text-xs text-blue-600 truncate">
                      {new URL(source.url).hostname}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search History */}
      {searchHistory.length > 0 && !results && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Recent Searches</h3>
          <div className="space-y-3">
            {searchHistory.map((item, index) => (
              <button
                key={item.id}
                onClick={() => {
                  setQuery(item.query);
                  setResults(item);
                }}
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{item.query}</span>
                  <span className={`text-sm px-2 py-1 rounded ${getConfidenceBg(item.confidence)}`}>
                    {item.confidence}%
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {item.answer}
                </p>
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(item.timestamp).toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Getting Started */}
      {!results && searchHistory.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">How to use Smart Search</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>✓ Ask questions in natural language</li>
            <li>✓ Get answers synthesized from multiple sources</li>
            <li>✓ View citations and source credibility scores</li>
            <li>✓ Filter by including or excluding specific domains</li>
            <li>✓ See confidence scores for answer quality</li>
          </ul>
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-sm text-blue-700 font-medium mb-2">Example queries:</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Latest AI research breakthroughs',
                'Climate change impact on agriculture',
                'Best practices for React performance',
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => setQuery(example)}
                  className="px-3 py-1 bg-white text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartSearch;
