/**
 * Code Assistant Component
 *
 * AI-powered code completion, bug detection, refactoring, and test generation
 */

import React, { useState } from 'react';
import { codeAssistantService, CodeCompletionRequest, BugReport, RefactoringSuggestion } from '../services/codeAssistantService';

type TabType = 'complete' | 'explain' | 'bugs' | 'refactor' | 'tests' | 'optimize';

const SUPPORTED_LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp',
  'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'html', 'css'
];

export const CodeAssistant: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('complete');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Results
  const [completions, setCompletions] = useState<any[]>([]);
  const [explanation, setExplanation] = useState<any>(null);
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [refactorings, setRefactorings] = useState<RefactoringSuggestion[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [optimizations, setOptimizations] = useState<any[]>([]);

  const handleCodeCompletion = async () => {
    if (!code.trim()) return;

    setIsProcessing(true);
    try {
      const request: CodeCompletionRequest = {
        code: code.trim(),
        language,
        cursorPosition,
      };
      const result = await codeAssistantService.getCompletions(request);
      setCompletions(result);
    } catch (error) {
      console.error('Code completion failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExplainCode = async () => {
    if (!code.trim()) return;

    setIsProcessing(true);
    try {
      const result = await codeAssistantService.explainCode(code.trim(), language);
      setExplanation(result);
    } catch (error) {
      console.error('Code explanation failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDetectBugs = async () => {
    if (!code.trim()) return;

    setIsProcessing(true);
    try {
      const result = await codeAssistantService.detectBugs(code.trim(), language);
      setBugs(result);
    } catch (error) {
      console.error('Bug detection failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefactor = async () => {
    if (!code.trim()) return;

    setIsProcessing(true);
    try {
      const result = await codeAssistantService.suggestRefactorings(code.trim(), language);
      setRefactorings(result);
    } catch (error) {
      console.error('Refactoring failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateTests = async () => {
    if (!code.trim()) return;

    setIsProcessing(true);
    try {
      const result = await codeAssistantService.generateTests(code.trim(), language);
      setTests(result);
    } catch (error) {
      console.error('Test generation failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOptimize = async () => {
    if (!code.trim()) return;

    setIsProcessing(true);
    try {
      const result = await codeAssistantService.optimizeCode(code.trim(), language);
      setOptimizations(result);
    } catch (error) {
      console.error('Code optimization failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAction = () => {
    switch (activeTab) {
      case 'complete':
        handleCodeCompletion();
        break;
      case 'explain':
        handleExplainCode();
        break;
      case 'bugs':
        handleDetectBugs();
        break;
      case 'refactor':
        handleRefactor();
        break;
      case 'tests':
        handleGenerateTests();
        break;
      case 'optimize':
        handleOptimize();
        break;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'complete', label: 'Complete', icon: '⚡' },
    { id: 'explain', label: 'Explain', icon: '📖' },
    { id: 'bugs', label: 'Find Bugs', icon: '🐛' },
    { id: 'refactor', label: 'Refactor', icon: '🔧' },
    { id: 'tests', label: 'Tests', icon: '🧪' },
    { id: 'optimize', label: 'Optimize', icon: '⚡' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">💻 Code Assistant</h2>
        <p className="opacity-90">
          AI-powered code completion, bug detection, refactoring, and more
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 min-w-max px-4 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {/* Language Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Programming Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Code Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Code
            </label>
            <textarea
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setCursorPosition(e.target.selectionStart);
              }}
              placeholder="Paste or write your code here..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
              rows={12}
            />
            <div className="text-xs text-gray-500 mt-1">
              Cursor position: {cursorPosition} | Lines: {code.split('\n').length}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleAction}
            disabled={isProcessing || !code.trim()}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isProcessing ? 'Processing...' :
              activeTab === 'complete' ? 'Get Completions' :
              activeTab === 'explain' ? 'Explain Code' :
              activeTab === 'bugs' ? 'Find Bugs' :
              activeTab === 'refactor' ? 'Suggest Refactorings' :
              activeTab === 'tests' ? 'Generate Tests' :
              'Optimize Code'
            }
          </button>
        </div>
      </div>

      {/* Results */}
      {activeTab === 'complete' && completions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Code Completions</h3>
          <div className="space-y-3">
            {completions.map((completion, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{completion.type}</span>
                  <span className="text-sm text-gray-500">Score: {completion.score}/100</span>
                </div>
                <pre className="bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
                  <code>{completion.text}</code>
                </pre>
                <button
                  onClick={() => {
                    const newCode = code.slice(0, cursorPosition) + completion.text + code.slice(cursorPosition);
                    setCode(newCode);
                    setCursorPosition(cursorPosition + completion.text.length);
                  }}
                  className="mt-2 px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'explain' && explanation && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Code Explanation</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Summary</h4>
              <p className="text-gray-600">{explanation.summary}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Purpose</h4>
              <p className="text-gray-600">{explanation.purpose}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Components ({explanation.components.length})</h4>
              <div className="space-y-2">
                {explanation.components.map((comp: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-3 rounded">
                    <div className="font-medium text-gray-900">{comp.name}</div>
                    <div className="text-sm text-gray-600">{comp.explanation}</div>
                  </div>
                ))}
              </div>
            </div>
            {explanation.complexity && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Complexity</h4>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded ${
                    explanation.complexity.level === 'low' ? 'bg-green-100 text-green-800' :
                    explanation.complexity.level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {explanation.complexity.level.toUpperCase()}
                  </span>
                  <span className="text-gray-600">{explanation.complexity.explanation}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'bugs' && bugs.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">
            Bugs Found ({bugs.length})
          </h3>
          <div className="space-y-4">
            {bugs.map((bug) => (
              <div key={bug.id} className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{bug.title}</h4>
                  <span className={`px-2 py-1 text-xs rounded ${getSeverityColor(bug.severity)}`}>
                    {bug.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-700 mb-2">{bug.description}</p>
                <div className="text-sm text-gray-600 mb-2">
                  Line {bug.line}: <code className="bg-gray-900 text-red-400 px-2 py-1 rounded">{bug.code}</code>
                </div>
                {bug.suggestion && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                    <div className="text-sm font-medium text-green-900 mb-1">Suggested Fix:</div>
                    <pre className="text-sm text-green-700">{bug.suggestion}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'refactor' && refactorings.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">
            Refactoring Suggestions ({refactorings.length})
          </h3>
          <div className="space-y-4">
            {refactorings.map((refactor) => (
              <div key={refactor.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{refactor.title}</h4>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded">
                    {refactor.type}
                  </span>
                </div>
                <p className="text-gray-700 mb-3">{refactor.description}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Before:</div>
                    <pre className="bg-gray-900 text-red-400 p-3 rounded text-sm overflow-x-auto">
                      <code>{refactor.before}</code>
                    </pre>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">After:</div>
                    <pre className="bg-gray-900 text-green-400 p-3 rounded text-sm overflow-x-auto">
                      <code>{refactor.after}</code>
                    </pre>
                  </div>
                </div>
                <button
                  onClick={() => setCode(refactor.after)}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Apply Refactoring
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'tests' && tests.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">
            Generated Tests ({tests.length})
          </h3>
          <div className="space-y-4">
            {tests.map((test, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">{test.description}</h4>
                <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto">
                  <code>{test.code}</code>
                </pre>
                <div className="mt-2 flex gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    test.type === 'unit' ? 'bg-blue-100 text-blue-800' :
                    test.type === 'integration' ? 'bg-purple-100 text-purple-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {test.type}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800">
                    Coverage: {test.coverage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'optimize' && optimizations.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">
            Optimization Suggestions ({optimizations.length})
          </h3>
          <div className="space-y-4">
            {optimizations.map((opt, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{opt.title}</h4>
                  <span className="text-sm text-green-600 font-semibold">
                    {opt.improvement}
                  </span>
                </div>
                <p className="text-gray-700 mb-3">{opt.description}</p>
                <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto">
                  <code>{opt.optimizedCode}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeAssistant;
