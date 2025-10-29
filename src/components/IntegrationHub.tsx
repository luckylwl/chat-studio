/**
 * Integration Hub Component
 *
 * Unified interface for integrations, content creation, RPA, and webhooks
 */

import React, { useState, useEffect } from 'react'
import {
  slackIntegrationService,
  githubIntegrationService,
  googleWorkspaceIntegrationService,
  aiContentCreationService,
  rpaAutomationService,
  webhookService
} from '../services/v5IntegrationServices'
import type {
  SlackIntegration,
  GitHubIntegration,
  GoogleWorkspaceIntegration,
  VideoProject,
  MusicProject,
  VoiceProfile,
  RPARecording,
  Webhook
} from '../types/v5-integration-types'

interface IntegrationHubProps {
  userId: string
}

export const IntegrationHub: React.FC<IntegrationHubProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState<'integrations' | 'content' | 'rpa' | 'webhooks'>('integrations')

  // Integration state
  const [slackConnected, setSlackConnected] = useState(false)
  const [githubConnected, setGithubConnected] = useState(false)
  const [googleConnected, setGoogleConnected] = useState(false)

  // Content creation state
  const [videoProjects, setVideoProjects] = useState<VideoProject[]>([])
  const [musicProjects, setMusicProjects] = useState<MusicProject[]>([])
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([])

  // RPA state
  const [rpaRecordings, setRpaRecordings] = useState<RPARecording[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [currentRecording, setCurrentRecording] = useState<RPARecording | null>(null)

  // Webhook state
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [newWebhookName, setNewWebhookName] = useState('')
  const [newWebhookUrl, setNewWebhookUrl] = useState('')

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    try {
      setLoading(true)
      // Load data from services
      setLoading(false)
    } catch (error) {
      console.error('Failed to load data:', error)
      setLoading(false)
    }
  }

  // Integration functions
  const handleConnectSlack = async () => {
    try {
      await slackIntegrationService.connect(
        userId,
        'workspace-' + Date.now(),
        'My Workspace',
        'xoxb-fake-token'
      )
      setSlackConnected(true)
      alert('Slack connected successfully!')
    } catch (error) {
      alert('Failed to connect Slack')
    }
  }

  const handleConnectGitHub = async () => {
    try {
      await githubIntegrationService.connect(
        userId,
        'github-user',
        'ghp_fake_token'
      )
      setGithubConnected(true)
      alert('GitHub connected successfully!')
    } catch (error) {
      alert('Failed to connect GitHub')
    }
  }

  const handleConnectGoogle = async () => {
    try {
      await googleWorkspaceIntegrationService.connect(
        userId,
        'user@company.com',
        'fake-access-token',
        'fake-refresh-token'
      )
      setGoogleConnected(true)
      alert('Google Workspace connected successfully!')
    } catch (error) {
      alert('Failed to connect Google Workspace')
    }
  }

  // Content creation functions
  const handleCreateVideo = async () => {
    const script = prompt('Enter video script:')
    if (!script) return

    try {
      const project = await aiContentCreationService.createVideoProject(
        userId,
        'New Video Project',
        script,
        'realistic'
      )
      setVideoProjects([...videoProjects, project])
      alert('Video project created! Click "Generate" to create the video.')
    } catch (error) {
      alert('Failed to create video project')
    }
  }

  const handleGenerateVideo = async (projectId: string) => {
    try {
      const project = await aiContentCreationService.generateVideo(projectId)
      setVideoProjects(videoProjects.map(p => p.id === projectId ? project : p))
      alert('Video generated successfully!')
    } catch (error) {
      alert('Failed to generate video')
    }
  }

  const handleCreateMusic = async () => {
    try {
      const project = await aiContentCreationService.createMusicProject(
        userId,
        'New Music Track',
        {
          genre: 'electronic',
          mood: 'energetic',
          tempo: 120,
          duration: 180,
          instruments: ['synthesizer', 'drums', 'bass']
        }
      )
      setMusicProjects([...musicProjects, project])
      alert('Music project created! Click "Generate" to create the music.')
    } catch (error) {
      alert('Failed to create music project')
    }
  }

  const handleGenerateMusic = async (projectId: string) => {
    try {
      const project = await aiContentCreationService.generateMusic(projectId)
      setMusicProjects(musicProjects.map(p => p.id === projectId ? project : p))
      alert('Music generated successfully!')
    } catch (error) {
      alert('Failed to generate music')
    }
  }

  const handleCreateVoiceProfile = async () => {
    const name = prompt('Enter voice profile name:')
    if (!name) return

    try {
      const profile = await aiContentCreationService.createVoiceProfile(userId, name, {
        gender: 'neutral',
        age: 'adult',
        accent: 'american',
        language: 'en-US'
      })
      setVoiceProfiles([...voiceProfiles, profile])
      alert('Voice profile created!')
    } catch (error) {
      alert('Failed to create voice profile')
    }
  }

  // RPA functions
  const handleStartRecording = async () => {
    const name = prompt('Enter recording name:')
    if (!name) return

    try {
      const recording = await rpaAutomationService.startRecording(
        userId,
        name,
        'Automated task recording'
      )
      setCurrentRecording(recording)
      setIsRecording(true)
      alert('Recording started! Perform actions to record.')
    } catch (error) {
      alert('Failed to start recording')
    }
  }

  const handleStopRecording = async () => {
    if (!currentRecording) return

    try {
      const completed = await rpaAutomationService.stopRecording(currentRecording.id)
      setRpaRecordings([...rpaRecordings, completed])
      setCurrentRecording(null)
      setIsRecording(false)
      alert('Recording stopped and saved!')
    } catch (error) {
      alert('Failed to stop recording')
    }
  }

  const handlePlayRecording = async (recordingId: string) => {
    try {
      const playback = await rpaAutomationService.playRecording(recordingId)
      alert(`Playback started! ID: ${playback.id}`)
    } catch (error) {
      alert('Failed to play recording')
    }
  }

  // Webhook functions
  const handleCreateWebhook = async () => {
    if (!newWebhookName.trim() || !newWebhookUrl.trim()) {
      alert('Please enter webhook name and URL')
      return
    }

    try {
      const webhook = await webhookService.createWebhook(
        userId,
        newWebhookName,
        newWebhookUrl,
        ['user.created', 'user.updated', 'task.completed']
      )
      setWebhooks([...webhooks, webhook])
      setNewWebhookName('')
      setNewWebhookUrl('')
      alert('Webhook created successfully!')
    } catch (error) {
      alert('Failed to create webhook')
    }
  }

  const handleToggleWebhook = async (webhookId: string) => {
    const webhook = webhooks.find(w => w.id === webhookId)
    if (!webhook) return

    try {
      await webhookService.updateWebhook(webhookId, { active: !webhook.active })
      setWebhooks(webhooks.map(w =>
        w.id === webhookId ? { ...w, active: !w.active } : w
      ))
    } catch (error) {
      alert('Failed to toggle webhook')
    }
  }

  const renderIntegrationsTab = () => (
    <div style={styles.tabContent}>
      <h2>Third-Party Integrations</h2>
      <p style={styles.description}>Connect your favorite tools and services</p>

      <div style={styles.integrationsGrid}>
        {/* Slack */}
        <div style={styles.integrationCard}>
          <div style={styles.integrationHeader}>
            <span style={styles.integrationIcon}>💬</span>
            <h3>Slack</h3>
          </div>
          <p style={styles.integrationDesc}>
            Connect Slack to send notifications and interact with AI in your channels
          </p>
          <div style={styles.integrationFooter}>
            {slackConnected ? (
              <span style={styles.connectedBadge}>✓ Connected</span>
            ) : (
              <button style={styles.connectButton} onClick={handleConnectSlack}>
                Connect Slack
              </button>
            )}
          </div>
        </div>

        {/* GitHub */}
        <div style={styles.integrationCard}>
          <div style={styles.integrationHeader}>
            <span style={styles.integrationIcon}>🐙</span>
            <h3>GitHub</h3>
          </div>
          <p style={styles.integrationDesc}>
            AI-powered code reviews, PR analysis, and issue management
          </p>
          <div style={styles.integrationFooter}>
            {githubConnected ? (
              <span style={styles.connectedBadge}>✓ Connected</span>
            ) : (
              <button style={styles.connectButton} onClick={handleConnectGitHub}>
                Connect GitHub
              </button>
            )}
          </div>
        </div>

        {/* Google Workspace */}
        <div style={styles.integrationCard}>
          <div style={styles.integrationHeader}>
            <span style={styles.integrationIcon}>📧</span>
            <h3>Google Workspace</h3>
          </div>
          <p style={styles.integrationDesc}>
            Access Gmail, Drive, Calendar, and Docs with AI assistance
          </p>
          <div style={styles.integrationFooter}>
            {googleConnected ? (
              <span style={styles.connectedBadge}>✓ Connected</span>
            ) : (
              <button style={styles.connectButton} onClick={handleConnectGoogle}>
                Connect Google
              </button>
            )}
          </div>
        </div>

        {/* Coming Soon */}
        <div style={styles.integrationCard}>
          <div style={styles.integrationHeader}>
            <span style={styles.integrationIcon}>⚡</span>
            <h3>Zapier</h3>
          </div>
          <p style={styles.integrationDesc}>
            Connect 5000+ apps with automated workflows
          </p>
          <div style={styles.integrationFooter}>
            <span style={styles.comingSoonBadge}>Coming Soon</span>
          </div>
        </div>

        <div style={styles.integrationCard}>
          <div style={styles.integrationHeader}>
            <span style={styles.integrationIcon}>📋</span>
            <h3>Jira</h3>
          </div>
          <p style={styles.integrationDesc}>
            Sync tasks and issues with AI-powered project management
          </p>
          <div style={styles.integrationFooter}>
            <span style={styles.comingSoonBadge}>Coming Soon</span>
          </div>
        </div>

        <div style={styles.integrationCard}>
          <div style={styles.integrationHeader}>
            <span style={styles.integrationIcon}>📝</span>
            <h3>Notion</h3>
          </div>
          <p style={styles.integrationDesc}>
            Enhance your Notion workspace with AI capabilities
          </p>
          <div style={styles.integrationFooter}>
            <span style={styles.comingSoonBadge}>Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContentTab = () => (
    <div style={styles.tabContent}>
      <h2>AI Content Creation</h2>
      <p style={styles.description}>Generate videos, music, voiceovers, and 3D models with AI</p>

      {/* Video Projects */}
      <div style={styles.contentSection}>
        <div style={styles.sectionHeader}>
          <h3>🎥 Video Projects</h3>
          <button style={styles.primaryButton} onClick={handleCreateVideo}>
            Create Video
          </button>
        </div>
        <div style={styles.projectsGrid}>
          {videoProjects.map(project => (
            <div key={project.id} style={styles.projectCard}>
              <h4>{project.title}</h4>
              <div style={styles.projectMeta}>
                <span>{project.duration.toFixed(0)}s</span>
                <span>{project.resolution}</span>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: getStatusColor(project.status)
                }}>
                  {project.status}
                </span>
              </div>
              {project.status === 'draft' && (
                <button
                  style={styles.secondaryButton}
                  onClick={() => handleGenerateVideo(project.id)}
                >
                  Generate Video
                </button>
              )}
              {project.videoUrl && (
                <a href={project.videoUrl} style={styles.link} target="_blank" rel="noopener noreferrer">
                  View Video
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Music Projects */}
      <div style={styles.contentSection}>
        <div style={styles.sectionHeader}>
          <h3>🎵 Music Projects</h3>
          <button style={styles.primaryButton} onClick={handleCreateMusic}>
            Create Music
          </button>
        </div>
        <div style={styles.projectsGrid}>
          {musicProjects.map(project => (
            <div key={project.id} style={styles.projectCard}>
              <h4>{project.title}</h4>
              <div style={styles.projectMeta}>
                <span>{project.genre}</span>
                <span>{project.tempo} BPM</span>
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: getStatusColor(project.status)
                }}>
                  {project.status}
                </span>
              </div>
              {project.status === 'draft' && (
                <button
                  style={styles.secondaryButton}
                  onClick={() => handleGenerateMusic(project.id)}
                >
                  Generate Music
                </button>
              )}
              {project.audioUrl && (
                <audio controls style={styles.audioPlayer}>
                  <source src={project.audioUrl} type="audio/mpeg" />
                </audio>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Voice Profiles */}
      <div style={styles.contentSection}>
        <div style={styles.sectionHeader}>
          <h3>🎙️ Voice Profiles</h3>
          <button style={styles.primaryButton} onClick={handleCreateVoiceProfile}>
            Create Voice Profile
          </button>
        </div>
        <div style={styles.voicesList}>
          {voiceProfiles.map(profile => (
            <div key={profile.id} style={styles.voiceCard}>
              <h4>{profile.name}</h4>
              <div style={styles.voiceMeta}>
                <span>{profile.gender}</span>
                <span>{profile.language}</span>
                {profile.isCloned && <span style={styles.clonedBadge}>Cloned</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderRPATab = () => (
    <div style={styles.tabContent}>
      <h2>RPA Automation</h2>
      <p style={styles.description}>Record and automate repetitive tasks</p>

      <div style={styles.rpaControls}>
        {isRecording ? (
          <>
            <button style={styles.stopButton} onClick={handleStopRecording}>
              ⏹️ Stop Recording
            </button>
            <span style={styles.recordingIndicator}>🔴 Recording...</span>
          </>
        ) : (
          <button style={styles.primaryButton} onClick={handleStartRecording}>
            🔴 Start Recording
          </button>
        )}
      </div>

      <div style={styles.recordingsList}>
        <h3>Saved Recordings</h3>
        {rpaRecordings.map(recording => (
          <div key={recording.id} style={styles.recordingCard}>
            <div style={styles.recordingHeader}>
              <h4>{recording.name}</h4>
              <span style={styles.stepCount}>{recording.steps.length} steps</span>
            </div>
            <p style={styles.recordingDesc}>{recording.description}</p>
            <div style={styles.recordingFooter}>
              <span>{recording.duration.toFixed(0)}s</span>
              <button
                style={styles.playButton}
                onClick={() => handlePlayRecording(recording.id)}
              >
                ▶️ Play
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderWebhooksTab = () => (
    <div style={styles.tabContent}>
      <h2>Webhooks</h2>
      <p style={styles.description}>Receive real-time notifications about events</p>

      <div style={styles.createWebhookForm}>
        <input
          type="text"
          style={styles.input}
          value={newWebhookName}
          onChange={(e) => setNewWebhookName(e.target.value)}
          placeholder="Webhook name..."
        />
        <input
          type="url"
          style={styles.input}
          value={newWebhookUrl}
          onChange={(e) => setNewWebhookUrl(e.target.value)}
          placeholder="https://your-endpoint.com/webhook"
        />
        <button style={styles.primaryButton} onClick={handleCreateWebhook}>
          Create Webhook
        </button>
      </div>

      <div style={styles.webhooksList}>
        {webhooks.map(webhook => (
          <div key={webhook.id} style={styles.webhookCard}>
            <div style={styles.webhookHeader}>
              <h4>{webhook.name}</h4>
              <button
                style={webhook.active ? styles.activeToggle : styles.inactiveToggle}
                onClick={() => handleToggleWebhook(webhook.id)}
              >
                {webhook.active ? 'Active' : 'Inactive'}
              </button>
            </div>
            <p style={styles.webhookUrl}>{webhook.url}</p>
            <div style={styles.webhookStats}>
              <span>📊 {webhook.totalDeliveries} deliveries</span>
              <span>✅ {webhook.successfulDeliveries} successful</span>
              <span>❌ {webhook.failedDeliveries} failed</span>
            </div>
            <div style={styles.webhookEvents}>
              {webhook.events.map(event => (
                <span key={event} style={styles.eventTag}>{event}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      draft: '#6B7280',
      generating: '#3B82F6',
      completed: '#10B981',
      failed: '#EF4444',
      pending: '#F59E0B'
    }
    return colors[status] || '#6B7280'
  }

  if (loading) {
    return <div style={styles.loading}>Loading integration hub...</div>
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Integration Hub</h1>
        <p style={styles.subtitle}>Connect, create, and automate with AI</p>
      </div>

      <div style={styles.tabs}>
        <button
          style={activeTab === 'integrations' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('integrations')}
        >
          🔌 Integrations
        </button>
        <button
          style={activeTab === 'content' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('content')}
        >
          🎨 AI Content
        </button>
        <button
          style={activeTab === 'rpa' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('rpa')}
        >
          🤖 RPA
        </button>
        <button
          style={activeTab === 'webhooks' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('webhooks')}
        >
          🔔 Webhooks
        </button>
      </div>

      {activeTab === 'integrations' && renderIntegrationsTab()}
      {activeTab === 'content' && renderContentTab()}
      {activeTab === 'rpa' && renderRPATab()}
      {activeTab === 'webhooks' && renderWebhooksTab()}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '20px'
  },
  header: {
    marginBottom: '30px',
    textAlign: 'center'
  },
  title: {
    fontSize: '36px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
    color: '#1F2937'
  },
  subtitle: {
    fontSize: '16px',
    color: '#6B7280',
    margin: 0
  },
  description: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: '24px'
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '30px',
    borderBottom: '2px solid #E5E7EB',
    paddingBottom: '0'
  },
  tab: {
    padding: '12px 24px',
    background: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    fontSize: '16px',
    fontWeight: 500,
    color: '#6B7280',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  activeTab: {
    padding: '12px 24px',
    background: 'transparent',
    border: 'none',
    borderBottom: '3px solid #3B82F6',
    fontSize: '16px',
    fontWeight: 600,
    color: '#3B82F6',
    cursor: 'pointer'
  },
  tabContent: {
    minHeight: '500px'
  },
  loading: {
    textAlign: 'center',
    padding: '100px',
    fontSize: '18px',
    color: '#6B7280'
  },
  // Integrations tab
  integrationsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px'
  },
  integrationCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  integrationHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  integrationIcon: {
    fontSize: '32px'
  },
  integrationDesc: {
    fontSize: '14px',
    color: '#6B7280',
    flex: 1
  },
  integrationFooter: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  connectButton: {
    padding: '10px 20px',
    background: '#3B82F6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  connectedBadge: {
    padding: '8px 16px',
    background: '#DEF7EC',
    color: '#03543F',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600
  },
  comingSoonBadge: {
    padding: '8px 16px',
    background: '#FEF3C7',
    color: '#92400E',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600
  },
  // Content creation tab
  contentSection: {
    marginBottom: '40px'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  primaryButton: {
    padding: '10px 20px',
    background: '#3B82F6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  secondaryButton: {
    padding: '8px 16px',
    background: '#F3F4F6',
    color: '#1F2937',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  projectsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px'
  },
  projectCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  projectMeta: {
    display: 'flex',
    gap: '8px',
    fontSize: '13px',
    color: '#6B7280',
    flexWrap: 'wrap'
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 600,
    color: 'white'
  },
  link: {
    color: '#3B82F6',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 600
  },
  audioPlayer: {
    width: '100%'
  },
  voicesList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px'
  },
  voiceCard: {
    background: 'white',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #E5E7EB'
  },
  voiceMeta: {
    display: 'flex',
    gap: '8px',
    fontSize: '12px',
    color: '#6B7280',
    marginTop: '8px'
  },
  clonedBadge: {
    padding: '2px 6px',
    background: '#DBEAFE',
    color: '#1E40AF',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600
  },
  // RPA tab
  rpaControls: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    marginBottom: '32px'
  },
  stopButton: {
    padding: '12px 24px',
    background: '#EF4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  recordingIndicator: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#EF4444',
    animation: 'pulse 2s infinite'
  },
  recordingsList: {},
  recordingCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    marginBottom: '16px'
  },
  recordingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  stepCount: {
    fontSize: '13px',
    color: '#6B7280'
  },
  recordingDesc: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: '12px'
  },
  recordingFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px',
    color: '#6B7280'
  },
  playButton: {
    padding: '8px 16px',
    background: '#10B981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  // Webhooks tab
  createWebhookForm: {
    display: 'flex',
    gap: '12px',
    marginBottom: '32px'
  },
  input: {
    flex: 1,
    padding: '10px 16px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px'
  },
  webhooksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  webhookCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB'
  },
  webhookHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  activeToggle: {
    padding: '6px 12px',
    background: '#DEF7EC',
    color: '#03543F',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  inactiveToggle: {
    padding: '6px 12px',
    background: '#F3F4F6',
    color: '#6B7280',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  webhookUrl: {
    fontSize: '13px',
    color: '#6B7280',
    fontFamily: 'monospace',
    marginBottom: '12px'
  },
  webhookStats: {
    display: 'flex',
    gap: '16px',
    fontSize: '13px',
    color: '#6B7280',
    marginBottom: '12px'
  },
  webhookEvents: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  eventTag: {
    padding: '4px 8px',
    background: '#DBEAFE',
    color: '#1E40AF',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500
  }
}

export default IntegrationHub
