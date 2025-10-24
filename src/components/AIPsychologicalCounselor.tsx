import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAnalytics } from './AnalyticsProvider'
import { useAppStore } from '@/store'
import { cn } from '@/utils'

interface MoodData {
  timestamp: number
  mood: number // 1-10 scale
  energy: number // 1-10 scale
  stress: number // 1-10 scale
  anxiety: number // 1-10 scale
  sleep: number // hours
  notes?: string
  triggers?: string[]
  activities?: string[]
}

interface AssessmentQuestion {
  id: string
  text: string
  type: 'scale' | 'multiple' | 'text' | 'boolean'
  options?: string[]
  min?: number
  max?: number
  required: boolean
  category: 'mood' | 'anxiety' | 'depression' | 'stress' | 'sleep' | 'social' | 'life'
}

interface AssessmentResult {
  category: string
  score: number
  level: 'low' | 'moderate' | 'high' | 'severe'
  description: string
  recommendations: string[]
}

interface CopingStrategy {
  id: string
  title: string
  description: string
  category: 'breathing' | 'mindfulness' | 'cognitive' | 'behavioral' | 'social' | 'physical'
  difficulty: 'easy' | 'medium' | 'hard'
  duration: number // minutes
  instructions: string[]
  benefits: string[]
  whenToUse: string[]
  audioGuide?: string
}

interface TherapySession {
  id: string
  timestamp: number
  duration: number
  type: 'crisis' | 'regular' | 'assessment' | 'followup'
  mood_before: number
  mood_after?: number
  topics: string[]
  insights: string[]
  homework?: string[]
  nextSessionDate?: number
  summary: string
  aiPersonality: string
}

interface CrisisResource {
  type: 'hotline' | 'chat' | 'emergency' | 'text'
  name: string
  description: string
  contact: string
  available: string
  country: string
  languages: string[]
}

const moodAssessmentQuestions: AssessmentQuestion[] = [
  {
    id: 'mood_overall',
    text: '总体来说，您最近一周的心情如何？',
    type: 'scale',
    min: 1,
    max: 10,
    required: true,
    category: 'mood'
  },
  {
    id: 'energy_level',
    text: '您最近的精力水平如何？',
    type: 'scale',
    min: 1,
    max: 10,
    required: true,
    category: 'mood'
  },
  {
    id: 'anxiety_frequency',
    text: '您多久感到焦虑一次？',
    type: 'multiple',
    options: ['从不', '很少', '有时', '经常', '总是'],
    required: true,
    category: 'anxiety'
  },
  {
    id: 'sleep_quality',
    text: '您的睡眠质量如何？',
    type: 'multiple',
    options: ['很好', '好', '一般', '不好', '很不好'],
    required: true,
    category: 'sleep'
  },
  {
    id: 'stress_level',
    text: '您目前的压力水平是多少？',
    type: 'scale',
    min: 1,
    max: 10,
    required: true,
    category: 'stress'
  },
  {
    id: 'social_isolation',
    text: '您是否感到与他人隔离或孤独？',
    type: 'boolean',
    required: true,
    category: 'social'
  },
  {
    id: 'life_satisfaction',
    text: '您对自己的生活满意度如何？',
    type: 'scale',
    min: 1,
    max: 10,
    required: true,
    category: 'life'
  },
  {
    id: 'depression_symptoms',
    text: '您是否经历过以下症状？（多选）',
    type: 'multiple',
    options: [
      '持续的悲伤或空虚感',
      '对平时喜欢的活动失去兴趣',
      '疲劳或精力不足',
      '注意力难以集中',
      '睡眠问题',
      '食欲变化',
      '无价值感或过度内疚',
      '以上都没有'
    ],
    required: true,
    category: 'depression'
  }
]

const copingStrategies: CopingStrategy[] = [
  {
    id: 'breathing_4_7_8',
    title: '4-7-8 呼吸法',
    description: '简单有效的放松呼吸技巧，有助于快速平静心情',
    category: 'breathing',
    difficulty: 'easy',
    duration: 5,
    instructions: [
      '找到一个舒适的坐姿或躺姿',
      '用鼻子吸气4秒',
      '屏住呼吸7秒',
      '用嘴巴慢慢呼气8秒',
      '重复这个循环4-8次'
    ],
    benefits: ['减少焦虑', '改善睡眠', '降低心率', '增强专注力'],
    whenToUse: ['感到焦虑时', '睡前', '压力大的时候', '需要快速放松时']
  },
  {
    id: 'mindfulness_body_scan',
    title: '身体扫描冥想',
    description: '通过专注于身体各部位来增强正念和放松',
    category: 'mindfulness',
    difficulty: 'medium',
    duration: 15,
    instructions: [
      '躺下并闭上眼睛',
      '从脚趾开始，逐渐向上关注身体每个部位',
      '注意每个部位的感觉，不做判断',
      '如果发现紧张的地方，想象放松下来',
      '最后关注整个身体的感觉'
    ],
    benefits: ['增强身体意识', '减少肌肉紧张', '改善睡眠质量', '提高专注力'],
    whenToUse: ['睡前放松', '感到身体紧张时', '需要重新连接身心时']
  },
  {
    id: 'cognitive_restructuring',
    title: '认知重构',
    description: '识别并改变负面思维模式的技巧',
    category: 'cognitive',
    difficulty: 'hard',
    duration: 20,
    instructions: [
      '识别触发负面情绪的想法',
      '问自己：这个想法是基于事实吗？',
      '考虑其他可能的解释',
      '用更平衡、客观的想法替换负面想法',
      '记录下新的想法和感受'
    ],
    benefits: ['改善思维模式', '减少负面情绪', '增强自我意识', '提高问题解决能力'],
    whenToUse: ['陷入负面思维时', '感到沮丧或焦虑时', '面临挑战时']
  },
  {
    id: 'progressive_muscle_relaxation',
    title: '渐进式肌肉放松',
    description: '通过逐步收缩和放松肌肉群来缓解身体紧张',
    category: 'physical',
    difficulty: 'medium',
    duration: 20,
    instructions: [
      '找到安静舒适的地方躺下',
      '从脚部开始，收缩肌肉5秒钟',
      '然后完全放松15秒',
      '逐渐向上到小腿、大腿、腹部等',
      '最后到面部肌肉，然后全身放松'
    ],
    benefits: ['减少肌肉紧张', '降低焦虑', '改善睡眠', '增强身体意识'],
    whenToUse: ['感到身体紧张时', '睡前', '压力大时', '头痛时']
  },
  {
    id: 'grounding_5_4_3_2_1',
    title: '5-4-3-2-1 接地技巧',
    description: '通过五感来回归当下，缓解焦虑和恐慌',
    category: 'mindfulness',
    difficulty: 'easy',
    duration: 5,
    instructions: [
      '说出你能看到的5样东西',
      '说出你能触摸到的4样东西',
      '说出你能听到的3个声音',
      '说出你能闻到的2种气味',
      '说出你能尝到的1种味道'
    ],
    benefits: ['快速缓解焦虑', '回归当下', '减少恐慌', '增强现实感'],
    whenToUse: ['恐慌发作时', '感到焦虑时', '思绪混乱时', '需要快速稳定情绪时']
  },
  {
    id: 'gratitude_practice',
    title: '感恩练习',
    description: '通过专注于积极方面来改善心情和思维',
    category: 'cognitive',
    difficulty: 'easy',
    duration: 10,
    instructions: [
      '每天写下3件值得感恩的事',
      '可以是大事，也可以是小事',
      '详细描述为什么感恩这些事',
      '回想当时的感受',
      '定期回顾之前的感恩清单'
    ],
    benefits: ['改善心情', '增强积极思维', '提高生活满意度', '增强社交关系'],
    whenToUse: ['感到沮丧时', '每天睡前', '需要改变视角时', '想要增强幸福感时']
  }
]

const crisisResources: CrisisResource[] = [
  {
    type: 'hotline',
    name: '全国心理危机干预热线',
    description: '24小时免费心理危机干预服务',
    contact: '400-161-9995',
    available: '24小时',
    country: 'CN',
    languages: ['中文']
  },
  {
    type: 'hotline',
    name: '北京危机干预热线',
    description: '北京地区24小时心理危机干预',
    contact: '400-161-9995',
    available: '24小时',
    country: 'CN',
    languages: ['中文']
  },
  {
    type: 'emergency',
    name: '急救电话',
    description: '生命危险时请立即拨打',
    contact: '120',
    available: '24小时',
    country: 'CN',
    languages: ['中文']
  },
  {
    type: 'chat',
    name: '在线心理咨询',
    description: '专业心理咨询师在线服务',
    contact: 'https://www.xinli001.com',
    available: '9:00-22:00',
    country: 'CN',
    languages: ['中文']
  }
]

interface AIPsychologicalCounselorProps {
  className?: string
}

export const AIPsychologicalCounselor: React.FC<AIPsychologicalCounselorProps> = ({ className }) => {
  const { t } = useTranslation()
  const { trackFeatureUsage, trackUserAction } = useAnalytics()
  const { user } = useAppStore()

  const [currentView, setCurrentView] = useState<'dashboard' | 'assessment' | 'session' | 'coping' | 'crisis'>('dashboard')
  const [moodHistory, setMoodHistory] = useState<MoodData[]>([])
  const [currentMoodEntry, setCurrentMoodEntry] = useState<Partial<MoodData>>({
    mood: 5,
    energy: 5,
    stress: 5,
    anxiety: 5,
    sleep: 7
  })
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, any>>({})
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isAssessmentComplete, setIsAssessmentComplete] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState<CopingStrategy | null>(null)
  const [strategyTimer, setStrategyTimer] = useState<number | null>(null)
  const [isStrategyActive, setIsStrategyActive] = useState(false)
  const [sessionHistory, setSessionHistory] = useState<TherapySession[]>([])
  const [currentSessionNotes, setCurrentSessionNotes] = useState('')
  const [aiPersonality, setAIPersonality] = useState<'empathetic' | 'analytical' | 'encouraging' | 'direct'>('empathetic')
  const [showCrisisWarning, setShowCrisisWarning] = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    trackFeatureUsage('ai_psychological_counselor')
    loadUserData()
  }, [trackFeatureUsage])

  const loadUserData = useCallback(() => {
    // 从localStorage加载用户数据
    const savedMoodHistory = localStorage.getItem('moodHistory')
    const savedSessions = localStorage.getItem('therapySessions')

    if (savedMoodHistory) {
      setMoodHistory(JSON.parse(savedMoodHistory))
    }

    if (savedSessions) {
      setSessionHistory(JSON.parse(savedSessions))
    }
  }, [])

  const saveMoodEntry = useCallback(() => {
    const newEntry: MoodData = {
      timestamp: Date.now(),
      mood: currentMoodEntry.mood || 5,
      energy: currentMoodEntry.energy || 5,
      stress: currentMoodEntry.stress || 5,
      anxiety: currentMoodEntry.anxiety || 5,
      sleep: currentMoodEntry.sleep || 7,
      notes: currentMoodEntry.notes,
      triggers: currentMoodEntry.triggers,
      activities: currentMoodEntry.activities
    }

    const updatedHistory = [newEntry, ...moodHistory.slice(0, 99)]
    setMoodHistory(updatedHistory)
    localStorage.setItem('moodHistory', JSON.stringify(updatedHistory))

    setCurrentMoodEntry({
      mood: 5,
      energy: 5,
      stress: 5,
      anxiety: 5,
      sleep: 7
    })

    trackUserAction('save_mood_entry', 'button', { mood: newEntry.mood, stress: newEntry.stress })

    // 检查是否需要显示危机警告
    if (newEntry.mood <= 2 || newEntry.anxiety >= 9 || newEntry.stress >= 9) {
      setShowCrisisWarning(true)
    }
  }, [currentMoodEntry, moodHistory, trackUserAction])

  const startAssessment = useCallback(() => {
    setCurrentView('assessment')
    setCurrentQuestionIndex(0)
    setAssessmentAnswers({})
    setIsAssessmentComplete(false)
    trackUserAction('start_assessment', 'button')
  }, [trackUserAction])

  const answerQuestion = useCallback((questionId: string, answer: any) => {
    setAssessmentAnswers(prev => ({ ...prev, [questionId]: answer }))
  }, [])

  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex < moodAssessmentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      completeAssessment()
    }
  }, [currentQuestionIndex])

  const completeAssessment = useCallback(() => {
    setIsAssessmentComplete(true)

    // 计算评估结果
    const results: AssessmentResult[] = [
      {
        category: 'mood',
        score: calculateCategoryScore('mood'),
        level: getCategoryLevel(calculateCategoryScore('mood')),
        description: '您的整体情绪状态',
        recommendations: generateRecommendations('mood', calculateCategoryScore('mood'))
      },
      {
        category: 'anxiety',
        score: calculateCategoryScore('anxiety'),
        level: getCategoryLevel(calculateCategoryScore('anxiety')),
        description: '您的焦虑水平',
        recommendations: generateRecommendations('anxiety', calculateCategoryScore('anxiety'))
      },
      {
        category: 'stress',
        score: calculateCategoryScore('stress'),
        level: getCategoryLevel(calculateCategoryScore('stress')),
        description: '您的压力状态',
        recommendations: generateRecommendations('stress', calculateCategoryScore('stress'))
      }
    ]

    setAssessmentResults(results)
    trackUserAction('complete_assessment', 'button', { results: results.length })

    // 检查是否有高风险结果
    const hasHighRisk = results.some(result => result.level === 'high' || result.level === 'severe')
    if (hasHighRisk) {
      setShowCrisisWarning(true)
    }
  }, [assessmentAnswers])

  const calculateCategoryScore = (category: string): number => {
    const categoryQuestions = moodAssessmentQuestions.filter(q => q.category === category)
    let totalScore = 0
    let answeredCount = 0

    categoryQuestions.forEach(question => {
      const answer = assessmentAnswers[question.id]
      if (answer !== undefined) {
        let score = 0

        if (question.type === 'scale') {
          score = answer
        } else if (question.type === 'multiple' && question.options) {
          score = (question.options.indexOf(answer) + 1) * 2
        } else if (question.type === 'boolean') {
          score = answer ? 8 : 2
        }

        totalScore += score
        answeredCount++
      }
    })

    return answeredCount > 0 ? Math.round(totalScore / answeredCount) : 5
  }

  const getCategoryLevel = (score: number): 'low' | 'moderate' | 'high' | 'severe' => {
    if (score <= 3) return 'low'
    if (score <= 5) return 'moderate'
    if (score <= 7) return 'high'
    return 'severe'
  }

  const generateRecommendations = (category: string, score: number): string[] => {
    const recommendations: Record<string, Record<string, string[]>> = {
      mood: {
        low: ['保持积极的生活习惯', '继续运动和社交活动'],
        moderate: ['尝试感恩练习', '保持规律的睡眠'],
        high: ['考虑寻求专业帮助', '使用认知重构技巧'],
        severe: ['立即寻求专业心理帮助', '联系心理危机干预热线']
      },
      anxiety: {
        low: ['继续保持良好的应对策略'],
        moderate: ['练习深呼吸和放松技巧'],
        high: ['尝试正念冥想', '减少咖啡因摄入'],
        severe: ['寻求专业治疗', '考虑药物治疗']
      },
      stress: {
        low: ['维持当前的压力管理策略'],
        moderate: ['学习时间管理', '增加休息时间'],
        high: ['重新评估优先级', '寻求社会支持'],
        severe: ['考虑减少工作负荷', '寻求专业帮助']
      }
    }

    const level = getCategoryLevel(score)
    return recommendations[category]?.[level] || ['建议咨询专业心理健康专家']
  }

  const startCopingStrategy = useCallback((strategy: CopingStrategy) => {
    setSelectedStrategy(strategy)
    setIsStrategyActive(true)
    setStrategyTimer(strategy.duration * 60) // Convert to seconds

    timerRef.current = setInterval(() => {
      setStrategyTimer(prev => {
        if (prev && prev > 0) {
          return prev - 1
        } else {
          setIsStrategyActive(false)
          return null
        }
      })
    }, 1000)

    trackUserAction('start_coping_strategy', 'button', { strategyId: strategy.id })
  }, [trackUserAction])

  const stopCopingStrategy = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsStrategyActive(false)
    setStrategyTimer(null)
    setSelectedStrategy(null)
  }, [])

  const startTherapySession = useCallback(() => {
    const session: TherapySession = {
      id: `session_${Date.now()}`,
      timestamp: Date.now(),
      duration: 0,
      type: 'regular',
      mood_before: currentMoodEntry.mood || 5,
      topics: [],
      insights: [],
      summary: '',
      aiPersonality
    }

    setCurrentView('session')
    setCurrentSessionNotes('')
    trackUserAction('start_therapy_session', 'button', { personality: aiPersonality })
  }, [currentMoodEntry.mood, aiPersonality, trackUserAction])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getMoodColor = (mood: number): string => {
    if (mood <= 3) return 'text-red-500'
    if (mood <= 5) return 'text-yellow-500'
    if (mood <= 7) return 'text-blue-500'
    return 'text-green-500'
  }

  const getMoodEmoji = (mood: number): string => {
    if (mood <= 2) return '😢'
    if (mood <= 4) return '😕'
    if (mood <= 6) return '😐'
    if (mood <= 8) return '😊'
    return '😄'
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Mood Entry */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-6 rounded-xl">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          今日心情记录
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          {[
            { key: 'mood', label: '心情', emoji: '😊', color: 'blue' },
            { key: 'energy', label: '精力', emoji: '⚡', color: 'yellow' },
            { key: 'stress', label: '压力', emoji: '😰', color: 'red' },
            { key: 'anxiety', label: '焦虑', emoji: '😟', color: 'orange' },
            { key: 'sleep', label: '睡眠(小时)', emoji: '😴', color: 'purple' }
          ].map(({ key, label, emoji, color }) => (
            <div key={key} className="text-center">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {emoji} {label}
              </label>
              <input
                type="range"
                min={key === 'sleep' ? 0 : 1}
                max={key === 'sleep' ? 12 : 10}
                step="1"
                value={(currentMoodEntry as any)[key] || (key === 'sleep' ? 7 : 5)}
                onChange={(e) => setCurrentMoodEntry(prev => ({
                  ...prev,
                  [key]: parseInt(e.target.value)
                }))}
                className="w-full"
              />
              <div className={`text-2xl font-bold text-${color}-500 mt-1`}>
                {(currentMoodEntry as any)[key] || (key === 'sleep' ? 7 : 5)}
                {key === 'sleep' ? 'h' : ''}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            今日备注（可选）
          </label>
          <textarea
            value={currentMoodEntry.notes || ''}
            onChange={(e) => setCurrentMoodEntry(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="记录您今天的感受、想法或发生的事情..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
          />
        </div>

        <button
          onClick={saveMoodEntry}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all font-medium"
        >
          保存今日心情
        </button>
      </div>

      {/* Mood History Chart */}
      {moodHistory.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            心情趋势 (最近7天)
          </h4>
          <div className="space-y-3">
            {moodHistory.slice(0, 7).map((entry, index) => (
              <div key={entry.timestamp} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getMoodEmoji(entry.mood)}</span>
                  <div>
                    <div className="font-medium">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </div>
                    {entry.notes && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {entry.notes.substring(0, 50)}...
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${getMoodColor(entry.mood)}`}>
                    心情: {entry.mood}/10
                  </div>
                  <div className="text-sm text-gray-500">
                    压力: {entry.stress}/10 | 焦虑: {entry.anxiety}/10
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={startAssessment}
          className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-center group"
        >
          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📊</div>
          <div className="font-medium text-gray-900 dark:text-gray-100">心理评估</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">了解您的心理状态</div>
        </button>

        <button
          onClick={() => setCurrentView('coping')}
          className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-center group"
        >
          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🧘</div>
          <div className="font-medium text-gray-900 dark:text-gray-100">应对策略</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">学习放松技巧</div>
        </button>

        <button
          onClick={startTherapySession}
          className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-center group"
        >
          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">💬</div>
          <div className="font-medium text-gray-900 dark:text-gray-100">AI对话</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">与AI心理师对话</div>
        </button>

        <button
          onClick={() => setCurrentView('crisis')}
          className="p-6 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors text-center group"
        >
          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🚨</div>
          <div className="font-medium text-red-700 dark:text-red-400">紧急求助</div>
          <div className="text-sm text-red-500 dark:text-red-400">危机干预资源</div>
        </button>
      </div>
    </div>
  )

  const renderAssessment = () => {
    if (isAssessmentComplete) {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              评估完成
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              以下是您的心理健康评估结果
            </p>
          </div>

          <div className="space-y-4">
            {assessmentResults.map((result, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {result.description}
                  </h4>
                  <span
                    className={cn(
                      'px-3 py-1 rounded-full text-sm font-medium',
                      result.level === 'low' && 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400',
                      result.level === 'moderate' && 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400',
                      result.level === 'high' && 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400',
                      result.level === 'severe' && 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400'
                    )}
                  >
                    {result.level === 'low' && '较低'}
                    {result.level === 'moderate' && '中等'}
                    {result.level === 'high' && '较高'}
                    {result.level === 'severe' && '严重'}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">评分</span>
                    <span className="font-medium">{result.score}/10</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={cn(
                        'h-2 rounded-full transition-all',
                        result.level === 'low' && 'bg-green-500',
                        result.level === 'moderate' && 'bg-yellow-500',
                        result.level === 'high' && 'bg-orange-500',
                        result.level === 'severe' && 'bg-red-500'
                      )}
                      style={{ width: `${(result.score / 10) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">建议：</h5>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {result.recommendations.map((rec, recIndex) => (
                      <li key={recIndex} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setCurrentView('coping')}
              className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              查看应对策略
            </button>
            <button
              onClick={() => setCurrentView('dashboard')}
              className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors font-medium"
            >
              返回首页
            </button>
          </div>
        </div>
      )
    }

    const currentQuestion = moodAssessmentQuestions[currentQuestionIndex]
    const currentAnswer = assessmentAnswers[currentQuestion.id]

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="flex gap-2">
              {moodAssessmentQuestions.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'w-3 h-3 rounded-full',
                    index <= currentQuestionIndex ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  )}
                />
              ))}
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            问题 {currentQuestionIndex + 1} / {moodAssessmentQuestions.length}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
            {currentQuestion.text}
          </h3>

          <div className="space-y-4">
            {currentQuestion.type === 'scale' && (
              <div>
                <input
                  type="range"
                  min={currentQuestion.min}
                  max={currentQuestion.max}
                  step="1"
                  value={currentAnswer || Math.floor((currentQuestion.min! + currentQuestion.max!) / 2)}
                  onChange={(e) => answerQuestion(currentQuestion.id, parseInt(e.target.value))}
                  className="w-full mb-4"
                />
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>很低 ({currentQuestion.min})</span>
                  <span className="font-medium text-lg text-blue-500">
                    {currentAnswer || Math.floor((currentQuestion.min! + currentQuestion.max!) / 2)}
                  </span>
                  <span>很高 ({currentQuestion.max})</span>
                </div>
              </div>
            )}

            {currentQuestion.type === 'multiple' && (
              <div className="space-y-2">
                {currentQuestion.options?.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => answerQuestion(currentQuestion.id, option)}
                    className={cn(
                      'w-full p-3 text-left rounded-lg border transition-all',
                      currentAnswer === option
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {currentQuestion.type === 'boolean' && (
              <div className="flex gap-4">
                <button
                  onClick={() => answerQuestion(currentQuestion.id, true)}
                  className={cn(
                    'flex-1 p-3 rounded-lg border transition-all font-medium',
                    currentAnswer === true
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  )}
                >
                  是
                </button>
                <button
                  onClick={() => answerQuestion(currentQuestion.id, false)}
                  className={cn(
                    'flex-1 p-3 rounded-lg border transition-all font-medium',
                    currentAnswer === false
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  )}
                >
                  否
                </button>
              </div>
            )}

            {currentQuestion.type === 'text' && (
              <textarea
                value={currentAnswer || ''}
                onChange={(e) => answerQuestion(currentQuestion.id, e.target.value)}
                placeholder="请输入您的回答..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
              />
            )}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className={cn(
              'px-6 py-3 rounded-lg font-medium transition-all',
              currentQuestionIndex === 0
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
            )}
          >
            上一题
          </button>

          <button
            onClick={nextQuestion}
            disabled={currentQuestion.required && currentAnswer === undefined}
            className={cn(
              'px-6 py-3 rounded-lg font-medium transition-all',
              currentQuestion.required && currentAnswer === undefined
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            )}
          >
            {currentQuestionIndex === moodAssessmentQuestions.length - 1 ? '完成评估' : '下一题'}
          </button>
        </div>
      </div>
    )
  }

  const renderCopingStrategies = () => (
    <div className="space-y-6">
      {selectedStrategy && isStrategyActive ? (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 p-6 rounded-xl text-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {selectedStrategy.title}
          </h3>

          <div className="text-4xl font-bold text-blue-500 mb-4">
            {strategyTimer !== null ? formatTime(strategyTimer) : ''}
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {selectedStrategy.description}
          </div>

          <div className="space-y-3 mb-6 text-left">
            {selectedStrategy.instructions.map((instruction, index) => (
              <div key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <p className="text-gray-700 dark:text-gray-300">{instruction}</p>
              </div>
            ))}
          </div>

          <button
            onClick={stopCopingStrategy}
            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            停止练习
          </button>
        </div>
      ) : (
        <>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              应对策略
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              选择适合您当前情况的放松和应对技巧
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {copingStrategies.map((strategy) => (
              <div key={strategy.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {strategy.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {strategy.description}
                    </p>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={cn(
                        'px-2 py-1 text-xs rounded-full',
                        strategy.difficulty === 'easy' && 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400',
                        strategy.difficulty === 'medium' && 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400',
                        strategy.difficulty === 'hard' && 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400'
                      )}>
                        {strategy.difficulty === 'easy' && '简单'}
                        {strategy.difficulty === 'medium' && '中等'}
                        {strategy.difficulty === 'hard' && '困难'}
                      </span>
                      <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-full">
                        {strategy.duration} 分钟
                      </span>
                    </div>
                  </div>
                </div>

                <details className="mb-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                    查看详细步骤
                  </summary>
                  <div className="mt-3 space-y-2">
                    {strategy.instructions.map((instruction, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <span className="flex-shrink-0 w-5 h-5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full flex items-center justify-center text-xs">
                          {index + 1}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">{instruction}</span>
                      </div>
                    ))}
                  </div>
                </details>

                <details className="mb-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                    效果和适用场景
                  </summary>
                  <div className="mt-3 space-y-2">
                    <div>
                      <h6 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">效果：</h6>
                      <div className="flex flex-wrap gap-1">
                        {strategy.benefits.map((benefit, index) => (
                          <span key={index} className="px-2 py-1 text-xs bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded">
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h6 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">适用场景：</h6>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {strategy.whenToUse.join('、')}
                      </div>
                    </div>
                  </div>
                </details>

                <button
                  onClick={() => startCopingStrategy(strategy)}
                  className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  开始练习
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex justify-center">
        <button
          onClick={() => setCurrentView('dashboard')}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors font-medium"
        >
          返回首页
        </button>
      </div>
    </div>
  )

  const renderCrisisResources = () => (
    <div className="space-y-6">
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-6 rounded-xl">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">
              如果您正在经历危机
            </h3>
            <p className="text-red-700 dark:text-red-300 mb-4">
              如果您有自伤或伤害他人的想法，请立即联系专业人士或拨打紧急电话。
            </p>
            <p className="text-sm text-red-600 dark:text-red-400">
              请记住，寻求帮助是勇敢的行为，您并不孤单。
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          危机干预资源
        </h3>
        <div className="space-y-4">
          {crisisResources.map((resource, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    {resource.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {resource.description}
                  </p>
                </div>
                <span className={cn(
                  'px-2 py-1 text-xs rounded-full flex-shrink-0',
                  resource.type === 'emergency' && 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400',
                  resource.type === 'hotline' && 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400',
                  resource.type === 'chat' && 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400',
                  resource.type === 'text' && 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400'
                )}>
                  {resource.type === 'emergency' && '紧急'}
                  {resource.type === 'hotline' && '热线'}
                  {resource.type === 'chat' && '在线'}
                  {resource.type === 'text' && '短信'}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">联系方式:</span>
                  <span className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {resource.contact}
                  </span>
                  <button
                    onClick={() => {
                      if (resource.contact.startsWith('http')) {
                        window.open(resource.contact, '_blank')
                      } else {
                        window.open(`tel:${resource.contact}`)
                      }
                      trackUserAction('use_crisis_resource', 'button', { resourceType: resource.type })
                    }}
                    className="text-sm text-blue-500 hover:text-blue-700 underline"
                  >
                    {resource.contact.startsWith('http') ? '访问' : '拨打'}
                  </button>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    <strong>服务时间:</strong> {resource.available}
                  </span>
                  <span>
                    <strong>语言:</strong> {resource.languages.join(', ')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-6 rounded-xl">
        <h4 className="font-semibold text-blue-800 dark:text-blue-400 mb-3">
          自我照顾提醒
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
          <li>• 确保基本需求得到满足（食物、水、睡眠）</li>
          <li>• 联系信任的朋友或家人</li>
          <li>• 避免独自一人，寻求陪伴</li>
          <li>• 移除可能造成伤害的物品</li>
          <li>• 尝试使用应对策略（深呼吸、冥想等）</li>
          <li>• 提醒自己这种感觉是暂时的</li>
        </ul>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => setCurrentView('dashboard')}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors font-medium"
        >
          返回首页
        </button>
      </div>
    </div>
  )

  // Crisis warning modal
  useEffect(() => {
    if (showCrisisWarning) {
      const timer = setTimeout(() => setShowCrisisWarning(false), 10000)
      return () => clearTimeout(timer)
    }
  }, [showCrisisWarning])

  return (
    <div className={cn("bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 relative", className)}>
      {/* Crisis Warning Modal */}
      {showCrisisWarning && (
        <div className="absolute inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center rounded-xl">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl max-w-md mx-4">
            <div className="text-center mb-4">
              <span className="text-4xl">🚨</span>
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mt-2">
                关注您的心理健康
              </h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-4 text-center">
              我们注意到您可能正在经历困难时期。如果您需要立即帮助，请不要犹豫联系专业人士。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCurrentView('crisis')
                  setShowCrisisWarning(false)
                }}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                查看求助资源
              </button>
              <button
                onClick={() => setShowCrisisWarning(false)}
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🧠</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                AI心理咨询师
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                您的个人心理健康助手
              </p>
            </div>
          </div>

          {currentView !== 'dashboard' && (
            <button
              onClick={() => setCurrentView('dashboard')}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              返回首页
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'assessment' && renderAssessment()}
        {currentView === 'coping' && renderCopingStrategies()}
        {currentView === 'crisis' && renderCrisisResources()}
      </div>
    </div>
  )
}

export default AIPsychologicalCounselor