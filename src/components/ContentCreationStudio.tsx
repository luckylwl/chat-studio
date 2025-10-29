/**
 * AI Chat Studio v5.0 - Content Creation Studio
 *
 * Professional content creation and editing suite for:
 * - AI Video Generation & Editing
 * - AI Music Composition & Mixing
 * - Voice Synthesis & Cloning
 * - 3D Model Generation
 * - Batch processing and templates
 */

import React, { useState, useEffect, useRef } from 'react'
import { aiContentCreationService } from '../services/v5IntegrationServices'
import {
  VideoProject,
  VideoScene,
  MusicProject,
  VoiceProfile,
  VoiceoverProject,
  Model3DProject
} from '../types/v5-integration-types'

interface ContentCreationStudioProps {
  userId: string
}

type TabType = 'videos' | 'music' | 'voice' | '3d' | 'templates'
type VideoStyle = 'realistic' | 'animated' | 'cartoon' | 'documentary'
type Resolution = '720p' | '1080p' | '4k'

const ContentCreationStudio: React.FC<ContentCreationStudioProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState<TabType>('videos')

  // Video state
  const [videoProjects, setVideoProjects] = useState<VideoProject[]>([])
  const [selectedVideo, setSelectedVideo] = useState<VideoProject | null>(null)
  const [videoScript, setVideoScript] = useState('')
  const [videoStyle, setVideoStyle] = useState<VideoStyle>('realistic')
  const [videoResolution, setVideoResolution] = useState<Resolution>('1080p')

  // Music state
  const [musicProjects, setMusicProjects] = useState<MusicProject[]>([])
  const [selectedMusic, setSelectedMusic] = useState<MusicProject | null>(null)
  const [musicGenre, setMusicGenre] = useState('electronic')
  const [musicMood, setMusicMood] = useState('energetic')
  const [musicTempo, setMusicTempo] = useState(120)
  const [musicDuration, setMusicDuration] = useState(180)

  // Voice state
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([])
  const [voiceoverProjects, setVoiceoverProjects] = useState<VoiceoverProject[]>([])
  const [selectedVoiceProfile, setSelectedVoiceProfile] = useState<VoiceProfile | null>(null)
  const [voiceText, setVoiceText] = useState('')

  // 3D state
  const [model3DProjects, setModel3DProjects] = useState<Model3DProject[]>([])
  const [selected3DModel, setSelected3DModel] = useState<Model3DProject | null>(null)
  const [modelPrompt, setModelPrompt] = useState('')
  const [modelStyle, setModelStyle] = useState<'realistic' | 'lowpoly' | 'stylized' | 'photorealistic'>('realistic')

  useEffect(() => {
    loadAllProjects()
  }, [])

  const loadAllProjects = async () => {
    const videos = await aiContentCreationService.getAllVideoProjects()
    setVideoProjects(videos.filter(v => v.userId === userId))

    const music = await aiContentCreationService.getAllMusicProjects()
    setMusicProjects(music.filter(m => m.userId === userId))

    const voices = await aiContentCreationService.getAllVoiceProfiles()
    setVoiceProfiles(voices.filter(v => v.userId === userId))

    const voiceovers = await aiContentCreationService.getAllVoiceoverProjects()
    setVoiceoverProjects(voiceovers.filter(v => v.userId === userId))

    const models = await aiContentCreationService.getAll3DModels()
    setModel3DProjects(models.filter(m => m.userId === userId))
  }

  // Video functions
  const handleCreateVideo = async () => {
    if (!videoScript.trim()) {
      alert('Please enter a video script')
      return
    }

    const title = prompt('Enter video title:') || 'Untitled Video'
    const project = await aiContentCreationService.createVideoProject(
      userId,
      title,
      videoScript,
      videoStyle
    )

    // Start generation
    const generatedProject = await aiContentCreationService.generateVideo(project.id)
    setVideoProjects([...videoProjects, generatedProject])
    setSelectedVideo(generatedProject)
    setVideoScript('')

    alert('Video generated successfully!')
  }

  const handleAddScene = () => {
    if (!selectedVideo) return

    const visualPrompt = prompt('Enter scene visual description:')
    if (!visualPrompt) return

    const newScene: VideoScene = {
      id: `scene_${Date.now()}`,
      order: selectedVideo.scenes.length,
      duration: 5,
      visualPrompt,
      transition: 'fade'
    }

    selectedVideo.scenes.push(newScene)
    setSelectedVideo({ ...selectedVideo })
  }

  const handleDeleteScene = (sceneId: string) => {
    if (!selectedVideo) return

    selectedVideo.scenes = selectedVideo.scenes.filter(s => s.id !== sceneId)
    setSelectedVideo({ ...selectedVideo })
  }

  const handleExportVideo = (projectId: string) => {
    const project = videoProjects.find(v => v.id === projectId)
    if (!project?.videoUrl) {
      alert('Video not ready yet')
      return
    }

    alert(`Video exported!\nURL: ${project.videoUrl}\nResolution: ${project.resolution}\nDuration: ${project.duration}s`)
  }

  // Music functions
  const handleCreateMusic = async () => {
    const title = prompt('Enter music title:') || 'Untitled Track'
    const instruments = prompt('Enter instruments (comma-separated):')?.split(',').map(i => i.trim()) || ['piano', 'drums']

    const project = await aiContentCreationService.createMusicProject(
      userId,
      title,
      musicGenre,
      musicMood,
      musicTempo,
      musicDuration,
      instruments
    )

    // Start generation
    const generatedProject = await aiContentCreationService.generateMusic(project.id)
    setMusicProjects([...musicProjects, generatedProject])
    setSelectedMusic(generatedProject)

    alert('Music generated successfully!')
  }

  const handleExportMusic = (projectId: string) => {
    const project = musicProjects.find(m => m.id === projectId)
    if (!project?.audioUrl) {
      alert('Music not ready yet')
      return
    }

    alert(`Music exported!\nURL: ${project.audioUrl}\nGenre: ${project.genre}\nTempo: ${project.tempo} BPM\nDuration: ${project.duration}s`)
  }

  // Voice functions
  const handleCreateVoiceProfile = async () => {
    const name = prompt('Enter voice profile name:')
    if (!name) return

    const gender = prompt('Enter gender (male/female/neutral):') as 'male' | 'female' | 'neutral' || 'neutral'
    const age = prompt('Enter age group (child/young/adult/senior):') as 'child' | 'young' | 'adult' | 'senior' || 'adult'
    const accent = prompt('Enter accent:') || 'neutral'
    const language = prompt('Enter language:') || 'en-US'

    const profile = await aiContentCreationService.createVoiceProfile(
      userId,
      name,
      gender,
      age,
      accent,
      language
    )

    setVoiceProfiles([...voiceProfiles, profile])
    alert('Voice profile created!')
  }

  const handleGenerateVoiceover = async () => {
    if (!voiceText.trim() || !selectedVoiceProfile) {
      alert('Please enter text and select a voice profile')
      return
    }

    const title = prompt('Enter voiceover title:') || 'Untitled Voiceover'
    const project = await aiContentCreationService.generateVoiceover(
      userId,
      title,
      voiceText,
      selectedVoiceProfile.id
    )

    setVoiceoverProjects([...voiceoverProjects, project])
    setVoiceText('')
    alert('Voiceover generated successfully!')
  }

  const handleCloneVoice = async () => {
    const name = prompt('Enter name for cloned voice:')
    if (!name) return

    alert('Please upload audio samples (at least 30 seconds of clear speech)')

    const audioSamples = ['sample1.mp3', 'sample2.mp3'] // Mock data

    await aiContentCreationService.cloneVoice({
      name,
      audioSamples,
      language: 'en-US',
      minimumDuration: 30
    })

    await loadAllProjects()
    alert('Voice cloned successfully!')
  }

  // 3D Model functions
  const handleCreate3DModel = async () => {
    if (!modelPrompt.trim()) {
      alert('Please enter a model description')
      return
    }

    const title = prompt('Enter model title:') || 'Untitled Model'
    const project = await aiContentCreationService.create3DModel(
      userId,
      title,
      modelPrompt,
      modelStyle
    )

    // Start generation
    const generatedProject = await aiContentCreationService.generate3DModel(project.id)
    setModel3DProjects([...model3DProjects, generatedProject])
    setSelected3DModel(generatedProject)
    setModelPrompt('')

    alert('3D model generated successfully!')
  }

  const handleExport3DModel = (projectId: string, format: string) => {
    const project = model3DProjects.find(m => m.id === projectId)
    if (!project?.modelUrl) {
      alert('Model not ready yet')
      return
    }

    alert(`3D model exported!\nFormat: ${format}\nURL: ${project.modelUrl}\nVertices: ${project.vertexCount?.toLocaleString()}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981'
      case 'generating': return '#f59e0b'
      case 'failed': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const renderVideos = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>🎬 Video Projects</h2>

      {/* Video Creation Form */}
      <div style={{
        padding: '20px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>Create New Video</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              Video Style
            </label>
            <select
              value={videoStyle}
              onChange={(e) => setVideoStyle(e.target.value as VideoStyle)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}
            >
              <option value="realistic">Realistic</option>
              <option value="animated">Animated</option>
              <option value="cartoon">Cartoon</option>
              <option value="documentary">Documentary</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              Resolution
            </label>
            <select
              value={videoResolution}
              onChange={(e) => setVideoResolution(e.target.value as Resolution)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}
            >
              <option value="720p">720p (HD)</option>
              <option value="1080p">1080p (Full HD)</option>
              <option value="4k">4K (Ultra HD)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              Duration Estimate
            </label>
            <input
              type="text"
              value="Auto"
              disabled
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                backgroundColor: '#e5e7eb'
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            Video Script *
          </label>
          <textarea
            value={videoScript}
            onChange={(e) => setVideoScript(e.target.value)}
            placeholder="Describe your video in detail. The AI will generate scenes, visuals, and narration based on your script..."
            rows={6}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        <button
          onClick={handleCreateVideo}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          🎬 Generate Video
        </button>
      </div>

      {/* Video Projects List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {videoProjects.map(project => (
          <div
            key={project.id}
            style={{
              padding: '15px',
              backgroundColor: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onClick={() => setSelectedVideo(project)}
          >
            {/* Thumbnail */}
            <div style={{
              height: '200px',
              backgroundColor: '#f3f4f6',
              borderRadius: '6px',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px'
            }}>
              {project.status === 'completed' ? '🎬' : '⏳'}
            </div>

            <h3 style={{ margin: '0 0 10px 0' }}>{project.title}</h3>

            <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
              <div>
                <strong>Status:</strong>{' '}
                <span style={{ color: getStatusColor(project.status) }}>
                  {project.status}
                </span>
              </div>
              <div><strong>Style:</strong> {project.style}</div>
              <div><strong>Resolution:</strong> {project.resolution}</div>
              <div><strong>Scenes:</strong> {project.scenes.length}</div>
              <div><strong>Duration:</strong> {project.duration}s</div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {project.status === 'completed' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleExportVideo(project.id)
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
                  📥 Export
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedVideo(project)
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ✏️ Edit
              </button>
            </div>
          </div>
        ))}

        {videoProjects.length === 0 && (
          <div style={{
            gridColumn: '1 / -1',
            padding: '60px',
            textAlign: 'center',
            color: '#666',
            backgroundColor: '#f9fafb',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎬</div>
            <h3>No Video Projects Yet</h3>
            <p>Create your first AI-generated video using the form above</p>
          </div>
        )}
      </div>

      {/* Scene Editor (if video selected) */}
      {selectedVideo && (
        <div style={{
          marginTop: '20px',
          padding: '20px',
          backgroundColor: 'white',
          border: '2px solid #3b82f6',
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}>Editing: {selectedVideo.title}</h3>
            <button
              onClick={() => setSelectedVideo(null)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <button
              onClick={handleAddScene}
              style={{
                padding: '10px 20px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              + Add Scene
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {selectedVideo.scenes.map((scene, index) => (
              <div
                key={scene.id}
                style={{
                  padding: '15px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong>Scene {index + 1}</strong> - {scene.duration}s
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                    {scene.visualPrompt}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    Transition: {scene.transition}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteScene(scene.id)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderMusic = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>🎵 Music Projects</h2>

      {/* Music Creation Form */}
      <div style={{
        padding: '20px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>Create New Music</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              Genre
            </label>
            <select
              value={musicGenre}
              onChange={(e) => setMusicGenre(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}
            >
              <option value="electronic">Electronic</option>
              <option value="classical">Classical</option>
              <option value="rock">Rock</option>
              <option value="jazz">Jazz</option>
              <option value="ambient">Ambient</option>
              <option value="cinematic">Cinematic</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              Mood
            </label>
            <select
              value={musicMood}
              onChange={(e) => setMusicMood(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}
            >
              <option value="energetic">Energetic</option>
              <option value="calm">Calm</option>
              <option value="dark">Dark</option>
              <option value="uplifting">Uplifting</option>
              <option value="melancholic">Melancholic</option>
              <option value="epic">Epic</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              Tempo (BPM)
            </label>
            <input
              type="range"
              min="60"
              max="180"
              value={musicTempo}
              onChange={(e) => setMusicTempo(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ textAlign: 'center', marginTop: '5px' }}>{musicTempo} BPM</div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              Duration (seconds)
            </label>
            <input
              type="range"
              min="30"
              max="600"
              step="30"
              value={musicDuration}
              onChange={(e) => setMusicDuration(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ textAlign: 'center', marginTop: '5px' }}>
              {Math.floor(musicDuration / 60)}:{(musicDuration % 60).toString().padStart(2, '0')}
            </div>
          </div>
        </div>

        <button
          onClick={handleCreateMusic}
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
          🎵 Generate Music
        </button>
      </div>

      {/* Music Projects List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {musicProjects.map(project => (
          <div
            key={project.id}
            style={{
              padding: '20px',
              backgroundColor: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '8px'
            }}
          >
            {/* Waveform visualization */}
            <div style={{
              height: '100px',
              backgroundColor: '#f3f4f6',
              borderRadius: '6px',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', height: '80px', gap: '2px' }}>
                {Array.from({ length: 50 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: '3px',
                      height: `${Math.random() * 80 + 10}px`,
                      backgroundColor: '#3b82f6',
                      borderRadius: '1px'
                    }}
                  />
                ))}
              </div>
            </div>

            <h3 style={{ margin: '0 0 10px 0' }}>{project.title}</h3>

            <div style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              <div>
                <strong>Status:</strong>{' '}
                <span style={{ color: getStatusColor(project.status) }}>
                  {project.status}
                </span>
              </div>
              <div><strong>Genre:</strong> {project.genre}</div>
              <div><strong>Mood:</strong> {project.mood}</div>
              <div><strong>Tempo:</strong> {project.tempo} BPM</div>
              <div>
                <strong>Duration:</strong> {Math.floor(project.duration / 60)}:{(project.duration % 60).toString().padStart(2, '0')}
              </div>
            </div>

            {project.status === 'completed' && (
              <button
                onClick={() => handleExportMusic(project.id)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                📥 Export Audio
              </button>
            )}
          </div>
        ))}

        {musicProjects.length === 0 && (
          <div style={{
            gridColumn: '1 / -1',
            padding: '60px',
            textAlign: 'center',
            color: '#666',
            backgroundColor: '#f9fafb',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎵</div>
            <h3>No Music Projects Yet</h3>
            <p>Create your first AI-generated music track</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderVoice = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>🎤 Voice & Voiceovers</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        {/* Voice Profiles */}
        <div>
          <div style={{
            padding: '15px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            marginBottom: '15px'
          }}>
            <h3 style={{ marginTop: 0 }}>Voice Profiles</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <button
                onClick={handleCreateVoiceProfile}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                + New Profile
              </button>
              <button
                onClick={handleCloneVoice}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                🔬 Clone Voice
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {voiceProfiles.map(profile => (
                <div
                  key={profile.id}
                  onClick={() => setSelectedVoiceProfile(profile)}
                  style={{
                    padding: '10px',
                    backgroundColor: selectedVoiceProfile?.id === profile.id ? '#dbeafe' : 'white',
                    border: `2px solid ${selectedVoiceProfile?.id === profile.id ? '#3b82f6' : '#e5e7eb'}`,
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>{profile.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {profile.gender} • {profile.age} • {profile.accent}
                    {profile.isCloned && ' 🔬'}
                  </div>
                </div>
              ))}

              {voiceProfiles.length === 0 && (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: '#666',
                  fontSize: '12px'
                }}>
                  No voice profiles yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Voiceover Generation */}
        <div>
          <div style={{
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginTop: 0 }}>Generate Voiceover</h3>

            {selectedVoiceProfile ? (
              <>
                <div style={{
                  padding: '10px',
                  backgroundColor: '#dbeafe',
                  borderRadius: '6px',
                  marginBottom: '15px',
                  fontSize: '14px'
                }}>
                  <strong>Selected Voice:</strong> {selectedVoiceProfile.name} ({selectedVoiceProfile.gender}, {selectedVoiceProfile.accent})
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                    Text to Speak *
                  </label>
                  <textarea
                    value={voiceText}
                    onChange={(e) => setVoiceText(e.target.value)}
                    placeholder="Enter the text you want to convert to speech..."
                    rows={8}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    Characters: {voiceText.length} | Estimated duration: ~{Math.ceil(voiceText.length / 15)}s
                  </div>
                </div>

                <button
                  onClick={handleGenerateVoiceover}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  🎤 Generate Voiceover
                </button>
              </>
            ) : (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#666',
                backgroundColor: 'white',
                borderRadius: '6px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎤</div>
                <p>Select a voice profile to start generating voiceovers</p>
              </div>
            )}
          </div>

          {/* Recent Voiceovers */}
          <div>
            <h3>Recent Voiceovers</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {voiceoverProjects.slice(0, 5).map(project => (
                <div
                  key={project.id}
                  style={{
                    padding: '15px',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{project.title}</div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                        <span style={{ color: getStatusColor(project.status) }}>
                          {project.status}
                        </span>
                        {project.duration && ` • ${project.duration}s`}
                      </div>
                    </div>
                    {project.status === 'completed' && (
                      <button
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        📥 Download
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const render3D = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>🎨 3D Models</h2>

      {/* 3D Model Creation Form */}
      <div style={{
        padding: '20px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>Create 3D Model</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              Model Description *
            </label>
            <textarea
              value={modelPrompt}
              onChange={(e) => setModelPrompt(e.target.value)}
              placeholder="Describe the 3D model you want to create (e.g., 'A medieval sword with ornate engravings', 'A modern office chair')"
              rows={4}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              Style
            </label>
            <select
              value={modelStyle}
              onChange={(e) => setModelStyle(e.target.value as any)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}
            >
              <option value="realistic">Realistic</option>
              <option value="lowpoly">Low Poly</option>
              <option value="stylized">Stylized</option>
              <option value="photorealistic">Photorealistic</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleCreate3DModel}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          🎨 Generate 3D Model
        </button>
      </div>

      {/* 3D Models List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {model3DProjects.map(project => (
          <div
            key={project.id}
            style={{
              padding: '15px',
              backgroundColor: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '8px'
            }}
          >
            {/* 3D Preview */}
            <div style={{
              height: '200px',
              backgroundColor: '#f3f4f6',
              borderRadius: '6px',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '64px'
            }}>
              {project.status === 'completed' ? '🎨' : '⏳'}
            </div>

            <h3 style={{ margin: '0 0 10px 0' }}>{project.title}</h3>

            <div style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              <div>
                <strong>Status:</strong>{' '}
                <span style={{ color: getStatusColor(project.status) }}>
                  {project.status}
                </span>
              </div>
              <div><strong>Style:</strong> {project.style}</div>
              {project.vertexCount && (
                <div><strong>Vertices:</strong> {project.vertexCount.toLocaleString()}</div>
              )}
            </div>

            {project.status === 'completed' && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleExport3DModel(project.id, 'OBJ')}
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
                  📥 OBJ
                </button>
                <button
                  onClick={() => handleExport3DModel(project.id, 'FBX')}
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
                  📥 FBX
                </button>
                <button
                  onClick={() => handleExport3DModel(project.id, 'GLTF')}
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
                  📥 GLTF
                </button>
              </div>
            )}
          </div>
        ))}

        {model3DProjects.length === 0 && (
          <div style={{
            gridColumn: '1 / -1',
            padding: '60px',
            textAlign: 'center',
            color: '#666',
            backgroundColor: '#f9fafb',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎨</div>
            <h3>No 3D Models Yet</h3>
            <p>Create your first AI-generated 3D model</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderTemplates = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>📋 Content Templates</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Video Templates */}
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: '8px'
        }}>
          <h3 style={{ marginTop: 0 }}>🎬 Video Templates</h3>
          <ul style={{ paddingLeft: '20px', color: '#666' }}>
            <li>Product Demo</li>
            <li>Tutorial Video</li>
            <li>Social Media Ad</li>
            <li>Explainer Video</li>
            <li>Testimonial</li>
          </ul>
          <button style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}>
            Browse Templates
          </button>
        </div>

        {/* Music Templates */}
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: '8px'
        }}>
          <h3 style={{ marginTop: 0 }}>🎵 Music Templates</h3>
          <ul style={{ paddingLeft: '20px', color: '#666' }}>
            <li>Background Music</li>
            <li>Intro/Outro</li>
            <li>Lo-fi Study</li>
            <li>Cinematic Score</li>
            <li>Podcast Theme</li>
          </ul>
          <button style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}>
            Browse Templates
          </button>
        </div>

        {/* Voice Templates */}
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: '8px'
        }}>
          <h3 style={{ marginTop: 0 }}>🎤 Voice Templates</h3>
          <ul style={{ paddingLeft: '20px', color: '#666' }}>
            <li>Podcast Host</li>
            <li>Audiobook Narrator</li>
            <li>Commercial Announcer</li>
            <li>Character Voice</li>
            <li>IVR/Phone System</li>
          </ul>
          <button style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}>
            Browse Templates
          </button>
        </div>
      </div>
    </div>
  )

  const tabs = [
    { id: 'videos', label: 'Videos' },
    { id: 'music', label: 'Music' },
    { id: 'voice', label: 'Voice' },
    { id: '3d', label: '3D Models' },
    { id: 'templates', label: 'Templates' }
  ]

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        backgroundColor: '#1e293b',
        color: 'white',
        borderBottom: '3px solid #8b5cf6'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>🎨 Content Creation Studio</h1>
        <p style={{ margin: '5px 0 0 0', opacity: 0.8 }}>
          AI-powered video, music, voice, and 3D content generation
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
              color: activeTab === tab.id ? '#8b5cf6' : '#666',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #8b5cf6' : 'none',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'videos' && renderVideos()}
      {activeTab === 'music' && renderMusic()}
      {activeTab === 'voice' && renderVoice()}
      {activeTab === '3d' && render3D()}
      {activeTab === 'templates' && renderTemplates()}
    </div>
  )
}

export default ContentCreationStudio
