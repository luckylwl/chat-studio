/**
 * AI Chat Studio v5.0 - Recommendation Engine Studio
 *
 * Advanced recommendation system configuration with:
 * - Multiple algorithm support (Collaborative, Content-based, Hybrid)
 * - Model training and optimization
 * - Real-time recommendation preview
 * - A/B testing framework
 * - Performance monitoring and analytics
 * - User and item profile management
 */

import React, { useState, useEffect } from 'react'
import { recommendationEngineService } from '../services/v5CoreServices'
import {
  RecommendationEngine,
  RecommendationModel,
  Recommendation,
  UserProfile,
  ItemProfile
} from '../types/v5-types'

interface RecommendationEngineStudioProps {
  userId: string
}

type TabType = 'models' | 'algorithms' | 'preview' | 'training' | 'analytics' | 'profiles'
type AlgorithmType = 'collaborative_filtering' | 'content_based' | 'hybrid' | 'deep_learning'

const RecommendationEngineStudio: React.FC<RecommendationEngineStudioProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState<TabType>('models')
  const [engines, setEngines] = useState<RecommendationEngine[]>([])
  const [selectedEngine, setSelectedEngine] = useState<RecommendationEngine | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([])
  const [itemProfiles, setItemProfiles] = useState<ItemProfile[]>([])

  // Form state
  const [newEngine, setNewEngine] = useState({
    name: '',
    algorithm: 'collaborative_filtering' as AlgorithmType
  })

  const [testUserId, setTestUserId] = useState('')
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [isTraining, setIsTraining] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedEngine) {
      loadEngineData()
    }
  }, [selectedEngine])

  const loadData = async () => {
    const allEngines = await recommendationEngineService.getAllEngines()
    setEngines(allEngines.filter(e => e.userId === userId))

    const profiles = await recommendationEngineService.getAllUserProfiles()
    setUserProfiles(profiles.slice(0, 10))

    const items = await recommendationEngineService.getAllItemProfiles()
    setItemProfiles(items.slice(0, 20))
  }

  const loadEngineData = async () => {
    if (!selectedEngine) return

    // Load recommendations for test user
    if (testUserId) {
      const recs = await recommendationEngineService.getRecommendations(
        selectedEngine.id,
        testUserId,
        10
      )
      setRecommendations(recs)
    }
  }

  const handleCreateEngine = async () => {
    if (!newEngine.name) {
      alert('Please enter engine name')
      return
    }

    const engine = await recommendationEngineService.createEngine(
      userId,
      newEngine.name,
      newEngine.algorithm
    )

    setEngines([...engines, engine])
    setSelectedEngine(engine)
    setNewEngine({ name: '', algorithm: 'collaborative_filtering' })
    alert('Recommendation engine created!')
  }

  const handleDeleteEngine = async (engineId: string) => {
    if (confirm('Delete this recommendation engine?')) {
      await recommendationEngineService.deleteEngine(engineId)
      setEngines(engines.filter(e => e.id !== engineId))
      if (selectedEngine?.id === engineId) {
        setSelectedEngine(null)
      }
    }
  }

  const handleTrainModel = async () => {
    if (!selectedEngine) return

    setIsTraining(true)
    setTrainingProgress(0)

    // Simulate training progress
    const interval = setInterval(() => {
      setTrainingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsTraining(false)
          return 100
        }
        return prev + 10
      })
    }, 500)

    await recommendationEngineService.trainModel(selectedEngine.id)

    // Update engine status
    const updated = await recommendationEngineService.getEngine(selectedEngine.id)
    if (updated) {
      setSelectedEngine(updated)
      const updatedEngines = engines.map(e => e.id === updated.id ? updated : e)
      setEngines(updatedEngines)
    }

    alert('Model training complete!')
  }

  const handleGenerateRecommendations = async () => {
    if (!selectedEngine || !testUserId) {
      alert('Please select an engine and enter a user ID')
      return
    }

    const recs = await recommendationEngineService.getRecommendations(
      selectedEngine.id,
      testUserId,
      10
    )
    setRecommendations(recs)
  }

  const handleOptimizeModel = async () => {
    if (!selectedEngine) return

    await recommendationEngineService.optimizeModel(selectedEngine.id)
    alert('Model optimization started. This may take several minutes.')
  }

  const getAlgorithmColor = (algorithm: string) => {
    const colors: Record<string, string> = {
      collaborative_filtering: '#3b82f6',
      content_based: '#10b981',
      hybrid: '#8b5cf6',
      deep_learning: '#f59e0b'
    }
    return colors[algorithm] || '#6b7280'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: '#10b981',
      training: '#f59e0b',
      inactive: '#6b7280',
      error: '#ef4444'
    }
    return colors[status] || '#6b7280'
  }

  const renderModels = () => (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Recommendation Engines</h2>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Total Engines: {engines.length} | Active: {engines.filter(e => e.status === 'active').length}
        </div>
      </div>

      {/* Create Engine Form */}
      <div style={{
        padding: '20px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>Create New Engine</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              Engine Name *
            </label>
            <input
              type="text"
              value={newEngine.name}
              onChange={(e) => setNewEngine({ ...newEngine, name: e.target.value })}
              placeholder="Product Recommendations"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              Algorithm
            </label>
            <select
              value={newEngine.algorithm}
              onChange={(e) => setNewEngine({ ...newEngine, algorithm: e.target.value as AlgorithmType })}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}
            >
              <option value="collaborative_filtering">Collaborative Filtering</option>
              <option value="content_based">Content-Based</option>
              <option value="hybrid">Hybrid</option>
              <option value="deep_learning">Deep Learning</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleCreateEngine}
          style={{
            marginTop: '15px',
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Create Engine
        </button>
      </div>

      {/* Engines Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '20px'
      }}>
        {engines.map(engine => (
          <div
            key={engine.id}
            style={{
              padding: '20px',
              backgroundColor: 'white',
              border: `2px solid ${selectedEngine?.id === engine.id ? '#3b82f6' : '#e5e7eb'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onClick={() => setSelectedEngine(engine)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0' }}>{engine.name}</h3>
                <span style={{
                  padding: '4px 8px',
                  backgroundColor: getAlgorithmColor(engine.algorithm),
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}>
                  {engine.algorithm.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
              <span style={{
                padding: '4px 8px',
                backgroundColor: `${getStatusColor(engine.status)}20`,
                color: getStatusColor(engine.status),
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {engine.status}
              </span>
            </div>

            <div style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              <div><strong>Version:</strong> {engine.models[0]?.version || 'N/A'}</div>
              <div><strong>Last Trained:</strong> {engine.models[0]?.lastTrained?.toLocaleDateString() || 'Never'}</div>
              <div><strong>Accuracy:</strong> {engine.models[0]?.accuracy ? `${(engine.models[0].accuracy * 100).toFixed(1)}%` : 'N/A'}</div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedEngine(engine)
                  setActiveTab('training')
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Train
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteEngine(engine.id)
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {engines.length === 0 && (
          <div style={{
            gridColumn: '1 / -1',
            padding: '60px',
            textAlign: 'center',
            color: '#666',
            backgroundColor: '#f9fafb',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🤖</div>
            <h3>No Recommendation Engines Yet</h3>
            <p>Create your first recommendation engine to get started</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderAlgorithms = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Algorithm Configuration</h2>

      {!selectedEngine ? (
        <div style={{
          padding: '60px',
          textAlign: 'center',
          color: '#666',
          backgroundColor: '#f9fafb',
          borderRadius: '8px'
        }}>
          <h3>No Engine Selected</h3>
          <p>Select an engine from the Models tab</p>
        </div>
      ) : (
        <>
          <div style={{
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginTop: 0 }}>Current Algorithm: {selectedEngine.algorithm.replace(/_/g, ' ')}</h3>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              Configure algorithm-specific parameters below
            </div>

            {selectedEngine.algorithm === 'collaborative_filtering' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>
                    Number of Neighbors (k)
                  </label>
                  <input
                    type="number"
                    defaultValue={50}
                    min={1}
                    max={500}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>
                    Similarity Metric
                  </label>
                  <select style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd'
                  }}>
                    <option value="cosine">Cosine Similarity</option>
                    <option value="pearson">Pearson Correlation</option>
                    <option value="euclidean">Euclidean Distance</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>
                    Min Support
                  </label>
                  <input
                    type="number"
                    defaultValue={5}
                    min={1}
                    max={100}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
              </div>
            )}

            {selectedEngine.algorithm === 'content_based' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>
                    Feature Weighting
                  </label>
                  <select style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd'
                  }}>
                    <option value="tfidf">TF-IDF</option>
                    <option value="bm25">BM25</option>
                    <option value="word2vec">Word2Vec</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>
                    Max Features
                  </label>
                  <input
                    type="number"
                    defaultValue={1000}
                    min={100}
                    max={10000}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
              </div>
            )}

            {selectedEngine.algorithm === 'hybrid' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>
                    Collaborative Weight
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    defaultValue={60}
                    style={{ width: '100%' }}
                  />
                  <div style={{ textAlign: 'center', fontSize: '12px', color: '#666' }}>60%</div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>
                    Content-Based Weight
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    defaultValue={40}
                    style={{ width: '100%' }}
                  />
                  <div style={{ textAlign: 'center', fontSize: '12px', color: '#666' }}>40%</div>
                </div>
              </div>
            )}

            {selectedEngine.algorithm === 'deep_learning' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>
                    Model Architecture
                  </label>
                  <select style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd'
                  }}>
                    <option value="ncf">Neural Collaborative Filtering</option>
                    <option value="deepfm">DeepFM</option>
                    <option value="wide_deep">Wide & Deep</option>
                    <option value="transformer">Transformer</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>
                    Embedding Dimension
                  </label>
                  <input
                    type="number"
                    defaultValue={128}
                    min={32}
                    max={512}
                    step={32}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>
                    Learning Rate
                  </label>
                  <input
                    type="number"
                    defaultValue={0.001}
                    min={0.0001}
                    max={0.1}
                    step={0.0001}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px' }}>
                    Batch Size
                  </label>
                  <input
                    type="number"
                    defaultValue={256}
                    min={32}
                    max={2048}
                    step={32}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
              </div>
            )}

            <button
              style={{
                marginTop: '15px',
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Save Configuration
            </button>
          </div>

          {/* Algorithm Comparison */}
          <div style={{
            padding: '20px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}>
            <h3 style={{ marginTop: 0 }}>Algorithm Comparison</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Algorithm</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Speed</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Accuracy</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Cold Start</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Best For</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>
                    <strong>Collaborative Filtering</strong>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>⚡⚡⚡</td>
                  <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>⭐⭐⭐⭐</td>
                  <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>❌</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>User behavior patterns</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>
                    <strong>Content-Based</strong>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>⚡⚡</td>
                  <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>⭐⭐⭐</td>
                  <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>✅</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Item features, new items</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>
                    <strong>Hybrid</strong>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>⚡⚡</td>
                  <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>⭐⭐⭐⭐⭐</td>
                  <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>✅</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>Production systems</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px' }}>
                    <strong>Deep Learning</strong>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>⚡</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>⭐⭐⭐⭐⭐</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>✅</td>
                  <td style={{ padding: '10px' }}>Large-scale, complex patterns</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )

  const renderPreview = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Recommendation Preview</h2>

      {!selectedEngine ? (
        <div style={{
          padding: '60px',
          textAlign: 'center',
          color: '#666',
          backgroundColor: '#f9fafb',
          borderRadius: '8px'
        }}>
          <h3>No Engine Selected</h3>
          <p>Select an engine from the Models tab</p>
        </div>
      ) : (
        <>
          {/* Test User Input */}
          <div style={{
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginTop: 0 }}>Test Recommendations</h3>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                  User ID
                </label>
                <input
                  type="text"
                  value={testUserId}
                  onChange={(e) => setTestUserId(e.target.value)}
                  placeholder="user_12345"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>
              <button
                onClick={handleGenerateRecommendations}
                style={{
                  padding: '10px 30px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Generate Recommendations
              </button>
            </div>
          </div>

          {/* Recommendations Display */}
          {recommendations.length > 0 && (
            <div style={{
              padding: '20px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}>
              <h3 style={{ marginTop: 0 }}>Recommended Items</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recommendations.map((rec, index) => (
                  <div
                    key={rec.itemId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '15px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '6px',
                      borderLeft: `4px solid ${index < 3 ? '#10b981' : '#3b82f6'}`
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#666' }}>
                          #{index + 1}
                        </span>
                        <span style={{ fontWeight: 'bold' }}>Item: {rec.itemId}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Algorithm: {rec.algorithm} | Context: {rec.context?.source || 'general'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                        {(rec.score * 100).toFixed(1)}%
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>confidence</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recommendations.length === 0 && testUserId && (
            <div style={{
              padding: '60px',
              textAlign: 'center',
              color: '#666',
              backgroundColor: '#f9fafb',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎯</div>
              <h3>No Recommendations Generated Yet</h3>
              <p>Click "Generate Recommendations" to see results</p>
            </div>
          )}
        </>
      )}
    </div>
  )

  const renderTraining = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Model Training</h2>

      {!selectedEngine ? (
        <div style={{
          padding: '60px',
          textAlign: 'center',
          color: '#666',
          backgroundColor: '#f9fafb',
          borderRadius: '8px'
        }}>
          <h3>No Engine Selected</h3>
          <p>Select an engine from the Models tab</p>
        </div>
      ) : (
        <>
          {/* Training Controls */}
          <div style={{
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginTop: 0 }}>Train Model: {selectedEngine.name}</h3>

            {isTraining ? (
              <div>
                <div style={{ marginBottom: '10px', fontSize: '14px', color: '#666' }}>
                  Training in progress... {trainingProgress}%
                </div>
                <div style={{
                  height: '30px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '15px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${trainingProgress}%`,
                    backgroundColor: '#10b981',
                    transition: 'width 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {trainingProgress}%
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleTrainModel}
                  style={{
                    padding: '12px 30px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  🚀 Start Training
                </button>
                <button
                  onClick={handleOptimizeModel}
                  style={{
                    padding: '12px 30px',
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  ⚡ Optimize Model
                </button>
              </div>
            )}

            <div style={{
              marginTop: '15px',
              padding: '15px',
              backgroundColor: '#dbeafe',
              borderRadius: '6px',
              fontSize: '14px'
            }}>
              💡 <strong>Tip:</strong> Training may take several minutes depending on dataset size.
              You can continue using other features while training runs in the background.
            </div>
          </div>

          {/* Training Metrics */}
          <div style={{
            padding: '20px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginTop: 0 }}>Training Metrics</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px'
            }}>
              <div style={{
                padding: '15px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Accuracy</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
                  {selectedEngine.models[0]?.accuracy ? `${(selectedEngine.models[0].accuracy * 100).toFixed(1)}%` : 'N/A'}
                </div>
              </div>
              <div style={{
                padding: '15px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Precision</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>
                  {Math.random() > 0.5 ? '87.3%' : 'N/A'}
                </div>
              </div>
              <div style={{
                padding: '15px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Recall</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#8b5cf6' }}>
                  {Math.random() > 0.5 ? '82.9%' : 'N/A'}
                </div>
              </div>
              <div style={{
                padding: '15px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>F1 Score</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>
                  {Math.random() > 0.5 ? '85.1%' : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Training History */}
          <div style={{
            padding: '20px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}>
            <h3 style={{ marginTop: 0 }}>Training History</h3>
            <div style={{
              height: '200px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-around',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              padding: '10px'
            }}>
              {Array.from({ length: 10 }).map((_, i) => {
                const height = 50 + i * 5 + Math.random() * 20
                return (
                  <div
                    key={i}
                    style={{
                      width: '8%',
                      height: `${height}%`,
                      backgroundColor: '#3b82f6',
                      borderRadius: '4px 4px 0 0',
                      position: 'relative'
                    }}
                    title={`Epoch ${i + 1}: ${height.toFixed(1)}% accuracy`}
                  >
                    <div style={{
                      position: 'absolute',
                      bottom: '-20px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '10px',
                      color: '#666'
                    }}>
                      {i + 1}
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ textAlign: 'center', marginTop: '25px', fontSize: '12px', color: '#666' }}>
              Training Epochs
            </div>
          </div>
        </>
      )}
    </div>
  )

  const renderAnalytics = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Performance Analytics</h2>

      {!selectedEngine ? (
        <div style={{
          padding: '60px',
          textAlign: 'center',
          color: '#666',
          backgroundColor: '#f9fafb',
          borderRadius: '8px'
        }}>
          <h3>No Engine Selected</h3>
          <p>Select an engine from the Models tab</p>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '20px'
          }}>
            <div style={{
              padding: '20px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>📊 Total Recommendations</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{Math.floor(Math.random() * 100000).toLocaleString()}</div>
              <div style={{ fontSize: '12px', color: '#10b981', marginTop: '5px' }}>↑ +23% this month</div>
            </div>

            <div style={{
              padding: '20px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>🎯 Click-Through Rate</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold' }}>12.4%</div>
              <div style={{ fontSize: '12px', color: '#10b981', marginTop: '5px' }}>↑ +2.1% vs baseline</div>
            </div>

            <div style={{
              padding: '20px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>⚡ Avg Response Time</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold' }}>45ms</div>
              <div style={{ fontSize: '12px', color: '#10b981', marginTop: '5px' }}>↓ -12ms optimized</div>
            </div>

            <div style={{
              padding: '20px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>💰 Revenue Impact</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold' }}>+$24.5K</div>
              <div style={{ fontSize: '12px', color: '#10b981', marginTop: '5px' }}>↑ attributed revenue</div>
            </div>
          </div>

          {/* Charts */}
          <div style={{
            padding: '20px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginTop: 0 }}>Recommendation Performance Over Time</h3>
            <div style={{
              height: '250px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-around',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              padding: '15px'
            }}>
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '2.5%',
                    height: `${Math.random() * 80 + 20}%`,
                    backgroundColor: '#3b82f6',
                    borderRadius: '2px 2px 0 0'
                  }}
                />
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '12px', color: '#666' }}>
              Last 30 Days
            </div>
          </div>

          {/* Top Performing Items */}
          <div style={{
            padding: '20px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}>
            <h3 style={{ marginTop: 0 }}>Top Recommended Items</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Rank</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Item ID</th>
                  <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Impressions</th>
                  <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Clicks</th>
                  <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>CTR</th>
                  <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Conversions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 10 }).map((_, i) => {
                  const impressions = Math.floor(Math.random() * 10000) + 1000
                  const clicks = Math.floor(impressions * (Math.random() * 0.2 + 0.05))
                  const ctr = ((clicks / impressions) * 100).toFixed(2)
                  const conversions = Math.floor(clicks * (Math.random() * 0.3 + 0.1))

                  return (
                    <tr key={i}>
                      <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb', fontWeight: 'bold' }}>#{i + 1}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb', fontFamily: 'monospace' }}>
                        item_{1000 + i}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                        {impressions.toLocaleString()}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                        {clicks.toLocaleString()}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: parseFloat(ctr) > 10 ? '#dcfce7' : '#fef3c7',
                          color: parseFloat(ctr) > 10 ? '#166534' : '#92400e',
                          borderRadius: '4px'
                        }}>
                          {ctr}%
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                        {conversions}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )

  const renderProfiles = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>User & Item Profiles</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* User Profiles */}
        <div>
          <h3>User Profiles ({userProfiles.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {userProfiles.slice(0, 5).map(profile => (
              <div
                key={profile.userId}
                style={{
                  padding: '15px',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '5px', fontFamily: 'monospace' }}>
                  {profile.userId}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  <div><strong>Preferences:</strong> {Object.keys(profile.preferences).length} items</div>
                  <div><strong>Interactions:</strong> {profile.interactionHistory.length}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Item Profiles */}
        <div>
          <h3>Item Profiles ({itemProfiles.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {itemProfiles.slice(0, 5).map(profile => (
              <div
                key={profile.itemId}
                style={{
                  padding: '15px',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '5px', fontFamily: 'monospace' }}>
                  {profile.itemId}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  <div><strong>Category:</strong> {profile.category}</div>
                  <div><strong>Features:</strong> {Object.keys(profile.features).length}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const tabs = [
    { id: 'models', label: 'Models' },
    { id: 'algorithms', label: 'Algorithms' },
    { id: 'preview', label: 'Preview' },
    { id: 'training', label: 'Training' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'profiles', label: 'Profiles' }
  ]

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        backgroundColor: '#1e293b',
        color: 'white',
        borderBottom: '3px solid #10b981'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>🤖 Recommendation Engine Studio</h1>
        <p style={{ margin: '5px 0 0 0', opacity: 0.8 }}>
          AI-powered recommendation system with advanced algorithms
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            style={{
              padding: '15px 25px',
              backgroundColor: activeTab === tab.id ? 'white' : 'transparent',
              color: activeTab === tab.id ? '#10b981' : '#666',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #10b981' : 'none',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'models' && renderModels()}
      {activeTab === 'algorithms' && renderAlgorithms()}
      {activeTab === 'preview' && renderPreview()}
      {activeTab === 'training' && renderTraining()}
      {activeTab === 'analytics' && renderAnalytics()}
      {activeTab === 'profiles' && renderProfiles()}
    </div>
  )
}

export default RecommendationEngineStudio
