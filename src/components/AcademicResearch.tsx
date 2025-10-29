/**
 * Academic Research Assistant Component
 *
 * Manage papers, generate citations, create literature reviews
 */

import React, { useState } from 'react';
import { academicResearchService, ResearchPaper, ResearchQuery, Citation } from '../services/academicResearchService';

const CITATION_FORMATS: Citation['format'][] = ['apa', 'mla', 'chicago', 'ieee', 'bibtex'];

export const AcademicResearch: React.FC = () => {
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());
  const [citationFormat, setCitationFormat] = useState<Citation['format']>('apa');
  const [literatureReview, setLiteratureReview] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Manual add paper
  const [newPaper, setNewPaper] = useState({
    title: '',
    authors: '',
    abstract: '',
    year: new Date().getFullYear(),
    journal: '',
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const query: ResearchQuery = {
        query: searchQuery.trim(),
        maxResults: 20,
      };

      const results = await academicResearchService.searchPapers(query);
      setPapers(results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleAddPaper = () => {
    if (!newPaper.title.trim() || !newPaper.authors.trim()) return;

    const paper = academicResearchService.addPaper({
      title: newPaper.title.trim(),
      authors: newPaper.authors.split(',').map(a => a.trim()),
      abstract: newPaper.abstract.trim(),
      year: newPaper.year,
      journal: newPaper.journal.trim() || undefined,
    });

    setPapers(prev => [paper, ...prev]);
    setNewPaper({
      title: '',
      authors: '',
      abstract: '',
      year: new Date().getFullYear(),
      journal: '',
    });
  };

  const handleGenerateLiteratureReview = async () => {
    if (selectedPapers.size === 0) return;

    setIsGenerating(true);
    try {
      const topic = searchQuery || 'Selected Research Papers';
      const review = await academicResearchService.createLiteratureReview(
        topic,
        Array.from(selectedPapers)
      );
      setLiteratureReview(review);
    } catch (error) {
      console.error('Literature review generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePaperSelection = (paperId: string) => {
    setSelectedPapers(prev => {
      const next = new Set(prev);
      if (next.has(paperId)) {
        next.delete(paperId);
      } else {
        next.add(paperId);
      }
      return next;
    });
  };

  const getCitation = (paperId: string) => {
    return academicResearchService.generateCitation(paperId, citationFormat);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">🎓 Academic Research Assistant</h2>
        <p className="opacity-90">
          Manage research papers, generate citations, and create literature reviews
        </p>
      </div>

      {/* Search Papers */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <h3 className="text-xl font-semibold">Search Papers</h3>

        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search research papers by keywords, authors, or topics..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Search
          </button>
        </div>
      </div>

      {/* Add Paper Manually */}
      <details className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <summary className="text-xl font-semibold cursor-pointer">
          Add Paper Manually
        </summary>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={newPaper.title}
              onChange={(e) => setNewPaper({ ...newPaper, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Authors (comma-separated) *
            </label>
            <input
              type="text"
              value={newPaper.authors}
              onChange={(e) => setNewPaper({ ...newPaper, authors: e.target.value })}
              placeholder="e.g., John Doe, Jane Smith"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <input
                type="number"
                value={newPaper.year}
                onChange={(e) => setNewPaper({ ...newPaper, year: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Journal (optional)
              </label>
              <input
                type="text"
                value={newPaper.journal}
                onChange={(e) => setNewPaper({ ...newPaper, journal: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Abstract
            </label>
            <textarea
              value={newPaper.abstract}
              onChange={(e) => setNewPaper({ ...newPaper, abstract: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none"
              rows={4}
            />
          </div>

          <button
            onClick={handleAddPaper}
            disabled={!newPaper.title.trim() || !newPaper.authors.trim()}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            Add Paper
          </button>
        </div>
      </details>

      {/* Papers List */}
      {papers.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Papers ({papers.length})</h3>
            <div className="flex items-center gap-4">
              <select
                value={citationFormat}
                onChange={(e) => setCitationFormat(e.target.value as Citation['format'])}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {CITATION_FORMATS.map((fmt) => (
                  <option key={fmt} value={fmt}>
                    {fmt.toUpperCase()}
                  </option>
                ))}
              </select>
              {selectedPapers.size > 0 && (
                <button
                  onClick={handleGenerateLiteratureReview}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm disabled:bg-gray-400"
                >
                  {isGenerating ? 'Generating...' : `Generate Review (${selectedPapers.size})`}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {papers.map((paper) => {
              const citation = getCitation(paper.id);
              const isSelected = selectedPapers.has(paper.id);

              return (
                <div
                  key={paper.id}
                  className={`border rounded-lg p-4 transition-all ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => togglePaperSelection(paper.id)}
                      className="mt-1 rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">{paper.title}</h4>
                      <div className="text-sm text-gray-600 mb-2">
                        {paper.authors.join(', ')} ({paper.year})
                        {paper.journal && <span className="ml-2 italic">{paper.journal}</span>}
                      </div>
                      {paper.abstract && (
                        <p className="text-sm text-gray-700 mb-3">{paper.abstract}</p>
                      )}
                      <details className="text-sm">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                          View Citation ({citationFormat.toUpperCase()})
                        </summary>
                        <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                          <code className="text-xs">{citation.text}</code>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(citation.text);
                            }}
                            className="ml-3 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                          >
                            Copy
                          </button>
                        </div>
                      </details>
                    </div>
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Literature Review */}
      {literatureReview && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b">
            <h3 className="text-xl font-semibold">Literature Review</h3>
            <button
              onClick={() => navigator.clipboard.writeText(literatureReview.content)}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
            >
              Copy Review
            </button>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Topic</h4>
            <p className="text-gray-700">{literatureReview.topic}</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Summary</h4>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{literatureReview.summary}</p>
            </div>
          </div>

          {literatureReview.themes && literatureReview.themes.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Key Themes</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {literatureReview.themes.map((theme: string, index: number) => (
                  <li key={index}>{theme}</li>
                ))}
              </ul>
            </div>
          )}

          {literatureReview.gaps && literatureReview.gaps.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Research Gaps</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {literatureReview.gaps.map((gap: string, index: number) => (
                  <li key={index}>{gap}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Full Review</h4>
            <div className="prose max-w-none bg-gray-50 p-4 rounded-lg">
              <div className="whitespace-pre-wrap text-gray-700">{literatureReview.content}</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">References</h4>
            <div className="space-y-2">
              {literatureReview.paperIds.map((paperId: string, index: number) => {
                const paper = papers.find(p => p.id === paperId);
                const citation = getCitation(paperId);
                return (
                  <div key={paperId} className="text-sm">
                    <span className="font-medium">[{index + 1}]</span> {citation.text}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Getting Started */}
      {papers.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">Academic Research Features</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>✓ Search and manage research papers</li>
            <li>✓ Generate citations in 5 formats (APA, MLA, Chicago, IEEE, BibTeX)</li>
            <li>✓ Create automated literature reviews</li>
            <li>✓ Identify research gaps and themes</li>
            <li>✓ Export citations and reviews</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default AcademicResearch;
