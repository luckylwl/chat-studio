/**
 * Learning Center Dashboard Component
 *
 * Comprehensive educational platform with courses, flashcards, and AI tutoring
 */

import React, { useState, useEffect } from 'react'
import {
  aiTutorService,
  coursePlatformService,
  flashcardSystemService,
  codePlaygroundService,
  progressTrackingService
} from '../services/learningEducationServices'
import type {
  TutorSession,
  Course,
  Flashcard,
  CodePlayground,
  LearningProgress
} from '../types/v4-types'

interface LearningCenterProps {
  userId: string
}

export const LearningCenter: React.FC<LearningCenterProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState<'courses' | 'flashcards' | 'tutor' | 'playground' | 'progress'>('courses')
  const [courses, setCourses] = useState<Course[]>([])
  const [flashcardDecks, setFlashcardDecks] = useState<Array<{ deckId: string; name: string; count: number }>>([])
  const [tutorSession, setTutorSession] = useState<TutorSession | null>(null)
  const [playgrounds, setPlaygrounds] = useState<CodePlayground[]>([])
  const [progress, setProgress] = useState<LearningProgress | null>(null)
  const [loading, setLoading] = useState(true)

  // Course state
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)

  // Flashcard state
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null)
  const [currentCard, setCurrentCard] = useState<Flashcard | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [deckCards, setDeckCards] = useState<Flashcard[]>([])

  // Tutor state
  const [tutorInput, setTutorInput] = useState('')
  const [tutorMessages, setTutorMessages] = useState<Array<{ role: 'user' | 'tutor'; content: string }>>([])

  // Playground state
  const [playgroundCode, setPlaygroundCode] = useState('')
  const [playgroundOutput, setPlaygroundOutput] = useState('')
  const [playgroundLanguage, setPlaygroundLanguage] = useState<'javascript' | 'python' | 'typescript' | 'java' | 'cpp' | 'go'>('javascript')

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load courses
      const allCourses = await coursePlatformService.getMyCourses(userId)
      setCourses(allCourses)

      // Load flashcard decks
      const decks = await flashcardSystemService.getDecks(userId)
      setFlashcardDecks(decks)

      // Load playgrounds
      const userPlaygrounds = await codePlaygroundService.getPlaygrounds(userId)
      setPlaygrounds(userPlaygrounds)

      // Load progress
      const userProgress = await progressTrackingService.getProgress(userId)
      setProgress(userProgress)

      setLoading(false)
    } catch (error) {
      console.error('Failed to load learning data:', error)
      setLoading(false)
    }
  }

  // Course functions
  const handleStartCourse = async (course: Course) => {
    setSelectedCourse(course)
    setCurrentLessonIndex(0)
    await coursePlatformService.enrollInCourse(userId, course.id)
  }

  const handleCompleteLesson = async () => {
    if (!selectedCourse) return

    const lesson = selectedCourse.lessons[currentLessonIndex]
    await coursePlatformService.completeLesson(userId, selectedCourse.id, lesson.id)

    if (currentLessonIndex < selectedCourse.lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1)
    } else {
      alert('Course completed!')
      setSelectedCourse(null)
    }
  }

  // Flashcard functions
  const handleSelectDeck = async (deckId: string) => {
    setSelectedDeck(deckId)
    const cards = await flashcardSystemService.getCardsForReview(userId, deckId, 10)
    setDeckCards(cards)
    if (cards.length > 0) {
      setCurrentCard(cards[0])
      setShowAnswer(false)
    }
  }

  const handleReviewCard = async (quality: number) => {
    if (!currentCard) return

    await flashcardSystemService.reviewCard(currentCard.id, quality)

    // Move to next card
    const nextIndex = deckCards.findIndex(c => c.id === currentCard.id) + 1
    if (nextIndex < deckCards.length) {
      setCurrentCard(deckCards[nextIndex])
      setShowAnswer(false)
    } else {
      alert('Review session complete!')
      setCurrentCard(null)
      setSelectedDeck(null)
    }
  }

  // Tutor functions
  const handleStartTutor = async () => {
    const session = await aiTutorService.startSession(userId, 'General Learning')
    setTutorSession(session)
    setTutorMessages([])
  }

  const handleSendToTutor = async () => {
    if (!tutorSession || !tutorInput.trim()) return

    const userMessage = tutorInput
    setTutorMessages([...tutorMessages, { role: 'user', content: userMessage }])
    setTutorInput('')

    const response = await aiTutorService.askQuestion(tutorSession.id, userMessage)
    setTutorMessages(prev => [...prev, { role: 'tutor', content: response }])
  }

  // Playground functions
  const handleCreatePlayground = async () => {
    const playground = await codePlaygroundService.createPlayground(userId, playgroundLanguage)
    setPlaygrounds([...playgrounds, playground])
  }

  const handleRunCode = async () => {
    try {
      const result = await codePlaygroundService.runCode(playgroundCode, playgroundLanguage)
      setPlaygroundOutput(result.output)
    } catch (error: any) {
      setPlaygroundOutput(`Error: ${error.message}`)
    }
  }

  const renderCoursesTab = () => (
    <div style={styles.tabContent}>
      {selectedCourse ? (
        <div style={styles.courseViewer}>
          <button style={styles.backButton} onClick={() => setSelectedCourse(null)}>
            ← Back to Courses
          </button>
          <h2 style={styles.courseTitle}>{selectedCourse.title}</h2>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${((currentLessonIndex + 1) / selectedCourse.lessons.length) * 100}%`
              }}
            />
          </div>
          <p style={styles.progressText}>
            Lesson {currentLessonIndex + 1} of {selectedCourse.lessons.length}
          </p>

          <div style={styles.lessonContent}>
            <h3>{selectedCourse.lessons[currentLessonIndex].title}</h3>
            <p>{selectedCourse.lessons[currentLessonIndex].content}</p>
          </div>

          <button style={styles.primaryButton} onClick={handleCompleteLesson}>
            {currentLessonIndex < selectedCourse.lessons.length - 1 ? 'Complete & Next' : 'Complete Course'}
          </button>
        </div>
      ) : (
        <div style={styles.courseGrid}>
          {courses.map(course => (
            <div key={course.id} style={styles.courseCard}>
              <div style={styles.courseHeader}>
                <h3 style={styles.courseCardTitle}>{course.title}</h3>
                <span style={styles.badge}>{course.level}</span>
              </div>
              <p style={styles.courseDescription}>{course.description}</p>
              <div style={styles.courseStats}>
                <span>📚 {course.lessons.length} lessons</span>
                <span>⏱️ {course.estimatedHours}h</span>
              </div>
              <button
                style={styles.primaryButton}
                onClick={() => handleStartCourse(course)}
              >
                Start Course
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderFlashcardsTab = () => (
    <div style={styles.tabContent}>
      {currentCard ? (
        <div style={styles.flashcardViewer}>
          <div style={styles.flashcardCard}>
            <div style={styles.flashcardSide}>
              <h3>Question</h3>
              <p style={styles.flashcardText}>{currentCard.front}</p>
            </div>

            {showAnswer && (
              <div style={styles.flashcardSide}>
                <h3>Answer</h3>
                <p style={styles.flashcardText}>{currentCard.back}</p>
              </div>
            )}
          </div>

          {!showAnswer ? (
            <button
              style={styles.primaryButton}
              onClick={() => setShowAnswer(true)}
            >
              Show Answer
            </button>
          ) : (
            <div style={styles.reviewButtons}>
              <button style={styles.reviewButton1} onClick={() => handleReviewCard(1)}>
                Hard
              </button>
              <button style={styles.reviewButton2} onClick={() => handleReviewCard(3)}>
                Good
              </button>
              <button style={styles.reviewButton3} onClick={() => handleReviewCard(5)}>
                Easy
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={styles.deckGrid}>
          {flashcardDecks.map(deck => (
            <div key={deck.deckId} style={styles.deckCard} onClick={() => handleSelectDeck(deck.deckId)}>
              <h3>{deck.name}</h3>
              <p style={styles.cardCount}>{deck.count} cards</p>
              <button style={styles.secondaryButton}>Start Review</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderTutorTab = () => (
    <div style={styles.tabContent}>
      {!tutorSession ? (
        <div style={styles.tutorStart}>
          <h2>AI Tutor</h2>
          <p>Start a personalized learning session with your AI tutor</p>
          <button style={styles.primaryButton} onClick={handleStartTutor}>
            Start Session
          </button>
        </div>
      ) : (
        <div style={styles.tutorChat}>
          <div style={styles.messageList}>
            {tutorMessages.map((msg, idx) => (
              <div
                key={idx}
                style={msg.role === 'user' ? styles.userMessage : styles.tutorMessage}
              >
                <strong>{msg.role === 'user' ? 'You' : 'Tutor'}:</strong>
                <p>{msg.content}</p>
              </div>
            ))}
          </div>
          <div style={styles.inputArea}>
            <input
              type="text"
              style={styles.input}
              value={tutorInput}
              onChange={(e) => setTutorInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendToTutor()}
              placeholder="Ask your tutor a question..."
            />
            <button style={styles.sendButton} onClick={handleSendToTutor}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  )

  const renderPlaygroundTab = () => (
    <div style={styles.tabContent}>
      <div style={styles.playgroundHeader}>
        <select
          style={styles.select}
          value={playgroundLanguage}
          onChange={(e) => setPlaygroundLanguage(e.target.value as any)}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="typescript">TypeScript</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="go">Go</option>
        </select>
        <button style={styles.primaryButton} onClick={handleRunCode}>
          ▶ Run Code
        </button>
        <button style={styles.secondaryButton} onClick={handleCreatePlayground}>
          Save Playground
        </button>
      </div>

      <div style={styles.playgroundContainer}>
        <div style={styles.codeEditor}>
          <h4>Code</h4>
          <textarea
            style={styles.textarea}
            value={playgroundCode}
            onChange={(e) => setPlaygroundCode(e.target.value)}
            placeholder={`Write your ${playgroundLanguage} code here...`}
          />
        </div>
        <div style={styles.codeOutput}>
          <h4>Output</h4>
          <pre style={styles.outputPre}>{playgroundOutput || 'Run code to see output...'}</pre>
        </div>
      </div>
    </div>
  )

  const renderProgressTab = () => (
    <div style={styles.tabContent}>
      {progress && (
        <div style={styles.progressDashboard}>
          <h2>Your Learning Progress</h2>

          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>📚</div>
              <div>
                <p style={styles.statLabel}>Courses Completed</p>
                <p style={styles.statValue}>{progress.coursesCompleted}</p>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>⏱️</div>
              <div>
                <p style={styles.statLabel}>Study Time</p>
                <p style={styles.statValue}>{progress.totalStudyTime}h</p>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>🎯</div>
              <div>
                <p style={styles.statLabel}>Flashcards Mastered</p>
                <p style={styles.statValue}>{progress.flashcardsReviewed}</p>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>🏆</div>
              <div>
                <p style={styles.statLabel}>Achievements</p>
                <p style={styles.statValue}>{progress.achievements.length}</p>
              </div>
            </div>
          </div>

          <div style={styles.achievementsSection}>
            <h3>Recent Achievements</h3>
            <div style={styles.achievementsList}>
              {progress.achievements.slice(0, 5).map(achievement => (
                <div key={achievement.id} style={styles.achievementBadge}>
                  <span style={styles.achievementIcon}>{achievement.icon}</span>
                  <div>
                    <p style={styles.achievementTitle}>{achievement.title}</p>
                    <p style={styles.achievementDesc}>{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  if (loading) {
    return <div style={styles.loading}>Loading learning center...</div>
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Learning Center</h1>
      </div>

      <div style={styles.tabs}>
        <button
          style={activeTab === 'courses' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('courses')}
        >
          📚 Courses
        </button>
        <button
          style={activeTab === 'flashcards' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('flashcards')}
        >
          🎯 Flashcards
        </button>
        <button
          style={activeTab === 'tutor' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('tutor')}
        >
          🤖 AI Tutor
        </button>
        <button
          style={activeTab === 'playground' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('playground')}
        >
          💻 Playground
        </button>
        <button
          style={activeTab === 'progress' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('progress')}
        >
          📊 Progress
        </button>
      </div>

      {activeTab === 'courses' && renderCoursesTab()}
      {activeTab === 'flashcards' && renderFlashcardsTab()}
      {activeTab === 'tutor' && renderTutorTab()}
      {activeTab === 'playground' && renderPlaygroundTab()}
      {activeTab === 'progress' && renderProgressTab()}
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
    marginBottom: '30px'
  },
  title: {
    fontSize: '36px',
    fontWeight: 'bold',
    margin: 0,
    color: '#1F2937'
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
  // Course styles
  courseGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px'
  },
  courseCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  courseHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  courseCardTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    margin: 0,
    color: '#1F2937'
  },
  badge: {
    padding: '4px 12px',
    background: '#DBEAFE',
    color: '#1E40AF',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600
  },
  courseDescription: {
    fontSize: '14px',
    color: '#6B7280',
    lineHeight: '1.5'
  },
  courseStats: {
    display: 'flex',
    gap: '16px',
    fontSize: '14px',
    color: '#6B7280'
  },
  courseViewer: {
    background: 'white',
    padding: '32px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB'
  },
  backButton: {
    padding: '8px 16px',
    background: '#F3F4F6',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    marginBottom: '20px'
  },
  courseTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '16px'
  },
  progressBar: {
    width: '100%',
    height: '8px',
    background: '#E5E7EB',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
    transition: 'width 0.3s'
  },
  progressText: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: '24px'
  },
  lessonContent: {
    padding: '24px',
    background: '#F9FAFB',
    borderRadius: '8px',
    marginBottom: '24px'
  },
  // Flashcard styles
  deckGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px'
  },
  deckCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  cardCount: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: '16px'
  },
  flashcardViewer: {
    maxWidth: '600px',
    margin: '0 auto',
    textAlign: 'center'
  },
  flashcardCard: {
    background: 'white',
    padding: '48px',
    borderRadius: '16px',
    border: '2px solid #E5E7EB',
    minHeight: '300px',
    marginBottom: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    justifyContent: 'center'
  },
  flashcardSide: {
    textAlign: 'center'
  },
  flashcardText: {
    fontSize: '20px',
    lineHeight: '1.6',
    color: '#1F2937'
  },
  reviewButtons: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center'
  },
  reviewButton1: {
    padding: '12px 32px',
    background: '#EF4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  reviewButton2: {
    padding: '12px 32px',
    background: '#F59E0B',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  reviewButton3: {
    padding: '12px 32px',
    background: '#10B981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  // Tutor styles
  tutorStart: {
    textAlign: 'center',
    padding: '100px 40px'
  },
  tutorChat: {
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    height: '600px',
    display: 'flex',
    flexDirection: 'column'
  },
  messageList: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  userMessage: {
    alignSelf: 'flex-end',
    maxWidth: '70%',
    padding: '12px 16px',
    background: '#3B82F6',
    color: 'white',
    borderRadius: '12px 12px 0 12px'
  },
  tutorMessage: {
    alignSelf: 'flex-start',
    maxWidth: '70%',
    padding: '12px 16px',
    background: '#F3F4F6',
    color: '#1F2937',
    borderRadius: '12px 12px 12px 0'
  },
  inputArea: {
    padding: '16px',
    borderTop: '1px solid #E5E7EB',
    display: 'flex',
    gap: '12px'
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px'
  },
  sendButton: {
    padding: '12px 24px',
    background: '#3B82F6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  // Playground styles
  playgroundHeader: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    alignItems: 'center'
  },
  select: {
    padding: '10px 16px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'white'
  },
  playgroundContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    height: '600px'
  },
  codeEditor: {
    display: 'flex',
    flexDirection: 'column'
  },
  codeOutput: {
    display: 'flex',
    flexDirection: 'column'
  },
  textarea: {
    flex: 1,
    padding: '16px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'monospace',
    resize: 'none'
  },
  outputPre: {
    flex: 1,
    padding: '16px',
    background: '#1F2937',
    color: '#10B981',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'monospace',
    overflow: 'auto',
    margin: 0
  },
  // Progress styles
  progressDashboard: {
    background: 'white',
    padding: '32px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '40px'
  },
  statCard: {
    background: '#F9FAFB',
    padding: '24px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  statIcon: {
    fontSize: '32px'
  },
  statLabel: {
    fontSize: '14px',
    color: '#6B7280',
    margin: '0 0 8px 0'
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: 0,
    color: '#1F2937'
  },
  achievementsSection: {
    marginTop: '32px'
  },
  achievementsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  achievementBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    background: '#F9FAFB',
    borderRadius: '12px',
    border: '1px solid #E5E7EB'
  },
  achievementIcon: {
    fontSize: '32px'
  },
  achievementTitle: {
    fontSize: '16px',
    fontWeight: 600,
    margin: '0 0 4px 0',
    color: '#1F2937'
  },
  achievementDesc: {
    fontSize: '14px',
    color: '#6B7280',
    margin: 0
  },
  // Button styles
  primaryButton: {
    padding: '12px 24px',
    background: '#3B82F6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  secondaryButton: {
    padding: '12px 24px',
    background: '#F3F4F6',
    color: '#1F2937',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer'
  }
}

export default LearningCenter
