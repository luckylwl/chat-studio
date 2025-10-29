import React, { useState, useCallback, useRef } from 'react'
import {
  PhotoIcon,
  SpeakerWaveIcon,
  VideoCameraIcon,
  SparklesIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  PlayIcon,
  PauseIcon,
  DocumentTextIcon,
  EyeIcon,
  PencilSquareIcon,
  MicrophoneIcon,
  MusicalNoteIcon
} from '@heroicons/react/24/outline'
import { Button } from './ui'
import { cn } from '@/utils'
import { toast } from 'react-hot-toast'
import { multimodalService } from '@/services/multimodalService'
import type {
  ImageGenerationRequest,
  ImageAnalysisRequest,
  AudioTranscriptionRequest,
  TextToSpeechRequest,
  VideoSubtitleRequest,
  ImageEditRequest
} from '@/services/multimodalService'

interface MultimodalAIAssistantProps {
  className?: string
}

type TabType = 'image-gen' | 'image-analysis' | 'image-edit' | 'audio-transcribe' | 'text-to-speech' | 'video'

export const MultimodalAIAssistant: React.FC<MultimodalAIAssistantProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState<TabType>('image-gen')
  const [isProcessing, setIsProcessing] = useState(false)

  // Image Generation
  const [imagePrompt, setImagePrompt] = useState('')
  const [imageModel, setImageModel] = useState<'dall-e-3' | 'stable-diffusion' | 'midjourney'>('dall-e-3')
  const [imageSize, setImageSize] = useState<'1024x1024' | '1792x1024' | '1024x1792'>('1024x1024')
  const [imageQuality, setImageQuality] = useState<'standard' | 'hd'>('hd')
  const [generatedImages, setGeneratedImages] = useState<string[]>([])

  // Image Analysis
  const [analysisImageUrl, setAnalysisImageUrl] = useState('')
  const [analysisResults, setAnalysisResults] = useState<any>(null)

  // Image Edit
  const [editImageUrl, setEditImageUrl] = useState('')
  const [editOperation, setEditOperation] = useState<'remove-bg' | 'upscale' | 'enhance' | 'recolor'>('remove-bg')
  const [editedImage, setEditedImage] = useState<string | null>(null)

  // Audio Transcription
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [transcriptionLanguage, setTranscriptionLanguage] = useState('en')
  const [transcriptionResult, setTranscriptionResult] = useState<any>(null)

  // Text-to-Speech
  const [ttsText, setTtsText] = useState('')
  const [ttsVoice, setTtsVoice] = useState<'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'>('alloy')
  const [ttsModel, setTtsModel] = useState<'tts-1' | 'tts-1-hd'>('tts-1-hd')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Video
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoSubtitles, setVideoSubtitles] = useState<any>(null)

  // Handle Image Generation
  const handleImageGeneration = useCallback(async () => {
    if (!imagePrompt.trim()) {
      toast.error('Please enter a prompt for image generation')
      return
    }

    setIsProcessing(true)
    try {
      const request: ImageGenerationRequest = {
        prompt: imagePrompt,
        model: imageModel,
        size: imageSize,
        quality: imageQuality,
        n: 1
      }

      const images = await multimodalService.generateImage(request)
      setGeneratedImages(images)
      toast.success(`Generated ${images.length} image(s)!`)
    } catch (error) {
      toast.error(`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }, [imagePrompt, imageModel, imageSize, imageQuality])

  // Handle Image Analysis
  const handleImageAnalysis = useCallback(async () => {
    if (!analysisImageUrl.trim()) {
      toast.error('Please enter an image URL to analyze')
      return
    }

    setIsProcessing(true)
    try {
      const request: ImageAnalysisRequest = {
        imageUrl: analysisImageUrl,
        tasks: ['describe', 'objects', 'text', 'colors', 'sentiment']
      }

      const result = await multimodalService.analyzeImage(request)
      setAnalysisResults(result)
      toast.success('Image analysis completed!')
    } catch (error) {
      toast.error(`Image analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }, [analysisImageUrl])

  // Handle Image Edit
  const handleImageEdit = useCallback(async () => {
    if (!editImageUrl.trim()) {
      toast.error('Please enter an image URL to edit')
      return
    }

    setIsProcessing(true)
    try {
      const request: ImageEditRequest = {
        imageUrl: editImageUrl,
        operation: editOperation,
        params: {}
      }

      const result = await multimodalService.editImage(request)
      setEditedImage(result.imageUrl)
      toast.success('Image editing completed!')
    } catch (error) {
      toast.error(`Image editing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }, [editImageUrl, editOperation])

  // Handle Audio Transcription
  const handleAudioTranscription = useCallback(async () => {
    if (!audioFile) {
      toast.error('Please upload an audio file')
      return
    }

    setIsProcessing(true)
    try {
      const request: AudioTranscriptionRequest = {
        audioFile,
        language: transcriptionLanguage,
        model: 'whisper-1',
        speakerDiarization: true,
        timestamps: true
      }

      const result = await multimodalService.transcribeAudio(request)
      setTranscriptionResult(result)
      toast.success('Audio transcription completed!')
    } catch (error) {
      toast.error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }, [audioFile, transcriptionLanguage])

  // Handle Text-to-Speech
  const handleTextToSpeech = useCallback(async () => {
    if (!ttsText.trim()) {
      toast.error('Please enter text to convert to speech')
      return
    }

    setIsProcessing(true)
    try {
      const request: TextToSpeechRequest = {
        text: ttsText,
        voice: ttsVoice,
        model: ttsModel,
        speed: 1.0
      }

      const url = await multimodalService.textToSpeech(request)
      setAudioUrl(url)
      toast.success('Text-to-speech conversion completed!')
    } catch (error) {
      toast.error(`TTS failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }, [ttsText, ttsVoice, ttsModel])

  // Handle Video Subtitles
  const handleVideoSubtitles = useCallback(async () => {
    if (!videoFile) {
      toast.error('Please upload a video file')
      return
    }

    setIsProcessing(true)
    try {
      const request: VideoSubtitleRequest = {
        videoFile,
        language: 'en',
        format: 'srt'
      }

      const result = await multimodalService.generateVideoSubtitles(request)
      setVideoSubtitles(result)
      toast.success('Video subtitles generated!')
    } catch (error) {
      toast.error(`Subtitle generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }, [videoFile])

  // Play/Pause Audio
  const toggleAudioPlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const tabs = [
    { id: 'image-gen' as TabType, label: 'Image Generation', icon: SparklesIcon },
    { id: 'image-analysis' as TabType, label: 'Image Analysis', icon: EyeIcon },
    { id: 'image-edit' as TabType, label: 'Image Edit', icon: PencilSquareIcon },
    { id: 'audio-transcribe' as TabType, label: 'Transcription', icon: MicrophoneIcon },
    { id: 'text-to-speech' as TabType, label: 'Text-to-Speech', icon: MusicalNoteIcon },
    { id: 'video' as TabType, label: 'Video Tools', icon: VideoCameraIcon },
  ]

  return (
    <div className={cn('flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg shadow-lg', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <PhotoIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Multimodal AI Assistant</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Image, Audio & Video Processing</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <SparklesIcon className="w-5 h-5" />
          <span>AI-Powered</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
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
        {/* Image Generation Tab */}
        {activeTab === 'image-gen' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Image Prompt
              </label>
              <textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white resize-none"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Model
                </label>
                <select
                  value={imageModel}
                  onChange={(e) => setImageModel(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                >
                  <option value="dall-e-3">DALL-E 3</option>
                  <option value="stable-diffusion">Stable Diffusion</option>
                  <option value="midjourney">Midjourney</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Size
                </label>
                <select
                  value={imageSize}
                  onChange={(e) => setImageSize(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                >
                  <option value="1024x1024">1024x1024</option>
                  <option value="1792x1024">1792x1024</option>
                  <option value="1024x1792">1024x1792</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quality
                </label>
                <select
                  value={imageQuality}
                  onChange={(e) => setImageQuality(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                >
                  <option value="standard">Standard</option>
                  <option value="hd">HD</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleImageGeneration}
              disabled={isProcessing || !imagePrompt.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
            >
              {isProcessing ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  Generate Image
                </>
              )}
            </Button>

            {generatedImages.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Generated Images</h3>
                <div className="grid grid-cols-2 gap-4">
                  {generatedImages.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={url}
                        alt={`Generated ${idx + 1}`}
                        className="w-full h-64 object-cover rounded-lg shadow-md"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button className="bg-white text-gray-900">Download</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Image Analysis Tab */}
        {activeTab === 'image-analysis' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Image URL
              </label>
              <input
                type="url"
                value={analysisImageUrl}
                onChange={(e) => setAnalysisImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <Button
              onClick={handleImageAnalysis}
              disabled={isProcessing || !analysisImageUrl.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
            >
              {isProcessing ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <EyeIcon className="w-5 h-5 mr-2" />
                  Analyze Image
                </>
              )}
            </Button>

            {analysisResults && (
              <div className="mt-6 space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Analysis Results</h3>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Description</p>
                      <p className="text-gray-900 dark:text-white">{analysisResults.description}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Objects Detected</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {analysisResults.objects.map((obj: any, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                          >
                            {obj.name} ({Math.round(obj.confidence * 100)}%)
                          </span>
                        ))}
                      </div>
                    </div>

                    {analysisResults.text && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Text Detected</p>
                        <p className="text-gray-900 dark:text-white">{analysisResults.text}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Dominant Colors</p>
                      <div className="flex gap-2 mt-1">
                        {analysisResults.colors.map((color: string, idx: number) => (
                          <div
                            key={idx}
                            className="w-12 h-12 rounded-lg shadow-md"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sentiment</p>
                      <p className="text-gray-900 dark:text-white capitalize">{analysisResults.sentiment}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Image Edit Tab */}
        {activeTab === 'image-edit' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Image URL
              </label>
              <input
                type="url"
                value={editImageUrl}
                onChange={(e) => setEditImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Operation
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['remove-bg', 'upscale', 'enhance', 'recolor'] as const).map(op => (
                  <button
                    key={op}
                    onClick={() => setEditOperation(op)}
                    className={cn(
                      'px-4 py-3 rounded-lg border-2 transition-all',
                      editOperation === op
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                    )}
                  >
                    {op.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleImageEdit}
              disabled={isProcessing || !editImageUrl.trim()}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white"
            >
              {isProcessing ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <PencilSquareIcon className="w-5 h-5 mr-2" />
                  Edit Image
                </>
              )}
            </Button>

            {editedImage && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edited Image</h3>
                <img
                  src={editedImage}
                  alt="Edited"
                  className="w-full max-h-96 object-contain rounded-lg shadow-md"
                />
              </div>
            )}
          </div>
        )}

        {/* Audio Transcription Tab */}
        {activeTab === 'audio-transcribe' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload Audio File
              </label>
              <div className="flex items-center gap-3">
                <input
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
                  <option value="ja">Japanese</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleAudioTranscription}
              disabled={isProcessing || !audioFile}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white"
            >
              {isProcessing ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                  Transcribing...
                </>
              ) : (
                <>
                  <MicrophoneIcon className="w-5 h-5 mr-2" />
                  Transcribe Audio
                </>
              )}
            </Button>

            {transcriptionResult && (
              <div className="mt-6 space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Transcription</h3>

                  <div className="space-y-3">
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-900 dark:text-white leading-relaxed">{transcriptionResult.text}</p>
                    </div>

                    {transcriptionResult.segments && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Segments</p>
                        <div className="space-y-2">
                          {transcriptionResult.segments.map((segment: any, idx: number) => (
                            <div key={idx} className="bg-white dark:bg-gray-700 rounded-lg p-3">
                              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-1">
                                <span>Speaker {segment.speaker}</span>
                                <span>{segment.startTime.toFixed(1)}s - {segment.endTime.toFixed(1)}s</span>
                                <span className="ml-auto">{Math.round(segment.confidence * 100)}%</span>
                              </div>
                              <p className="text-gray-900 dark:text-white text-sm">{segment.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Text-to-Speech Tab */}
        {activeTab === 'text-to-speech' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Text to Convert
              </label>
              <textarea
                value={ttsText}
                onChange={(e) => setTtsText(e.target.value)}
                placeholder="Enter the text you want to convert to speech..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white resize-none"
                rows={6}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Voice
                </label>
                <select
                  value={ttsVoice}
                  onChange={(e) => setTtsVoice(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                >
                  <option value="alloy">Alloy</option>
                  <option value="echo">Echo</option>
                  <option value="fable">Fable</option>
                  <option value="onyx">Onyx</option>
                  <option value="nova">Nova</option>
                  <option value="shimmer">Shimmer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Model Quality
                </label>
                <select
                  value={ttsModel}
                  onChange={(e) => setTtsModel(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                >
                  <option value="tts-1">Standard</option>
                  <option value="tts-1-hd">HD</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleTextToSpeech}
              disabled={isProcessing || !ttsText.trim()}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
            >
              {isProcessing ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <MusicalNoteIcon className="w-5 h-5 mr-2" />
                  Convert to Speech
                </>
              )}
            </Button>

            {audioUrl && (
              <div className="mt-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Generated Audio</h3>
                <div className="flex items-center gap-4">
                  <button
                    onClick={toggleAudioPlayback}
                    className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full hover:shadow-lg transition-shadow"
                  >
                    {isPlaying ? (
                      <PauseIcon className="w-6 h-6" />
                    ) : (
                      <PlayIcon className="w-6 h-6" />
                    )}
                  </button>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Click to play generated audio</p>
                  </div>
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Video Tab */}
        {activeTab === 'video' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload Video File
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
              />
            </div>

            <Button
              onClick={handleVideoSubtitles}
              disabled={isProcessing || !videoFile}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white"
            >
              {isProcessing ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <DocumentTextIcon className="w-5 h-5 mr-2" />
                  Generate Subtitles
                </>
              )}
            </Button>

            {videoSubtitles && (
              <div className="mt-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Subtitles (SRT)</h3>
                <pre className="bg-white dark:bg-gray-700 rounded-lg p-4 text-sm text-gray-900 dark:text-white overflow-auto max-h-96">
                  {videoSubtitles.content}
                </pre>
                <Button className="mt-4">
                  <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                  Download SRT File
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
            <span>Total Requests: {multimodalService.getStatistics().totalRequests}</span>
            <span>•</span>
            <span>Success Rate: {Math.round(multimodalService.getStatistics().successRate * 100)}%</span>
          </div>
          <div className="text-gray-500 dark:text-gray-500 text-xs">
            Powered by AI
          </div>
        </div>
      </div>
    </div>
  )
}
