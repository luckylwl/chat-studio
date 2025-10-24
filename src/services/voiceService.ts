export interface VoiceSettings {
  language: string
  voice: string
  rate: number
  pitch: number
  volume: number
  autoSpeak: boolean
  voiceInput: boolean
}

export interface SpeechRecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
}

export interface VoiceCommand {
  command: string
  action: () => void
  description: string
}

export class VoiceService {
  private static instance: VoiceService
  private speechSynthesis: SpeechSynthesis | null = null
  private speechRecognition: SpeechRecognition | null = null
  private isListening: boolean = false
  private settings: VoiceSettings
  private voiceCommands: VoiceCommand[] = []
  private listeners: Map<string, Function[]> = new Map()

  private constructor() {
    this.settings = this.getDefaultSettings()
    this.initializeSpeechSynthesis()
    this.initializeSpeechRecognition()
    this.loadSettings()
    this.setupVoiceCommands()
  }

  public static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService()
    }
    return VoiceService.instance
  }

  private getDefaultSettings(): VoiceSettings {
    return {
      language: 'zh-CN',
      voice: '',
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      autoSpeak: false,
      voiceInput: false
    }
  }

  private initializeSpeechSynthesis(): void {
    if ('speechSynthesis' in window) {
      this.speechSynthesis = window.speechSynthesis
    }
  }

  private initializeSpeechRecognition(): void {
    if ('webkitSpeechRecognition' in window) {
      this.speechRecognition = new window.webkitSpeechRecognition()
      this.speechRecognition.continuous = true
      this.speechRecognition.interimResults = true
      this.speechRecognition.lang = this.settings.language

      this.speechRecognition.onresult = (event) => {
        this.handleSpeechRecognitionResult(event)
      }

      this.speechRecognition.onerror = (event) => {
        this.handleSpeechRecognitionError(event)
      }

      this.speechRecognition.onend = () => {
        this.isListening = false
        this.emit('listening_stopped')
      }

      this.speechRecognition.onstart = () => {
        this.isListening = true
        this.emit('listening_started')
      }
    } else if ('SpeechRecognition' in window) {
      this.speechRecognition = new (window as any).SpeechRecognition()
      this.speechRecognition!.continuous = true
      this.speechRecognition!.interimResults = true
      this.speechRecognition!.lang = this.settings.language

      this.speechRecognition!.onresult = (event) => {
        this.handleSpeechRecognitionResult(event)
      }

      this.speechRecognition!.onerror = (event) => {
        this.handleSpeechRecognitionError(event)
      }

      this.speechRecognition!.onend = () => {
        this.isListening = false
        this.emit('listening_stopped')
      }

      this.speechRecognition!.onstart = () => {
        this.isListening = true
        this.emit('listening_started')
      }
    }
  }

  private setupVoiceCommands(): void {
    this.voiceCommands = [
      {
        command: '新建对话',
        action: () => this.emit('new_conversation'),
        description: '创建新的对话'
      },
      {
        command: '清空对话',
        action: () => this.emit('clear_conversation'),
        description: '清空当前对话'
      },
      {
        command: '发送消息',
        action: () => this.emit('send_message'),
        description: '发送当前输入的消息'
      },
      {
        command: '清空输入',
        action: () => this.emit('clear_input'),
        description: '清空输入框内容'
      },
      {
        command: '打开设置',
        action: () => this.emit('open_settings'),
        description: '打开设置页面'
      },
      {
        command: '停止朗读',
        action: () => this.stopSpeaking(),
        description: '停止语音朗读'
      },
      {
        command: '开始朗读',
        action: () => this.emit('start_speaking'),
        description: '开始语音朗读'
      },
      {
        command: '搜索对话',
        action: () => this.emit('open_search'),
        description: '打开搜索功能'
      },
      {
        command: '切换模型',
        action: () => this.emit('toggle_model'),
        description: '切换AI模型'
      },
      {
        command: '上传文件',
        action: () => this.emit('upload_file'),
        description: '打开文件上传'
      }
    ]
  }

  /**
   * 文本转语音
   */
  public speak(text: string, options?: Partial<VoiceSettings>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.speechSynthesis) {
        reject(new Error('Speech synthesis not supported'))
        return
      }

      // 停止之前的朗读
      this.stopSpeaking()

      const utterance = new SpeechSynthesisUtterance(text)
      const settings = { ...this.settings, ...options }

      utterance.lang = settings.language
      utterance.rate = settings.rate
      utterance.pitch = settings.pitch
      utterance.volume = settings.volume

      // 设置声音
      if (settings.voice) {
        const voices = this.getAvailableVoices()
        const selectedVoice = voices.find(voice => voice.name === settings.voice)
        if (selectedVoice) {
          utterance.voice = selectedVoice
        }
      }

      utterance.onend = () => {
        this.emit('speaking_ended')
        resolve()
      }

      utterance.onerror = (event) => {
        this.emit('speaking_error', event.error)
        reject(new Error(event.error))
      }

      utterance.onstart = () => {
        this.emit('speaking_started')
      }

      this.speechSynthesis.speak(utterance)
    })
  }

  /**
   * 停止朗读
   */
  public stopSpeaking(): void {
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel()
      this.emit('speaking_stopped')
    }
  }

  /**
   * 开始语音识别
   */
  public startListening(): void {
    if (!this.speechRecognition) {
      throw new Error('Speech recognition not supported')
    }

    if (!this.isListening) {
      this.speechRecognition.start()
    }
  }

  /**
   * 停止语音识别
   */
  public stopListening(): void {
    if (this.speechRecognition && this.isListening) {
      this.speechRecognition.stop()
    }
  }

  /**
   * 切换语音识别状态
   */
  public toggleListening(): void {
    if (this.isListening) {
      this.stopListening()
    } else {
      this.startListening()
    }
  }

  /**
   * 获取可用的声音列表
   */
  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.speechSynthesis) {
      return []
    }
    return this.speechSynthesis.getVoices()
  }

  /**
   * 获取支持的语言列表
   */
  public getSupportedLanguages(): string[] {
    const voices = this.getAvailableVoices()
    const languages = Array.from(new Set(voices.map(voice => voice.lang)))
    return languages.sort()
  }

  /**
   * 检查语音功能支持
   */
  public getCapabilities(): {
    speechSynthesis: boolean
    speechRecognition: boolean
    voiceCommands: boolean
  } {
    return {
      speechSynthesis: !!this.speechSynthesis,
      speechRecognition: !!this.speechRecognition,
      voiceCommands: !!this.speechRecognition && this.voiceCommands.length > 0
    }
  }

  /**
   * 更新设置
   */
  public updateSettings(newSettings: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
    this.saveSettings()

    // 更新语音识别语言
    if (this.speechRecognition && newSettings.language) {
      this.speechRecognition.lang = newSettings.language
    }

    this.emit('settings_updated', this.settings)
  }

  /**
   * 获取当前设置
   */
  public getSettings(): VoiceSettings {
    return { ...this.settings }
  }

  /**
   * 获取语音命令列表
   */
  public getVoiceCommands(): VoiceCommand[] {
    return [...this.voiceCommands]
  }

  /**
   * 添加自定义语音命令
   */
  public addVoiceCommand(command: VoiceCommand): void {
    this.voiceCommands.push(command)
  }

  /**
   * 移除语音命令
   */
  public removeVoiceCommand(commandText: string): void {
    this.voiceCommands = this.voiceCommands.filter(cmd => cmd.command !== commandText)
  }

  /**
   * 检查是否正在朗读
   */
  public isSpeaking(): boolean {
    return this.speechSynthesis?.speaking || false
  }

  /**
   * 检查是否正在监听
   */
  public isListeningActive(): boolean {
    return this.isListening
  }

  /**
   * 添加事件监听器
   */
  public addEventListener(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(listener)
  }

  /**
   * 移除事件监听器
   */
  public removeEventListener(event: string, listener: Function): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private handleSpeechRecognitionResult(event: SpeechRecognitionEvent): void {
    let finalTranscript = ''
    let interimTranscript = ''

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i]
      const transcript = result[0].transcript

      if (result.isFinal) {
        finalTranscript += transcript
      } else {
        interimTranscript += transcript
      }
    }

    // 触发识别结果事件
    this.emit('speech_result', {
      transcript: finalTranscript || interimTranscript,
      confidence: event.results[event.results.length - 1]?.[0]?.confidence || 0,
      isFinal: !!finalTranscript
    })

    // 检查语音命令
    if (finalTranscript) {
      this.processVoiceCommand(finalTranscript.trim())
    }
  }

  private handleSpeechRecognitionError(event: SpeechRecognitionErrorEvent): void {
    this.emit('speech_error', {
      error: event.error,
      message: event.message
    })
  }

  private processVoiceCommand(transcript: string): void {
    const command = this.voiceCommands.find(cmd =>
      transcript.toLowerCase().includes(cmd.command.toLowerCase())
    )

    if (command) {
      this.emit('voice_command', command)
      command.action()
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.forEach(listener => listener(data))
    }
  }

  private loadSettings(): void {
    try {
      const stored = localStorage.getItem('voice-settings')
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) }
      }
    } catch (error) {
      console.error('Load voice settings error:', error)
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('voice-settings', JSON.stringify(this.settings))
    } catch (error) {
      console.error('Save voice settings error:', error)
    }
  }
}

// 扩展 Window 接口以包含语音 API
declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition
    SpeechRecognition: new () => SpeechRecognition
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    start(): void
    stop(): void
    onresult: (event: SpeechRecognitionEvent) => void
    onerror: (event: SpeechRecognitionErrorEvent) => void
    onend: () => void
    onstart: () => void
  }

  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList
    resultIndex: number
  }

  interface SpeechRecognitionResultList {
    readonly length: number
    item(index: number): SpeechRecognitionResult
    [index: number]: SpeechRecognitionResult
  }

  interface SpeechRecognitionResult {
    readonly length: number
    item(index: number): SpeechRecognitionAlternative
    [index: number]: SpeechRecognitionAlternative
    readonly isFinal: boolean
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string
    readonly confidence: number
  }

  interface SpeechRecognitionErrorEvent extends Event {
    error: string
    message: string
  }
}