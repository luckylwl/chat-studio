/**
 * Vector Memory Component (v4.0)
 *
 * Cross-conversation memory with forgetting curve and consolidation
 */

import React, { useState } from 'react';
import { vectorMemoryService, MemoryItem, MemoryQuery } from '../services/vectorMemoryService';

const MEMORY_TYPES: MemoryItem['type'][] = ['fact', 'preference', 'skill', 'event', 'relationship'];

export const VectorMemory: React.FC = () => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [newMemory, setNewMemory] = useState({
    content: '',
    type: 'fact' as MemoryItem['type'],
  });
  const [stats, setStats] = useState<any>(null);

  const loadMemories = () => {
    const allMemories = vectorMemoryService.getAllMemories();
    setMemories(allMemories);
  };

  const loadStats = () => {
    const statistics = vectorMemoryService.getStatistics();
    setStats(statistics);
  };

  const handleAddMemory = async () => {
    if (!newMemory.content.trim()) return;

    const memory = await vectorMemoryService.addMemory(
      newMemory.content.trim(),
      newMemory.type,
      {
        source: 'user_input',
        timestamp: new Date().toISOString(),
      }
    );

    setMemories(prev => [memory, ...prev]);
    setNewMemory({ content: '', type: 'fact' });
    loadStats();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    const query: MemoryQuery = {
      query: searchQuery.trim(),
      type: selectedType === 'all' ? undefined : selectedType as MemoryItem['type'],
      topK: 10,
    };

    const results = await vectorMemoryService.searchMemories(query);
    setSearchResults(results);
  };

  const handleConsolidate = async () => {
    const consolidations = await vectorMemoryService.consolidateMemories();
    loadMemories();
    loadStats();
    alert(`Consolidated ${consolidations.length} memory clusters`);
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      fact: 'bg-blue-100 text-blue-800',
      preference: 'bg-purple-100 text-purple-800',
      skill: 'bg-green-100 text-green-800',
      event: 'bg-orange-100 text-orange-800',
      relationship: 'bg-pink-100 text-pink-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getImportanceColor = (importance: number) => {
    if (importance >= 80) return 'text-red-600';
    if (importance >= 60) return 'text-orange-600';
    if (importance >= 40) return 'text-yellow-600';
    return 'text-gray-600';
  };

  React.useEffect(() => {
    loadMemories();
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">🧠 Vector Memory (v4.0)</h2>
        <p className="opacity-90">
          Cross-conversation memory with forgetting curve and semantic search
        </p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.totalMemories}</div>
            <div className="text-sm text-gray-600">Total Memories</div>
          </div>
          {Object.entries(stats.byType).map(([type, count]) => (
            <div key={type} className="bg-white rounded-lg shadow-md p-4 text-center">
              <div className="text-3xl font-bold text-gray-900">{count as number}</div>
              <div className="text-sm text-gray-600 capitalize">{type}</div>
            </div>
          ))}
        </div>
      )}

      {/* Add Memory */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <h3 className="text-xl font-semibold">Add New Memory</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Memory Type
          </label>
          <select
            value={newMemory.type}
            onChange={(e) => setNewMemory({ ...newMemory, type: e.target.value as MemoryItem['type'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            {MEMORY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <textarea
            value={newMemory.content}
            onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
            placeholder="Describe the memory... e.g., 'User prefers dark mode' or 'Discussed quantum computing on 2024-01-15'"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none"
            rows={3}
          />
        </div>

        <button
          onClick={handleAddMemory}
          disabled={!newMemory.content.trim()}
          className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors font-medium"
        >
          Add Memory
        </button>
      </div>

      {/* Search Memories */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <h3 className="text-xl font-semibold">Search Memories</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Type
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Types</option>
            {MEMORY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <textarea
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search semantically... e.g., 'What does the user prefer?' or 'Past conversations about AI'"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none"
            rows={3}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            disabled={!searchQuery.trim()}
            className="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors font-medium"
          >
            Search
          </button>
          <button
            onClick={handleConsolidate}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Consolidate
          </button>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h3 className="text-xl font-semibold">
            Search Results ({searchResults.length})
          </h3>
          <div className="space-y-3">
            {searchResults.map((result) => (
              <div key={result.memory.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${getTypeColor(result.memory.type)}`}>
                      {result.memory.type}
                    </span>
                    <span className={`text-sm font-semibold ${getImportanceColor(result.memory.importance)}`}>
                      Importance: {result.memory.importance}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-purple-600">
                    Relevance: {(result.relevance * 100).toFixed(1)}%
                  </div>
                </div>

                <p className="text-gray-700 mb-2">{result.memory.content}</p>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Accessed: {result.memory.accessCount}x</span>
                  <span>•</span>
                  <span>
                    Last: {new Date(result.memory.lastAccessed).toLocaleDateString()}
                  </span>
                  {result.memory.consolidatedFrom && result.memory.consolidatedFrom.length > 0 && (
                    <>
                      <span>•</span>
                      <span>Consolidated from {result.memory.consolidatedFrom.length} memories</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Memories */}
      {memories.length > 0 && searchResults.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h3 className="text-xl font-semibold">
            All Memories ({memories.length})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {memories.map((memory) => (
              <div key={memory.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-xs px-2 py-1 rounded ${getTypeColor(memory.type)}`}>
                    {memory.type}
                  </span>
                  <span className={`text-sm font-semibold ${getImportanceColor(memory.importance)}`}>
                    {memory.importance}
                  </span>
                </div>

                <p className="text-gray-700 mb-2">{memory.content}</p>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Accessed: {memory.accessCount}x</span>
                  <span>•</span>
                  <span>
                    Created: {new Date(memory.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Getting Started */}
      {memories.length === 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="font-semibold text-purple-900 mb-3">Vector Memory Features (v4.0)</h3>
          <ul className="space-y-2 text-sm text-purple-800">
            <li>✓ Store memories across conversations</li>
            <li>✓ Semantic search with vector embeddings</li>
            <li>✓ Automatic importance scoring</li>
            <li>✓ Forgetting curve based on Ebbinghaus theory</li>
            <li>✓ Memory consolidation to reduce redundancy</li>
            <li>✓ 5 memory types: facts, preferences, skills, events, relationships</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default VectorMemory;
