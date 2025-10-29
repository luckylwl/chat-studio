/**
 * Vector Memory Explorer Component
 *
 * Visual interface for exploring and searching vector memories
 */

import React, { useState, useEffect } from 'react'
import { vectorMemoryService } from '../services/vectorMemoryService'
import type { Memory, MemorySearchResult } from '../types/v4-types'

interface VectorMemoryExplorerProps {
  userId: string
}

export const VectorMemoryExplorer: React.FC<VectorMemoryExplorerProps> = ({ userId }) => {
  const [memories, setMemories] = useState<Memory[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<MemorySearchResult[]>([])
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<'list' | 'search' | 'add'>('list')

  // Add memory form
  const [newMemoryContent, setNewMemoryContent] = useState('')
  const [newMemoryType, setNewMemoryType] = useState<Memory['type']>('personal')

  useEffect(() => {
    loadMemories()
  }, [userId])

  const loadMemories = async () => {
    try {
      const userMemory = await vectorMemoryService.getUserMemory(userId)
      setMemories(userMemory.memories)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load memories:', error)
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    try {
      const results = await vectorMemoryService.searchMemories(userId, {
        queryText: searchQuery,
        limit: 10,
        minRelevance: 0.5
      })

      setSearchResults(results)
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  const handleAddMemory = async () => {
    if (!newMemoryContent.trim()) return

    try {
      const memory = await vectorMemoryService.addMemory(
        userId,
        newMemoryContent,
        newMemoryType
      )

      setMemories([memory, ...memories])
      setNewMemoryContent('')
      setActiveView('list')
    } catch (error) {
      console.error('Failed to add memory:', error)
    }
  }

  const handleConsolidate = async () => {
    try {
      const count = await vectorMemoryService.consolidateMemories(userId)
      alert(`Consolidated ${count} similar memories`)
      await loadMemories()
    } catch (error) {
      console.error('Consolidation failed:', error)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTypeColor = (type: Memory['type']) => {
    const colors = {
      personal: '#8B5CF6',
      factual: '#3B82F6',
      procedural: '#10B981',
      episodic: '#F59E0B',
      semantic: '#EF4444'
    }
    return colors[type] || '#6B7280'
  }

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading memories...</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Vector Memory Explorer</h2>
        <p style={styles.subtitle}>
          Explore your AI's long-term semantic memory • {memories.length} memories stored
        </p>
      </div>

      {/* Action Bar */}
      <div style={styles.actionBar}>
        <div style={styles.viewToggle}>
          <button
            style={{
              ...styles.viewButton,
              ...(activeView === 'list' ? styles.viewButtonActive : {})
            }}
            onClick={() => setActiveView('list')}
          >
            📋 All Memories
          </button>
          <button
            style={{
              ...styles.viewButton,
              ...(activeView === 'search' ? styles.viewButtonActive : {})
            }}
            onClick={() => setActiveView('search')}
          >
            🔍 Search
          </button>
          <button
            style={{
              ...styles.viewButton,
              ...(activeView === 'add' ? styles.viewButtonActive : {})
            }}
            onClick={() => setActiveView('add')}
          >
            ➕ Add Memory
          </button>
        </div>
        <button style={styles.consolidateButton} onClick={handleConsolidate}>
          🔗 Consolidate Similar
        </button>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* List View */}
        {activeView === 'list' && (
          <div style={styles.memoryList}>
            {memories.length === 0 ? (
              <div style={styles.emptyState}>
                <p>No memories yet. Add your first memory to get started!</p>
                <button
                  style={styles.primaryButton}
                  onClick={() => setActiveView('add')}
                >
                  Add First Memory
                </button>
              </div>
            ) : (
              <div style={styles.memoriesGrid}>
                {memories
                  .sort((a, b) => b.lastAccessed - a.lastAccessed)
                  .map(memory => (
                    <div
                      key={memory.id}
                      style={styles.memoryCard}
                      onClick={() => setSelectedMemory(memory)}
                    >
                      <div style={styles.memoryHeader}>
                        <span
                          style={{
                            ...styles.typeBadge,
                            backgroundColor: getTypeColor(memory.type)
                          }}
                        >
                          {memory.type}
                        </span>
                        <div style={styles.memoryMeta}>
                          <span style={styles.metaText}>
                            Importance: {(memory.importance * 100).toFixed(0)}%
                          </span>
                          <span style={styles.metaText}>
                            Accessed: {memory.accessCount}x
                          </span>
                        </div>
                      </div>
                      <p style={styles.memoryContent}>{memory.content}</p>
                      <div style={styles.memoryFooter}>
                        <span style={styles.timestamp}>
                          {formatDate(memory.lastAccessed)}
                        </span>
                        {memory.tags.length > 0 && (
                          <div style={styles.tags}>
                            {memory.tags.slice(0, 3).map((tag, idx) => (
                              <span key={idx} style={styles.tag}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Search View */}
        {activeView === 'search' && (
          <div style={styles.searchView}>
            <div style={styles.searchBox}>
              <input
                type="text"
                style={styles.searchInput}
                placeholder="Search memories semantically..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button style={styles.searchButton} onClick={handleSearch}>
                Search
              </button>
            </div>

            {searchResults.length > 0 && (
              <div style={styles.searchResults}>
                <h3 style={styles.resultsTitle}>
                  Found {searchResults.length} relevant memories
                </h3>
                {searchResults.map(result => (
                  <div key={result.memory.id} style={styles.searchResultCard}>
                    <div style={styles.resultHeader}>
                      <span style={styles.relevanceScore}>
                        {(result.relevance * 100).toFixed(0)}% match
                      </span>
                      <span
                        style={{
                          ...styles.typeBadge,
                          backgroundColor: getTypeColor(result.memory.type)
                        }}
                      >
                        {result.memory.type}
                      </span>
                    </div>
                    <p style={styles.resultContent}>{result.memory.content}</p>
                    <div style={styles.resultFooter}>
                      <span style={styles.resultMeta}>
                        Importance: {(result.memory.importance * 100).toFixed(0)}%
                      </span>
                      <span style={styles.resultMeta}>
                        {formatDate(result.memory.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Memory View */}
        {activeView === 'add' && (
          <div style={styles.addMemory}>
            <h3 style={styles.sectionTitle}>Add New Memory</h3>
            <div style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Memory Type</label>
                <select
                  style={styles.select}
                  value={newMemoryType}
                  onChange={(e) => setNewMemoryType(e.target.value as Memory['type'])}
                >
                  <option value="personal">Personal - About user preferences</option>
                  <option value="factual">Factual - Facts and data</option>
                  <option value="procedural">Procedural - How to do things</option>
                  <option value="episodic">Episodic - Past events</option>
                  <option value="semantic">Semantic - General knowledge</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Content</label>
                <textarea
                  style={styles.textarea}
                  placeholder="What should be remembered?"
                  value={newMemoryContent}
                  onChange={(e) => setNewMemoryContent(e.target.value)}
                  rows={6}
                />
              </div>
              <button
                style={styles.primaryButton}
                onClick={handleAddMemory}
                disabled={!newMemoryContent.trim()}
              >
                Add Memory
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Memory Detail Modal */}
      {selectedMemory && (
        <div style={styles.modal} onClick={() => setSelectedMemory(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Memory Details</h3>
              <button
                style={styles.closeButton}
                onClick={() => setSelectedMemory(null)}
              >
                ✕
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Type:</span>
                <span
                  style={{
                    ...styles.typeBadge,
                    backgroundColor: getTypeColor(selectedMemory.type)
                  }}
                >
                  {selectedMemory.type}
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Content:</span>
                <p style={styles.detailContent}>{selectedMemory.content}</p>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Importance:</span>
                <div style={styles.importanceBar}>
                  <div
                    style={{
                      ...styles.importanceFill,
                      width: `${selectedMemory.importance * 100}%`
                    }}
                  />
                </div>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Statistics:</span>
                <div style={styles.stats}>
                  <div style={styles.statItem}>
                    <span style={styles.statValue}>{selectedMemory.accessCount}</span>
                    <span style={styles.statLabel}>Accesses</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statValue}>
                      {formatDate(selectedMemory.createdAt).split(',')[0]}
                    </span>
                    <span style={styles.statLabel}>Created</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statValue}>
                      {formatDate(selectedMemory.lastAccessed).split(',')[0]}
                    </span>
                    <span style={styles.statLabel}>Last Accessed</span>
                  </div>
                </div>
              </div>
              {selectedMemory.tags.length > 0 && (
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Tags:</span>
                  <div style={styles.tags}>
                    {selectedMemory.tags.map((tag, idx) => (
                      <span key={idx} style={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    marginBottom: '30px'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
    color: '#1F2937'
  },
  subtitle: {
    fontSize: '16px',
    color: '#6B7280',
    margin: 0
  },
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    padding: '16px',
    background: '#F9FAFB',
    borderRadius: '12px'
  },
  viewToggle: {
    display: 'flex',
    gap: '8px'
  },
  viewButton: {
    padding: '8px 16px',
    background: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s'
  },
  viewButtonActive: {
    background: '#3B82F6',
    color: 'white',
    borderColor: '#3B82F6'
  },
  consolidateButton: {
    padding: '8px 16px',
    background: '#8B5CF6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  content: {
    minHeight: '400px'
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '16px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #E5E7EB',
    borderTop: '4px solid #8B5CF6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  memoryList: {
    width: '100%'
  },
  memoriesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '16px'
  },
  memoryCard: {
    background: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  memoryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  typeBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
    color: 'white',
    textTransform: 'uppercase'
  },
  memoryMeta: {
    display: 'flex',
    gap: '12px'
  },
  metaText: {
    fontSize: '11px',
    color: '#9CA3AF'
  },
  memoryContent: {
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#374151',
    marginBottom: '12px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical'
  },
  memoryFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '12px',
    borderTop: '1px solid #E5E7EB'
  },
  timestamp: {
    fontSize: '12px',
    color: '#9CA3AF'
  },
  tags: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap'
  },
  tag: {
    padding: '2px 8px',
    background: '#F3F4F6',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#6B7280'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6B7280'
  },
  primaryButton: {
    padding: '12px 24px',
    background: '#8B5CF6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer'
  },
  searchView: {
    width: '100%'
  },
  searchBox: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px'
  },
  searchInput: {
    flex: 1,
    padding: '12px 16px',
    border: '2px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none'
  },
  searchButton: {
    padding: '12px 32px',
    background: '#8B5CF6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer'
  },
  searchResults: {
    width: '100%'
  },
  resultsTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#1F2937'
  },
  searchResultCard: {
    background: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px'
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  relevanceScore: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#8B5CF6'
  },
  resultContent: {
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#374151',
    marginBottom: '12px'
  },
  resultFooter: {
    display: 'flex',
    gap: '16px',
    paddingTop: '12px',
    borderTop: '1px solid #E5E7EB'
  },
  resultMeta: {
    fontSize: '12px',
    color: '#9CA3AF'
  },
  addMemory: {
    maxWidth: '600px'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#1F2937'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151'
  },
  select: {
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    background: 'white'
  },
  textarea: {
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    background: 'white',
    borderRadius: '16px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #E5E7EB'
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    margin: 0,
    color: '#1F2937'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#9CA3AF'
  },
  modalBody: {
    padding: '20px'
  },
  detailRow: {
    marginBottom: '20px'
  },
  detailLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#6B7280',
    display: 'block',
    marginBottom: '8px'
  },
  detailContent: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#374151',
    margin: 0
  },
  importanceBar: {
    height: '8px',
    background: '#E5E7EB',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  importanceFill: {
    height: '100%',
    background: '#8B5CF6',
    transition: 'width 0.3s'
  },
  stats: {
    display: 'flex',
    gap: '24px'
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  statValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1F2937'
  },
  statLabel: {
    fontSize: '12px',
    color: '#9CA3AF'
  }
}

export default VectorMemoryExplorer
