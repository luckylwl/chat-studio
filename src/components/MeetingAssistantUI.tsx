import React, { useState, useCallback, useRef } from 'react'
import {
  VideoCameraIcon,
  MicrophoneIcon,
  StopIcon,
  DocumentTextIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  PlayIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline'
import { Button } from './ui'
import { cn } from '@/utils'
import { toast } from 'react-hot-toast'
import { meetingAssistantService } from '@/services/meetingAssistantService'
import type {
  Meeting,
  MeetingData,
  TranscriptionRequest,
  Participant,
  ActionItem
} from '@/services/meetingAssistantService'

interface MeetingAssistantUIProps {
  className?: string
}

type ViewMode = 'meetings' | 'transcription' | 'minutes' | 'action-items'

export const MeetingAssistantUI: React.FC<MeetingAssistantUIProps> = ({ className }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('meetings')
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // New Meeting Form
  const [showNewMeetingForm, setShowNewMeetingForm] = useState(false)
  const [newMeetingTitle, setNewMeetingTitle] = useState('')
  const [newMeetingDescription, setNewMeetingDescription] = useState('')
  const [newMeetingStartTime, setNewMeetingStartTime] = useState('')

  // Transcription
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [transcriptionLanguage, setTranscriptionLanguage] = useState('en')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Action Items
  const [actionItems, setActionItems] = useState<ActionItem[]>([])

  // Load meetings on mount
  React.useEffect(() => {
    setMeetings(meetingAssistantService.getAllMeetings())
    setActionItems(meetingAssistantService.getAllActionItems())
  }, [])

  // Create New Meeting
  const handleCreateMeeting = useCallback(() => {
    if (!newMeetingTitle.trim()) {
      toast.error('Please enter a meeting title')
      return
    }

    const meetingData: MeetingData = {
      title: newMeetingTitle,
      description: newMeetingDescription,
      startTime: newMeetingStartTime || new Date().toISOString(),
      participants: [{
        id: '1',
        name: 'Current User',
        email: 'user@example.com',
        role: 'organizer'
      }],
      organizer: 'Current User'
    }

    const meeting = meetingAssistantService.createMeeting(meetingData)
    setMeetings(prev => [meeting, ...prev])
    setShowNewMeetingForm(false)
    setNewMeetingTitle('')
    setNewMeetingDescription('')
    setNewMeetingStartTime('')
    toast.success('Meeting created successfully!')
  }, [newMeetingTitle, newMeetingDescription, newMeetingStartTime])

  // Start Meeting
  const handleStartMeeting = useCallback((meetingId: string) => {
    meetingAssistantService.startMeeting(meetingId)
    setMeetings(meetingAssistantService.getAllMeetings())
    toast.success('Meeting started!')
  }, [])

  // End Meeting
  const handleEndMeeting = useCallback((meetingId: string) => {
    meetingAssistantService.endMeeting(meetingId)
    setMeetings(meetingAssistantService.getAllMeetings())
    toast.success('Meeting ended!')
  }, [])

  // Transcribe Meeting
  const handleTranscribeMeeting = useCallback(async () => {
    if (!audioFile || !selectedMeeting) {
      toast.error('Please select a meeting and upload an audio file')
      return
    }

    setIsProcessing(true)
    try {
      const request: TranscriptionRequest = {
        audioFile,
        meetingId: selectedMeeting.id,
        language: transcriptionLanguage,
        speakerDiarization: true,
        timestamps: true
      }

      await meetingAssistantService.transcribeMeeting(request)
      setMeetings(meetingAssistantService.getAllMeetings())
      toast.success('Transcription completed!')
    } catch (error) {
      toast.error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }, [audioFile, selectedMeeting, transcriptionLanguage])

  // Generate Meeting Minutes
  const handleGenerateMinutes = useCallback(async (meetingId: string) => {
    setIsProcessing(true)
    try {
      await meetingAssistantService.generateMeetingMinutes(meetingId)
      setMeetings(meetingAssistantService.getAllMeetings())
      toast.success('Meeting minutes generated!')
    } catch (error) {
      toast.error(`Minutes generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  // Toggle Action Item Status
  const handleToggleActionItem = useCallback((itemId: string) => {
    const item = meetingAssistantService.getActionItem(itemId)
    if (item) {
      meetingAssistantService.updateActionItem(itemId, {
        status: item.status === 'completed' ? 'pending' : 'completed'
      })
      setActionItems(meetingAssistantService.getAllActionItems())
    }
  }, [])

  const stats = meetingAssistantService.getStatistics()

  const tabs = [
    { id: 'meetings' as ViewMode, label: 'Meetings', icon: VideoCameraIcon },
    { id: 'transcription' as ViewMode, label: 'Transcription', icon: MicrophoneIcon },
    { id: 'minutes' as ViewMode, label: 'Minutes', icon: DocumentTextIcon },
    { id: 'action-items' as ViewMode, label: 'Action Items', icon: CheckCircleIcon },
  ]

  return (
    <div className={cn('flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg shadow-lg', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
            <VideoCameraIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Meeting Assistant</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {stats.totalMeetings} Meetings • {stats.transcribedMeetings} Transcribed
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowNewMeetingForm(true)}
          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white"
        >
          <CalendarIcon className="w-4 h-4 mr-2" />
          New Meeting
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
              viewMode === tab.id
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Meetings View */}
        {viewMode === 'meetings' && (
          <div className="space-y-4">
            {meetings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-600">
                <VideoCameraIcon className="w-16 h-16 mb-4" />
                <p className="text-lg font-medium">No meetings yet</p>
                <p className="text-sm">Create a meeting to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {meetings.map(meeting => (
                  <div
                    key={meeting.id}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{meeting.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{meeting.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" />
                            {new Date(meeting.startTime).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <UserGroupIcon className="w-3 h-3" />
                            {meeting.participants.length} participants
                          </span>
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            meeting.status === 'in-progress' && 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
                            meeting.status === 'completed' && 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
                            meeting.status === 'scheduled' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
                            meeting.status === 'cancelled' && 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          )}>
                            {meeting.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {meeting.status === 'scheduled' && (
                          <Button
                            size="sm"
                            onClick={() => handleStartMeeting(meeting.id)}
                            className="bg-green-500 text-white"
                          >
                            <PlayIcon className="w-3 h-3 mr-1" />
                            Start
                          </Button>
                        )}
                        {meeting.status === 'in-progress' && (
                          <Button
                            size="sm"
                            onClick={() => handleEndMeeting(meeting.id)}
                            className="bg-red-500 text-white"
                          >
                            <StopIcon className="w-3 h-3 mr-1" />
                            End
                          </Button>
                        )}
                        {meeting.transcript && !meeting.minutes && (
                          <Button
                            size="sm"
                            onClick={() => handleGenerateMinutes(meeting.id)}
                            disabled={isProcessing}
                          >
                            Generate Minutes
                          </Button>
                        )}
                      </div>
                    </div>

                    {meeting.transcript && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Transcript Preview</p>
                        <p className="text-sm text-gray-900 dark:text-white line-clamp-3">
                          {meeting.transcript.text.substring(0, 200)}...
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Transcription View */}
        {viewMode === 'transcription' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Meeting
              </label>
              <select
                value={selectedMeeting?.id || ''}
                onChange={(e) => {
                  const meeting = meetings.find(m => m.id === e.target.value)
                  setSelectedMeeting(meeting || null)
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select a meeting...</option>
                {meetings.map(meeting => (
                  <option key={meeting.id} value={meeting.id}>{meeting.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload Audio File
              </label>
              <div className="flex gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                />
                <select
                  value={transcriptionLanguage}
                  onChange={(e) => setTranscriptionLanguage(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="zh">Chinese</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleTranscribeMeeting}
              disabled={isProcessing || !audioFile || !selectedMeeting}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white"
            >
              {isProcessing ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                  Transcribing...
                </>
              ) : (
                <>
                  <MicrophoneIcon className="w-4 h-4 mr-2" />
                  Transcribe Audio
                </>
              )}
            </Button>

            {selectedMeeting?.transcript && (
              <div className="mt-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transcription</h3>
                <div className="space-y-3">
                  {selectedMeeting.transcript.segments.map((segment, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>Speaker {segment.speaker}</span>
                        <span>{segment.startTime.toFixed(1)}s - {segment.endTime.toFixed(1)}s</span>
                        <span className="ml-auto">{Math.round(segment.confidence * 100)}%</span>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white">{segment.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Minutes View */}
        {viewMode === 'minutes' && (
          <div className="space-y-4">
            {meetings.filter(m => m.minutes).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-600">
                <DocumentTextIcon className="w-16 h-16 mb-4" />
                <p className="text-lg font-medium">No meeting minutes yet</p>
                <p className="text-sm">Transcribe a meeting to generate minutes</p>
              </div>
            ) : (
              <div className="space-y-4">
                {meetings.filter(m => m.minutes).map(meeting => (
                  <div key={meeting.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{meeting.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {new Date(meeting.startTime).toLocaleDateString()}
                    </p>

                    {meeting.minutes && (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Summary</h4>
                          <p className="text-gray-700 dark:text-gray-300">{meeting.minutes.summary}</p>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Key Points</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {meeting.minutes.keyPoints.map((point, idx) => (
                              <li key={idx} className="text-gray-700 dark:text-gray-300">{point}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Decisions Made</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {meeting.minutes.decisions.map((decision, idx) => (
                              <li key={idx} className="text-gray-700 dark:text-gray-300">{decision}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Action Items</h4>
                          <div className="space-y-2">
                            {meeting.minutes.actionItems.map((item, idx) => (
                              <div key={idx} className="bg-white dark:bg-gray-700 rounded-lg p-3">
                                <p className="font-medium text-gray-900 dark:text-white">{item.task}</p>
                                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  <span>Assigned to: {item.assignee}</span>
                                  <span>•</span>
                                  <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                                  <span className={cn(
                                    'ml-auto px-2 py-0.5 rounded text-xs',
                                    item.priority === 'high' && 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
                                    item.priority === 'medium' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
                                    item.priority === 'low' && 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                  )}>
                                    {item.priority}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Items View */}
        {viewMode === 'action-items' && (
          <div className="space-y-4">
            {actionItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-600">
                <ListBulletIcon className="w-16 h-16 mb-4" />
                <p className="text-lg font-medium">No action items yet</p>
                <p className="text-sm">Action items will appear from meeting minutes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {actionItems.map(item => (
                  <div
                    key={item.id}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleActionItem(item.id)}
                        className={cn(
                          'mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                          item.status === 'completed'
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                        )}
                      >
                        {item.status === 'completed' && (
                          <CheckCircleIcon className="w-4 h-4 text-white" />
                        )}
                      </button>
                      <div className="flex-1">
                        <h3 className={cn(
                          'font-medium mb-1',
                          item.status === 'completed'
                            ? 'text-gray-500 dark:text-gray-400 line-through'
                            : 'text-gray-900 dark:text-white'
                        )}>
                          {item.task}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                          <span>{item.assignee}</span>
                          <span>•</span>
                          <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                          <span className={cn(
                            'px-2 py-0.5 rounded text-xs',
                            item.priority === 'high' && 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
                            item.priority === 'medium' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
                            item.priority === 'low' && 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          )}>
                            {item.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Meeting Modal */}
      {showNewMeetingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create New Meeting</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={newMeetingTitle}
                  onChange={(e) => setNewMeetingTitle(e.target.value)}
                  placeholder="Meeting title"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  value={newMeetingDescription}
                  onChange={(e) => setNewMeetingDescription(e.target.value)}
                  placeholder="Meeting description"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Time</label>
                <input
                  type="datetime-local"
                  value={newMeetingStartTime}
                  onChange={(e) => setNewMeetingStartTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleCreateMeeting} className="flex-1 bg-green-500 text-white">
                  Create Meeting
                </Button>
                <Button onClick={() => setShowNewMeetingForm(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
            <span>Total Meetings: {stats.totalMeetings}</span>
            <span>•</span>
            <span>Transcribed: {stats.transcribedMeetings}</span>
            <span>•</span>
            <span>Action Items: {stats.totalActionItems}</span>
          </div>
          <div className="text-gray-500 dark:text-gray-500 text-xs">
            AI-Powered Meeting Assistant
          </div>
        </div>
      </div>
    </div>
  )
}
