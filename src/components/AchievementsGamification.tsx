import React, { useState, useEffect } from 'react'
import {
  Award, Trophy, Star, Target, Zap, TrendingUp,
  Lock, CheckCircle, Medal, Flame
} from 'lucide-react'
import { Achievement, UserStats, LeaderboardEntry } from '../types'
import { gamificationService } from '../services/advancedFeaturesService'
import toast from 'react-hot-toast'

export const AchievementsGamification: React.FC = () => {
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [activeTab, setActiveTab] = useState<'achievements' | 'stats' | 'leaderboard'>('achievements')
  const userId = 'current_user' // Replace with actual user ID

  useEffect(() => {
    loadGameData()
  }, [])

  const loadGameData = async () => {
    try {
      const stats = await gamificationService.getUserStats(userId)
      setUserStats(stats)

      const allAchievements = await gamificationService.getAllAchievements()
      setAchievements(allAchievements)

      // Mock leaderboard data
      setLeaderboard([
        { rank: 1, userId: 'user_123', userName: 'Alice Johnson', value: 2500, avatar: undefined },
        { rank: 2, userId: 'user_456', userName: 'Bob Smith', value: 2100, avatar: undefined },
        { rank: 3, userId: 'current_user', userName: 'You', value: 1850, avatar: undefined },
        { rank: 4, userId: 'user_789', userName: 'Charlie Brown', value: 1600, avatar: undefined },
        { rank: 5, userId: 'user_012', userName: 'Diana Prince', value: 1400, avatar: undefined }
      ])
    } catch (error) {
      console.error('Error loading gamification data:', error)
    }
  }

  const isAchievementUnlocked = (achievementId: string): boolean => {
    return userStats?.achievements.includes(achievementId) || false
  }

  const getLevelProgress = (): number => {
    if (!userStats) return 0
    const pointsForCurrentLevel = (userStats.level - 1) * 500
    const pointsForNextLevel = userStats.level * 500
    const progressInLevel = userStats.points - pointsForCurrentLevel
    const pointsNeededForLevel = pointsForNextLevel - pointsForCurrentLevel
    return (progressInLevel / pointsNeededForLevel) * 100
  }

  const getAchievementIcon = (category: string) => {
    switch (category) {
      case 'usage':
        return <Zap className="text-yellow-500" size={24} />
      case 'quality':
        return <Star className="text-blue-500" size={24} />
      case 'collaboration':
        return <Trophy className="text-purple-500" size={24} />
      case 'special':
        return <Medal className="text-pink-500" size={24} />
      default:
        return <Award className="text-gray-500" size={24} />
    }
  }

  const getRankMedal = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇'
      case 2:
        return '🥈'
      case 3:
        return '🥉'
      default:
        return `#${rank}`
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header with User Level */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Achievements & Progress</h2>
              <p className="text-blue-100">Track your journey and compete with others</p>
            </div>
            {userStats && (
              <div className="text-right">
                <div className="text-3xl font-bold">{userStats.points}</div>
                <div className="text-sm text-blue-100">Total Points</div>
              </div>
            )}
          </div>

          {/* Level Progress Bar */}
          {userStats && (
            <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Trophy size={20} />
                  <span className="font-semibold">Level {userStats.level}</span>
                </div>
                <span className="text-sm">
                  {userStats.points % 500} / 500 XP to Level {userStats.level + 1}
                </span>
              </div>
              <div className="w-full bg-white/30 rounded-full h-3">
                <div
                  className="bg-white rounded-full h-3 transition-all duration-500"
                  style={{ width: `${getLevelProgress()}%` }}
                />
              </div>

              {/* Streak */}
              {userStats.streak.current > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <Flame className="text-orange-300" size={16} />
                  <span className="text-sm">
                    {userStats.streak.current} day streak! 🔥
                    {userStats.streak.current === userStats.streak.longest && ' (Personal Record!)'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6">
        <div className="max-w-7xl mx-auto flex gap-4">
          {['achievements', 'stats', 'leaderboard'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'achievements' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Your Achievements
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Unlocked {userStats?.achievements.length || 0} of {achievements.length} achievements
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map(achievement => {
                  const isUnlocked = isAchievementUnlocked(achievement.id)
                  return (
                    <div
                      key={achievement.id}
                      className={`rounded-lg p-6 border-2 transition-all ${
                        isUnlocked
                          ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-400 dark:border-yellow-600'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-lg ${
                          isUnlocked ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          {isUnlocked ? (
                            getAchievementIcon(achievement.category)
                          ) : (
                            <Lock className="text-gray-400" size={24} />
                          )}
                        </div>
                        {isUnlocked && (
                          <CheckCircle className="text-green-500" size={20} />
                        )}
                      </div>

                      <div className="text-2xl mb-2">{achievement.icon}</div>

                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {achievement.name}
                      </h4>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {achievement.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                          +{achievement.reward} points
                        </span>
                        {!isUnlocked && (
                          <span className="text-xs text-gray-500">
                            {achievement.requirement.type.replace('_', ' ')}: {achievement.requirement.target}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'stats' && userStats && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Usage Statistics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {userStats.usage.totalConversations}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Total Conversations
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {userStats.usage.totalMessages}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Total Messages
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {(userStats.usage.totalTokens / 1000).toFixed(1)}K
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Total Tokens
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="text-3xl font-bold text-orange-600 mb-2">
                      ${userStats.usage.totalCost.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Total Cost
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Streak Information
                </h3>
                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-6 text-white">
                  <div className="flex items-center gap-4 mb-4">
                    <Flame size={48} />
                    <div>
                      <div className="text-4xl font-bold">
                        {userStats.streak.current} days
                      </div>
                      <div className="text-orange-100">Current Streak</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">
                        {userStats.streak.longest} days
                      </div>
                      <div className="text-sm text-orange-100">Longest Streak</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-orange-100">Last Active</div>
                      <div className="font-semibold">
                        {new Date(userStats.streak.lastActiveDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Top Performers
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  See how you rank against other users
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.userId}
                      className={`p-4 flex items-center gap-4 ${
                        entry.userId === userId
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : ''
                      }`}
                    >
                      <div className="text-2xl w-12 text-center font-bold">
                        {getRankMedal(entry.rank)}
                      </div>

                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {entry.userName.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {entry.userName}
                          {entry.userId === userId && (
                            <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {entry.value} points
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {entry.rank <= 3 && (
                          <Trophy className="text-yellow-500" size={20} />
                        )}
                        <TrendingUp className="text-green-500" size={16} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AchievementsGamification
