/**
 * Dialogue Context Component (v4.0)
 *
 * Advanced reference resolution, topic tracking, and intent detection
 */

import React, { useState } from 'react';
import { dialogueContextService, DialogueContext } from '../services/dialogueContextService';

export const DialogueContextComponent: React.FC = () => {
  const [conversationId] = useState('conv-' + Math.random().toString(36).substr(2, 9));
  const [context, setContext] = useState<DialogueContext | null>(null);
  const [message, setMessage] = useState('');
  const [role, setRole] = useState<'user' | 'assistant'>('user');
  const [messages, setMessages] = useState<any[]>([]);

  const loadContext = () => {
    const ctx = dialogueContextService.getContext(conversationId);
    if (ctx) {
      setContext(ctx);
      setMessages(Array.from(ctx.messages.values()));
    }
  };

  const handleAddMessage = async () => {
    if (!message.trim()) return;

    const msg = await dialogueContextService.addMessage(
      conversationId,
      role,
      message.trim()
    );

    setMessages(prev => [...prev, msg]);
    setMessage('');
    loadContext();
  };

  const handleAnalyze = () => {
    const analysis = dialogueContextService.analyzeContext(conversationId);
    return analysis;
  };

  React.useEffect(() => {
    loadContext();
  }, []);

  const getIntentColor = (intent: string) => {
    const colors: Record<string, string> = {
      question: 'bg-blue-100 text-blue-800',
      statement: 'bg-gray-100 text-gray-800',
      request: 'bg-purple-100 text-purple-800',
      greeting: 'bg-green-100 text-green-800',
      farewell: 'bg-orange-100 text-orange-800',
      clarification: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[intent] || 'bg-gray-100 text-gray-800';
  };

  const analysis = context ? handleAnalyze() : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 to-cyan-700 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">💬 Dialogue Context (v4.0)</h2>
        <p className="opacity-90">
          Advanced conversation understanding with entity tracking and intent detection
        </p>
      </div>

      {/* Context Overview */}
      {context && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h3 className="text-xl font-semibold">Context Overview</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-teal-50 rounded">
              <div className="text-2xl font-bold text-teal-600">
                {context.messages.size}
              </div>
              <div className="text-sm text-gray-600">Messages</div>
            </div>
            <div className="text-center p-4 bg-cyan-50 rounded">
              <div className="text-2xl font-bold text-cyan-600">
                {context.entities.size}
              </div>
              <div className="text-sm text-gray-600">Entities</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">
                {context.topics.length}
              </div>
              <div className="text-sm text-gray-600">Topics</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded">
              <div className="text-2xl font-bold text-purple-600">
                {context.references.size}
              </div>
              <div className="text-sm text-gray-600">References</div>
            </div>
          </div>

          {/* Entities */}
          {context.entities.size > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Detected Entities</h4>
              <div className="space-y-2">
                {Array.from(context.entities.values()).map((entity) => (
                  <div key={entity.id} className="flex items-start justify-between p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{entity.value}</div>
                      <div className="text-sm text-gray-600">
                        Type: {entity.type} • Mentions: {entity.mentions.length} • Confidence: {(entity.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Topics */}
          {context.topics.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Topics</h4>
              <div className="flex flex-wrap gap-2">
                {context.topics.map((topic, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Message */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <h3 className="text-xl font-semibold">Add Message</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'user' | 'assistant')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="user">User</option>
            <option value="assistant">Assistant</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter a message to analyze context..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none"
            rows={3}
          />
        </div>

        <button
          onClick={handleAddMessage}
          disabled={!message.trim()}
          className="w-full py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-400 transition-colors font-medium"
        >
          Add Message
        </button>
      </div>

      {/* Messages */}
      {messages.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h3 className="text-xl font-semibold">Conversation ({messages.length})</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-4 rounded-lg ${
                  msg.role === 'user' ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50 border-l-4 border-gray-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900 capitalize">{msg.role}</span>
                  <span className={`text-xs px-2 py-1 rounded ${getIntentColor(msg.intent.type)}`}>
                    {msg.intent.type}
                  </span>
                </div>

                <p className="text-gray-700 mb-2">{msg.content}</p>

                {msg.entities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {msg.entities.map((entityId, index) => {
                      const entity = context?.entities.get(entityId);
                      return entity ? (
                        <span key={index} className="text-xs px-2 py-1 bg-teal-100 text-teal-800 rounded">
                          {entity.value} ({entity.type})
                        </span>
                      ) : null;
                    })}
                  </div>
                )}

                {msg.topic && (
                  <div className="text-xs text-gray-600">
                    Topic: {msg.topic}
                  </div>
                )}

                {msg.intent.confidence && (
                  <div className="text-xs text-gray-500 mt-1">
                    Confidence: {(msg.intent.confidence * 100).toFixed(0)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis */}
      {analysis && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h3 className="text-xl font-semibold">Context Analysis</h3>

          {analysis.intentDistribution && Object.keys(analysis.intentDistribution).length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Intent Distribution</h4>
              <div className="space-y-2">
                {Object.entries(analysis.intentDistribution).map(([intent, count]) => (
                  <div key={intent} className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded text-sm min-w-[120px] ${getIntentColor(intent)}`}>
                      {intent}
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-6">
                      <div
                        className="bg-teal-600 h-6 rounded-full flex items-center justify-end px-2 text-white text-xs font-semibold"
                        style={{ width: `${((count as number) / messages.length) * 100}%` }}
                      >
                        {count as number}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.topicProgression && analysis.topicProgression.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Topic Progression</h4>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {analysis.topicProgression.map((topic, index) => (
                  <React.Fragment key={index}>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm whitespace-nowrap">
                      {topic}
                    </span>
                    {index < analysis.topicProgression.length - 1 && (
                      <span className="text-gray-400">→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-gray-900">
                {analysis.entityCount}
              </div>
              <div className="text-sm text-gray-600">Total Entities</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-gray-900">
                {analysis.averageMessageLength || 0}
              </div>
              <div className="text-sm text-gray-600">Avg Message Length</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-gray-900">
                {analysis.topicProgression?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Topic Shifts</div>
            </div>
          </div>
        </div>
      )}

      {/* Getting Started */}
      {messages.length === 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-6">
          <h3 className="font-semibold text-teal-900 mb-3">Dialogue Context Features (v4.0)</h3>
          <ul className="space-y-2 text-sm text-teal-800">
            <li>✓ Automatic entity extraction (person, place, organization, etc.)</li>
            <li>✓ Intent detection for every message</li>
            <li>✓ Topic tracking across conversation</li>
            <li>✓ Reference resolution (pronouns, "it", "that", etc.)</li>
            <li>✓ Context-aware analysis</li>
            <li>✓ Conversation flow visualization</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default DialogueContextComponent;
