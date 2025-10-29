/**
 * AI Debate Arena Component
 *
 * Watch AI models debate each other on any topic
 */

import React, { useState } from 'react';
import { debateService, Debate, Team } from '../services/debateService';

const DEBATE_FORMATS: Debate['format'][] = ['oxford', 'lincoln-douglas', 'parliamentary', 'round-robin'];

const MODELS = [
  'gpt-4', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet',
  'llama-3-70b', 'mistral-large', 'gemini-pro'
];

export const DebateArena: React.FC = () => {
  const [debates, setDebates] = useState<Debate[]>([]);
  const [selectedDebate, setSelectedDebate] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState<Debate['format']>('oxford');
  const [teamAName, setTeamAName] = useState('Team For');
  const [teamBName, setTeamBName] = useState('Team Against');
  const [teamAModels, setTeamAModels] = useState<string[]>(['gpt-4']);
  const [teamBModels, setTeamBModels] = useState<string[]>(['claude-3-opus']);
  const [isRunning, setIsRunning] = useState(false);

  const currentDebate = debates.find(d => d.id === selectedDebate);

  const handleCreateDebate = () => {
    if (!topic.trim()) return;

    const debate = debateService.createDebate(topic, description, format);
    setDebates(prev => [...prev, debate]);
    setSelectedDebate(debate.id);
    setTopic('');
    setDescription('');
  };

  const handleAddTeamA = () => {
    if (!selectedDebate || teamAModels.length === 0) return;

    debateService.addTeam(selectedDebate, {
      name: teamAName,
      position: 'for',
      models: teamAModels,
    });

    const updatedDebate = debateService.getDebate(selectedDebate);
    if (updatedDebate) {
      setDebates(prev => prev.map(d => d.id === selectedDebate ? updatedDebate : d));
    }
  };

  const handleAddTeamB = () => {
    if (!selectedDebate || teamBModels.length === 0) return;

    debateService.addTeam(selectedDebate, {
      name: teamBName,
      position: 'against',
      models: teamBModels,
    });

    const updatedDebate = debateService.getDebate(selectedDebate);
    if (updatedDebate) {
      setDebates(prev => prev.map(d => d.id === selectedDebate ? updatedDebate : d));
    }
  };

  const handleStartDebate = async () => {
    if (!selectedDebate) return;

    setIsRunning(true);
    try {
      await debateService.startDebate(selectedDebate);
      const updatedDebate = debateService.getDebate(selectedDebate);
      if (updatedDebate) {
        setDebates(prev => prev.map(d => d.id === selectedDebate ? updatedDebate : d));
      }
    } catch (error) {
      console.error('Debate failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'setup': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">⚔️ AI Debate Arena</h2>
        <p className="opacity-90">
          Watch AI models debate each other on any topic - unique and entertaining!
        </p>
      </div>

      {/* Create Debate */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <h3 className="text-xl font-semibold">Create New Debate</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Debate Topic
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., 'Is AI a threat to humanity?'"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide context or rules for the debate..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Debate Format
          </label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as Debate['format'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            {DEBATE_FORMATS.map((fmt) => (
              <option key={fmt} value={fmt}>
                {fmt.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleCreateDebate}
          disabled={!topic.trim()}
          className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Create Debate
        </button>
      </div>

      {/* Setup Teams */}
      {currentDebate && currentDebate.status === 'setup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Team A */}
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <h3 className="text-xl font-semibold text-green-700">Team A (For)</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Name
              </label>
              <input
                type="text"
                value={teamAName}
                onChange={(e) => setTeamAName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Models
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {MODELS.map((model) => (
                  <label key={model} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={teamAModels.includes(model)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTeamAModels(prev => [...prev, model]);
                        } else {
                          setTeamAModels(prev => prev.filter(m => m !== model));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">{model}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleAddTeamA}
              disabled={teamAModels.length === 0}
              className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              Add Team A
            </button>
          </div>

          {/* Team B */}
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <h3 className="text-xl font-semibold text-red-700">Team B (Against)</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Name
              </label>
              <input
                type="text"
                value={teamBName}
                onChange={(e) => setTeamBName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Models
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {MODELS.map((model) => (
                  <label key={model} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={teamBModels.includes(model)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTeamBModels(prev => [...prev, model]);
                        } else {
                          setTeamBModels(prev => prev.filter(m => m !== model));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">{model}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleAddTeamB}
              disabled={teamBModels.length === 0}
              className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
            >
              Add Team B
            </button>
          </div>
        </div>
      )}

      {/* Start Debate */}
      {currentDebate && currentDebate.status === 'setup' && currentDebate.teams.length >= 2 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <button
            onClick={handleStartDebate}
            disabled={isRunning}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-400 transition-all font-bold text-lg"
          >
            {isRunning ? 'Debate in Progress...' : 'START DEBATE 🎤'}
          </button>
        </div>
      )}

      {/* Debate Rounds */}
      {currentDebate && currentDebate.rounds.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b">
            <h3 className="text-xl font-semibold">Debate Rounds</h3>
            <span className={`px-4 py-2 rounded-lg font-semibold ${getStatusColor(currentDebate.status)}`}>
              {currentDebate.status.toUpperCase()}
            </span>
          </div>

          {currentDebate.rounds.map((round, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-4">Round {round.roundNumber}</h4>
              <div className="space-y-3">
                {round.speeches.map((speech, speechIdx) => (
                  <div key={speechIdx} className={`p-4 rounded-lg ${
                    speech.position === 'for' ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        {speech.position === 'for' ? '✅' : '❌'} {speech.teamName} ({speech.speaker})
                      </span>
                      <span className="text-sm text-gray-600">{speech.duration}s</span>
                    </div>
                    <p className="text-gray-700">{speech.content}</p>
                  </div>
                ))}
              </div>
              {round.scores && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {Object.entries(round.scores).map(([teamId, score]) => (
                    <div key={teamId} className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{score}</div>
                      <div className="text-sm text-gray-600">Score</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {currentDebate.status === 'completed' && currentDebate.winner && (
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white p-6 rounded-lg text-center">
              <h3 className="text-2xl font-bold mb-2">🏆 Winner: {currentDebate.winner}</h3>
              <p className="opacity-90">Final Score: {currentDebate.scores[currentDebate.winner]}</p>
            </div>
          )}
        </div>
      )}

      {/* Debate List */}
      {debates.length > 0 && !currentDebate && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Your Debates</h3>
          <div className="space-y-3">
            {debates.map((debate) => (
              <button
                key={debate.id}
                onClick={() => setSelectedDebate(debate.id)}
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">{debate.topic}</span>
                  <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(debate.status)}`}>
                    {debate.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {debate.format} • {debate.teams.length} teams • {debate.rounds.length} rounds
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Getting Started */}
      {debates.length === 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="font-semibold text-red-900 mb-3">AI Debate Arena Features</h3>
          <ul className="space-y-2 text-sm text-red-800">
            <li>✓ Create debates on any topic</li>
            <li>✓ Choose from 4 debate formats</li>
            <li>✓ Pit AI models against each other</li>
            <li>✓ Watch debates unfold in real-time</li>
            <li>✓ Automatic scoring and winner selection</li>
            <li>✓ Unique and entertaining feature!</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default DebateArena;
