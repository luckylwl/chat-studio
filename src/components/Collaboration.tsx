/**
 * Real-time Collaboration Component
 *
 * CRDT-based collaborative editing with cursor sync and comments
 */

import React, { useState, useEffect } from 'react';
import { collaborationService, CollaborativeDocument, Presence, Comment } from '../services/collaborationService';

export const Collaboration: React.FC = () => {
  const [documents, setDocuments] = useState<CollaborativeDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [userName, setUserName] = useState('User ' + Math.floor(Math.random() * 1000));
  const [presences, setPresences] = useState<Map<string, Presence>>(new Map());
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  const currentDoc = documents.find(d => d.id === selectedDoc);

  const handleCreateDocument = () => {
    const doc = collaborationService.createDocument('# New Document\n\nStart typing here...');
    setDocuments(prev => [...prev, doc]);
    setSelectedDoc(doc.id);
    setContent(doc.content);
  };

  const handleContentChange = (newContent: string, position: number) => {
    if (!selectedDoc) return;

    // Calculate the operation (simplified - in reality would be more complex)
    const operation = {
      type: 'insert' as const,
      position,
      value: newContent.slice(position, position + 1),
      timestamp: Date.now(),
      userId: userName,
    };

    collaborationService.applyOperation(selectedDoc, operation);
    setContent(newContent);
    setCursorPosition(position);

    // Update presence
    collaborationService.updatePresence(selectedDoc, userName, {
      cursorPosition: position,
      selection: null,
      isTyping: true,
    });
  };

  const handleAddComment = () => {
    if (!selectedDoc || !newComment.trim()) return;

    const comment = collaborationService.addComment(selectedDoc, {
      userId: userName,
      content: newComment.trim(),
      position: cursorPosition,
    });

    setComments(prev => [...prev, comment]);
    setNewComment('');
  };

  useEffect(() => {
    if (!selectedDoc) return;

    // Simulate presence updates
    const interval = setInterval(() => {
      const doc = documents.find(d => d.id === selectedDoc);
      if (doc) {
        setPresences(doc.presence);
        setComments(doc.comments);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedDoc, documents]);

  const getPresenceColor = (userId: string) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500'];
    const index = userId.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-green-600 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">👥 Real-time Collaboration</h2>
        <p className="opacity-90">
          CRDT-based collaborative editing with live cursor tracking
        </p>
      </div>

      {/* User Settings */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Name
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <button
          onClick={handleCreateDocument}
          className="w-full py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
        >
          Create New Document
        </button>
      </div>

      {/* Document List */}
      {documents.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h3 className="text-xl font-semibold">Documents</h3>
          <div className="space-y-2">
            {documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => {
                  setSelectedDoc(doc.id);
                  setContent(doc.content);
                }}
                className={`w-full text-left p-4 border rounded-lg transition-all ${
                  selectedDoc === doc.id
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-teal-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{doc.id}</span>
                  <div className="flex -space-x-2">
                    {Array.from(doc.presence.entries()).slice(0, 3).map(([userId]) => (
                      <div
                        key={userId}
                        className={`w-8 h-8 rounded-full ${getPresenceColor(userId)} flex items-center justify-center text-white text-xs font-semibold border-2 border-white`}
                        title={userId}
                      >
                        {userId.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {doc.presence.size > 3 && (
                      <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs font-semibold border-2 border-white">
                        +{doc.presence.size - 3}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Editor */}
      {currentDoc && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Active Users Bar */}
          <div className="bg-gray-50 border-b p-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Active Users:</span>
              <div className="flex gap-2">
                {Array.from(presences.entries()).map(([userId, presence]) => (
                  <div key={userId} className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border">
                    <div className={`w-3 h-3 rounded-full ${getPresenceColor(userId)}`} />
                    <span className="text-sm text-gray-700">{userId}</span>
                    {presence.isTyping && (
                      <span className="text-xs text-gray-500">typing...</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Editor Area */}
          <div className="p-6">
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value, e.target.selectionStart)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 resize-none font-mono"
              rows={15}
              placeholder="Start typing..."
            />
            <div className="text-xs text-gray-500 mt-2">
              Cursor position: {cursorPosition} | Characters: {content.length}
            </div>
          </div>
        </div>
      )}

      {/* Comments Section */}
      {currentDoc && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h3 className="text-xl font-semibold">Comments ({comments.length})</h3>

          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="border-l-4 border-teal-500 bg-teal-50 p-4 rounded">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full ${getPresenceColor(comment.userId)} flex items-center justify-center text-white text-sm font-semibold`}>
                      {comment.userId.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{comment.userId}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-700 ml-10">{comment.content}</p>
                <div className="text-xs text-gray-500 ml-10 mt-1">
                  Position: {comment.position}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
              placeholder="Add a comment at current cursor position..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-400 transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Getting Started */}
      {documents.length === 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-6">
          <h3 className="font-semibold text-teal-900 mb-3">Collaboration Features</h3>
          <ul className="space-y-2 text-sm text-teal-800">
            <li>✓ Real-time collaborative editing with CRDT</li>
            <li>✓ Live cursor tracking for all users</li>
            <li>✓ Typing indicators</li>
            <li>✓ Comments and annotations</li>
            <li>✓ Conflict-free synchronization</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Collaboration;
