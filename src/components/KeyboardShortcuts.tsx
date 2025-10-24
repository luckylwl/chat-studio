import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCommand as FiKeyboard, FiCommand, FiSettings, FiRefreshCw, FiSave, FiSearch, FiEdit3, FiTrash2, FiPlus, FiCheck, FiX, FiZap, FiTarget, FiLayers, FiMonitor, FiMic, FiUpload, FiDownload, FiCopy, FiPause, FiPlay, FiSkipBack, FiSkipForward } from 'react-icons/fi'

interface KeyboardShortcut {
  id: string
  category: 'general' | 'chat' | 'navigation' | 'editing' | 'advanced'
  name: string
  description: string
  keys: string[]
  action: string
  enabled: boolean
  customizable: boolean
  defaultKeys: string[]
}

interface ShortcutCategory {
  id: string
  name: string
  icon: React.ComponentType
  shortcuts: KeyboardShortcut[]
}

const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  // General
  {
    id: 'new-chat',
    category: 'general',
    name: 'New Chat',
    description: 'Start a new conversation',
    keys: ['Ctrl', 'N'],
    action: 'newChat',
    enabled: true,
    customizable: true,
    defaultKeys: ['Ctrl', 'N']
  },
  {
    id: 'search',
    category: 'general',
    name: 'Search',
    description: 'Open global search',
    keys: ['Ctrl', 'K'],
    action: 'search',
    enabled: true,
    customizable: true,
    defaultKeys: ['Ctrl', 'K']
  },
  {
    id: 'command-palette',
    category: 'general',
    name: 'Command Palette',
    description: 'Open command palette',
    keys: ['Ctrl', 'Shift', 'P'],
    action: 'commandPalette',
    enabled: true,
    customizable: true,
    defaultKeys: ['Ctrl', 'Shift', 'P']
  },
  {
    id: 'settings',
    category: 'general',
    name: 'Settings',
    description: 'Open settings panel',
    keys: ['Ctrl', ','],
    action: 'settings',
    enabled: true,
    customizable: true,
    defaultKeys: ['Ctrl', ',']
  },
  {
    id: 'toggle-sidebar',
    category: 'general',
    name: 'Toggle Sidebar',
    description: 'Show/hide sidebar',
    keys: ['Ctrl', 'B'],
    action: 'toggleSidebar',
    enabled: true,
    customizable: true,
    defaultKeys: ['Ctrl', 'B']
  },
  {
    id: 'focus-mode',
    category: 'general',
    name: 'Focus Mode',
    description: 'Toggle focus mode',
    keys: ['F11'],
    action: 'focusMode',
    enabled: true,
    customizable: true,
    defaultKeys: ['F11']
  },

  // Chat
  {
    id: 'send-message',
    category: 'chat',
    name: 'Send Message',
    description: 'Send the current message',
    keys: ['Ctrl', 'Enter'],
    action: 'sendMessage',
    enabled: true,
    customizable: true,
    defaultKeys: ['Ctrl', 'Enter']
  },
  {
    id: 'new-line',
    category: 'chat',
    name: 'New Line',
    description: 'Insert new line in message',
    keys: ['Shift', 'Enter'],
    action: 'newLine',
    enabled: true,
    customizable: false,
    defaultKeys: ['Shift', 'Enter']
  },
  {
    id: 'copy-last-response',
    category: 'chat',
    name: 'Copy Last Response',
    description: 'Copy the last AI response',
    keys: ['Ctrl', 'Shift', 'C'],
    action: 'copyLastResponse',
    enabled: true,
    customizable: true,
    defaultKeys: ['Ctrl', 'Shift', 'C']
  },
  {
    id: 'regenerate-response',
    category: 'chat',
    name: 'Regenerate Response',
    description: 'Regenerate last AI response',
    keys: ['Ctrl', 'R'],
    action: 'regenerateResponse',
    enabled: true,
    customizable: true,
    defaultKeys: ['Ctrl', 'R']
  },
  {
    id: 'voice-input',
    category: 'chat',
    name: 'Voice Input',
    description: 'Start/stop voice recording',
    keys: ['Ctrl', 'M'],
    action: 'voiceInput',
    enabled: true,
    customizable: true,
    defaultKeys: ['Ctrl', 'M']
  },
  {
    id: 'clear-chat',
    category: 'chat',
    name: 'Clear Chat',
    description: 'Clear current conversation',
    keys: ['Ctrl', 'Shift', 'Del'],
    action: 'clearChat',
    enabled: true,
    customizable: true,
    defaultKeys: ['Ctrl', 'Shift', 'Del']
  },

  // Navigation
  {
    id: 'next-chat',
    category: 'navigation',
    name: 'Next Chat',
    description: 'Switch to next chat',
    keys: ['Ctrl', 'Tab'],
    action: 'nextChat',
    enabled: true,
    customizable: true,
    defaultKeys: ['Ctrl', 'Tab']
  },
  {
    id: 'prev-chat',
    category: 'navigation',
    name: 'Previous Chat',
    description: 'Switch to previous chat',
    keys: ['Ctrl', 'Shift', 'Tab'],
    action: 'prevChat',
    enabled: true,
    customizable: true,
    defaultKeys: ['Ctrl', 'Shift', 'Tab']
  },
  {
    id: 'chat-1',
    category: 'navigation',
    name: 'Go to Chat 1',
    description: 'Switch to chat 1',
    keys: ['Ctrl', '1'],
    action: 'goToChat1',
    enabled: true,
    customizable: true,
    defaultKeys: ['Ctrl', '1']
  },
  {
    id: 'chat-2',
    category: 'navigation',
    name: 'Go to Chat 2',
    description: 'Switch to chat 2',
    keys: ['Ctrl', '2'],
    action: 'goToChat2',
    enabled: true,
    customizable: true,
    defaultKeys: ['Ctrl', '2']
  },
  {
    id: 'scroll-up',
    category: 'navigation',
    name: 'Scroll Up',
    description: 'Scroll chat up',
    keys: ['Page Up'],
    action: 'scrollUp',
    enabled: true,
    customizable: false,
    defaultKeys: ['Page Up']
  },
  {
    id: 'scroll-down',
    category: 'navigation',
    name: 'Scroll Down',
    description: 'Scroll chat down',
    keys: ['Page Down'],
    action: 'scrollDown',
    enabled: true,
    customizable: false,
    defaultKeys: ['Page Down']
  },

  // Editing
  {
    id: 'undo',
    category: 'editing',
    name: 'Undo',
    description: 'Undo last action',
    keys: ['Ctrl', 'Z'],
    action: 'undo',
    enabled: true,
    customizable: false,
    defaultKeys: ['Ctrl', 'Z']
  },
  {
    id: 'redo',
    category: 'editing',
    name: 'Redo',
    description: 'Redo last action',
    keys: ['Ctrl', 'Y'],
    action: 'redo',
    enabled: true,
    customizable: false,
    defaultKeys: ['Ctrl', 'Y']
  },
  {
    id: 'select-all',
    category: 'editing',
    name: 'Select All',
    description: 'Select all text',
    keys: ['Ctrl', 'A'],
    action: 'selectAll',
    enabled: true,
    customizable: false,
    defaultKeys: ['Ctrl', 'A']
  },
  {
    id: 'copy',
    category: 'editing',
    name: 'Copy',
    description: 'Copy selected text',
    keys: ['Ctrl', 'C'],
    action: 'copy',
    enabled: true,
    customizable: false,
    defaultKeys: ['Ctrl', 'C']
  },
  {
    id: 'paste',
    category: 'editing',
    name: 'Paste',
    description: 'Paste from clipboard',
    keys: ['Ctrl', 'V'],
    action: 'paste',
    enabled: true,
    customizable: false,
    defaultKeys: ['Ctrl', 'V']
  },
  {
    id: 'find',
    category: 'editing',
    name: 'Find in Chat',
    description: 'Find text in current chat',
    keys: ['Ctrl', 'F'],
    action: 'findInChat',
    enabled: true,
    customizable: true,
    defaultKeys: ['Ctrl', 'F']
  },

  // Advanced
  {
    id: 'export-chat',
    category: 'advanced',
    name: 'Export Chat',
    description: 'Export current chat',
    keys: ['Ctrl', 'E'],
    action: 'exportChat',
    enabled: true,
    customizable: true,
    defaultKeys: ['Ctrl', 'E']
  },
  {
    id: 'import-chat',
    category: 'advanced',
    name: 'Import Chat',
    description: 'Import chat file',
    keys: ['Ctrl', 'I'],
    action: 'importChat',
    enabled: true,
    customizable: true,
    defaultKeys: ['Ctrl', 'I']
  },
  {
    id: 'toggle-theme',
    category: 'advanced',
    name: 'Toggle Theme',
    description: 'Switch between themes',
    keys: ['Ctrl', 'Shift', 'T'],
    action: 'toggleTheme',
    enabled: true,
    customizable: true,
    defaultKeys: ['Ctrl', 'Shift', 'T']
  },
  {
    id: 'dev-tools',
    category: 'advanced',
    name: 'Developer Tools',
    description: 'Open developer console',
    keys: ['F12'],
    action: 'devTools',
    enabled: true,
    customizable: false,
    defaultKeys: ['F12']
  },
  {
    id: 'zoom-in',
    category: 'advanced',
    name: 'Zoom In',
    description: 'Increase interface zoom',
    keys: ['Ctrl', '+'],
    action: 'zoomIn',
    enabled: true,
    customizable: true,
    defaultKeys: ['Ctrl', '+']
  },
  {
    id: 'zoom-out',
    category: 'advanced',
    name: 'Zoom Out',
    description: 'Decrease interface zoom',
    keys: ['Ctrl', '-'],
    action: 'zoomOut',
    enabled: true,
    customizable: true,
    defaultKeys: ['Ctrl', '-']
  }
]

export default function KeyboardShortcuts() {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>(DEFAULT_SHORTCUTS)
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'customize' | 'help'>('shortcuts')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null)
  const [newKeys, setNewKeys] = useState<string[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showTooltip, setShowTooltip] = useState(true)
  const [shortcutStats, setShortcutStats] = useState({
    totalShortcuts: DEFAULT_SHORTCUTS.length,
    enabledShortcuts: DEFAULT_SHORTCUTS.filter(s => s.enabled).length,
    customizedShortcuts: 0,
    mostUsed: 'Ctrl+Enter'
  })

  const categories: ShortcutCategory[] = [
    {
      id: 'all',
      name: 'All Shortcuts',
      icon: FiKeyboard,
      shortcuts: shortcuts
    },
    {
      id: 'general',
      name: 'General',
      icon: FiZap,
      shortcuts: shortcuts.filter(s => s.category === 'general')
    },
    {
      id: 'chat',
      name: 'Chat',
      icon: FiTarget,
      shortcuts: shortcuts.filter(s => s.category === 'chat')
    },
    {
      id: 'navigation',
      name: 'Navigation',
      icon: FiLayers,
      shortcuts: shortcuts.filter(s => s.category === 'navigation')
    },
    {
      id: 'editing',
      name: 'Editing',
      icon: FiEdit3,
      shortcuts: shortcuts.filter(s => s.category === 'editing')
    },
    {
      id: 'advanced',
      name: 'Advanced',
      icon: FiSettings,
      shortcuts: shortcuts.filter(s => s.category === 'advanced')
    }
  ]

  const selectedCategoryData = categories.find(c => c.id === selectedCategory) || categories[0]

  const filteredShortcuts = selectedCategoryData.shortcuts.filter(shortcut =>
    shortcut.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shortcut.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shortcut.keys.join(' ').toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (isRecording) {
      event.preventDefault()
      const keys: string[] = []

      if (event.ctrlKey) keys.push('Ctrl')
      if (event.shiftKey) keys.push('Shift')
      if (event.altKey) keys.push('Alt')
      if (event.metaKey) keys.push('Cmd')

      if (!['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) {
        keys.push(event.key)
      }

      if (keys.length > 1 || (!event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey)) {
        setNewKeys(keys)
      }
    }
  }, [isRecording])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const startRecording = (shortcutId: string) => {
    setEditingShortcut(shortcutId)
    setIsRecording(true)
    setNewKeys([])
  }

  const stopRecording = () => {
    setIsRecording(false)
    if (editingShortcut && newKeys.length > 0) {
      setShortcuts(prev => prev.map(shortcut =>
        shortcut.id === editingShortcut
          ? { ...shortcut, keys: newKeys }
          : shortcut
      ))
    }
    setEditingShortcut(null)
    setNewKeys([])
  }

  const resetShortcut = (shortcutId: string) => {
    setShortcuts(prev => prev.map(shortcut =>
      shortcut.id === shortcutId
        ? { ...shortcut, keys: [...shortcut.defaultKeys] }
        : shortcut
    ))
  }

  const toggleShortcut = (shortcutId: string) => {
    setShortcuts(prev => prev.map(shortcut =>
      shortcut.id === shortcutId
        ? { ...shortcut, enabled: !shortcut.enabled }
        : shortcut
    ))
  }

  const exportShortcuts = () => {
    const shortcutData = JSON.stringify(shortcuts, null, 2)
    const blob = new Blob([shortcutData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'keyboard-shortcuts.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const resetAllShortcuts = () => {
    setShortcuts(DEFAULT_SHORTCUTS.map(s => ({ ...s })))
  }

  const formatKeys = (keys: string[]) => {
    return keys.map(key => {
      switch (key) {
        case 'Ctrl': return '⌃'
        case 'Shift': return '⇧'
        case 'Alt': return '⌥'
        case 'Cmd': return '⌘'
        case 'Enter': return '↵'
        case 'Tab': return '⇥'
        case 'Backspace': return '⌫'
        case 'Delete': return '⌦'
        case 'Escape': return '⎋'
        case 'ArrowUp': return '↑'
        case 'ArrowDown': return '↓'
        case 'ArrowLeft': return '←'
        case 'ArrowRight': return '→'
        case 'Page Up': return '⇞'
        case 'Page Down': return '⇟'
        case ' ': return 'Space'
        default: return key
      }
    }).join('')
  }

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-none p-6 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
              <FiKeyboard className="text-blue-400" />
              Keyboard Shortcuts
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Customize keyboard shortcuts for faster workflow
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>{shortcutStats.enabledShortcuts} Enabled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>{shortcutStats.customizedShortcuts} Custom</span>
              </div>
            </div>

            <button
              onClick={exportShortcuts}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              <FiDownload className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1">
          {[
            { id: 'shortcuts', label: 'Shortcuts', icon: FiKeyboard },
            { id: 'customize', label: 'Customize', icon: FiSettings },
            { id: 'help', label: 'Help & Tips', icon: FiTarget }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'shortcuts' && (
            <motion.div
              key="shortcuts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex"
            >
              {/* Categories Sidebar */}
              <div className="w-80 border-r border-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-800">
                  <div className="relative mb-4">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search shortcuts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-400 mb-3">Categories</h3>
                    <div className="space-y-1">
                      {categories.map(category => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                            selectedCategory === category.id
                              ? 'bg-blue-600/20 text-blue-400 border border-blue-600/50'
                              : 'hover:bg-gray-800 text-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <category.icon className="w-4 h-4" />
                            <span className="text-sm">{category.name}</span>
                          </div>
                          <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded">
                            {category.shortcuts.length}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Shortcuts List */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-3">
                  {filteredShortcuts.map(shortcut => (
                    <motion.div
                      key={shortcut.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-gray-800/50 rounded-lg p-4 border transition-all ${
                        shortcut.enabled ? 'border-gray-700' : 'border-gray-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className={`font-semibold ${shortcut.enabled ? 'text-white' : 'text-gray-500'}`}>
                              {shortcut.name}
                            </h3>
                            {!shortcut.customizable && (
                              <span className="text-xs bg-gray-600/20 text-gray-400 px-2 py-1 rounded">
                                System
                              </span>
                            )}
                          </div>
                          <p className={`text-sm ${shortcut.enabled ? 'text-gray-400' : 'text-gray-600'}`}>
                            {shortcut.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 ml-4">
                          {/* Keyboard Keys Display */}
                          <div className="flex items-center gap-1">
                            {shortcut.keys.map((key, index) => (
                              <React.Fragment key={key}>
                                <kbd className="px-3 py-1 bg-gray-700 text-white rounded text-sm font-mono border border-gray-600">
                                  {formatKeys([key])}
                                </kbd>
                                {index < shortcut.keys.length - 1 && (
                                  <span className="text-gray-500 text-sm">+</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={shortcut.enabled}
                                onChange={() => toggleShortcut(shortcut.id)}
                                className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                              />
                            </label>

                            {shortcut.customizable && (
                              <button
                                onClick={() => startRecording(shortcut.id)}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                                title="Customize shortcut"
                              >
                                <FiEdit3 className="w-4 h-4" />
                              </button>
                            )}

                            {shortcut.customizable && JSON.stringify(shortcut.keys) !== JSON.stringify(shortcut.defaultKeys) && (
                              <button
                                onClick={() => resetShortcut(shortcut.id)}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-orange-400"
                                title="Reset to default"
                              >
                                <FiRefreshCw className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'customize' && (
            <motion.div
              key="customize"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full p-6 overflow-y-auto"
            >
              <div className="max-w-2xl mx-auto space-y-8">
                {/* Global Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Global Settings</h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between">
                      <div>
                        <span className="text-white font-medium">Show Tooltips</span>
                        <p className="text-gray-400 text-sm">Display keyboard shortcut hints in tooltips</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={showTooltip}
                        onChange={(e) => setShowTooltip(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>

                {/* Bulk Actions */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Bulk Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={resetAllShortcuts}
                      className="flex items-center justify-center gap-2 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-600/30 px-4 py-3 rounded-lg transition-colors"
                    >
                      <FiRefreshCw className="w-4 h-4" />
                      Reset All to Default
                    </button>

                    <button
                      onClick={exportShortcuts}
                      className="flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/30 px-4 py-3 rounded-lg transition-colors"
                    >
                      <FiDownload className="w-4 h-4" />
                      Export Configuration
                    </button>
                  </div>
                </div>

                {/* Statistics */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-400">{shortcutStats.totalShortcuts}</div>
                      <div className="text-sm text-gray-400">Total Shortcuts</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-400">{shortcutStats.enabledShortcuts}</div>
                      <div className="text-sm text-gray-400">Enabled</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-400">{shortcutStats.customizedShortcuts}</div>
                      <div className="text-sm text-gray-400">Customized</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <div className="text-lg font-bold text-yellow-400">{shortcutStats.mostUsed}</div>
                      <div className="text-sm text-gray-400">Most Used</div>
                    </div>
                  </div>
                </div>

                {/* Key Recording Instructions */}
                {isRecording && (
                  <div className="bg-blue-600/20 border border-blue-600/50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <FiTarget className="w-5 h-5 text-blue-400" />
                      <h4 className="font-medium text-blue-400">Recording New Shortcut</h4>
                    </div>
                    <p className="text-blue-300 text-sm mb-3">
                      Press the key combination you want to use. Press Escape to cancel.
                    </p>
                    {newKeys.length > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm text-blue-300">Current keys:</span>
                        <div className="flex items-center gap-1">
                          {newKeys.map((key, index) => (
                            <React.Fragment key={key}>
                              <kbd className="px-2 py-1 bg-blue-600 text-white rounded text-sm">
                                {formatKeys([key])}
                              </kbd>
                              {index < newKeys.length - 1 && (
                                <span className="text-blue-300 text-sm">+</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={stopRecording}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm transition-colors"
                      >
                        <FiCheck className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsRecording(false)
                          setEditingShortcut(null)
                          setNewKeys([])
                        }}
                        className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded text-sm transition-colors"
                      >
                        <FiX className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'help' && (
            <motion.div
              key="help"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full p-6 overflow-y-auto"
            >
              <div className="max-w-3xl mx-auto space-y-8">
                {/* Quick Tips */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Quick Tips</h3>
                  <div className="grid gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-4 border-l-4 border-blue-500">
                      <h4 className="font-medium text-white mb-2">💡 Pro Tip: Command Palette</h4>
                      <p className="text-gray-400 text-sm">
                        Press <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Ctrl+Shift+P</kbd> to open the command palette and access all features quickly.
                      </p>
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-4 border-l-4 border-green-500">
                      <h4 className="font-medium text-white mb-2">⚡ Speed Up Your Workflow</h4>
                      <p className="text-gray-400 text-sm">
                        Use <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Ctrl+K</kbd> for global search and <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Ctrl+Tab</kbd> to switch between chats.
                      </p>
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-4 border-l-4 border-purple-500">
                      <h4 className="font-medium text-white mb-2">🎤 Voice Commands</h4>
                      <p className="text-gray-400 text-sm">
                        Press <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Ctrl+M</kbd> to start voice input and speak your message naturally.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Productivity Tips */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Productivity Tips</h3>
                  <div className="space-y-4">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-2">Message Editing</h4>
                      <ul className="text-gray-400 text-sm space-y-1">
                        <li>• <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Ctrl+Enter</kbd> - Send message</li>
                        <li>• <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Shift+Enter</kbd> - New line in message</li>
                        <li>• <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Ctrl+Z</kbd> - Undo changes</li>
                      </ul>
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-2">Navigation</h4>
                      <ul className="text-gray-400 text-sm space-y-1">
                        <li>• <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Ctrl+1-9</kbd> - Switch to specific chat</li>
                        <li>• <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Page Up/Down</kbd> - Scroll through messages</li>
                        <li>• <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Ctrl+B</kbd> - Toggle sidebar</li>
                      </ul>
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-2">Advanced Features</h4>
                      <ul className="text-gray-400 text-sm space-y-1">
                        <li>• <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Ctrl+R</kbd> - Regenerate AI response</li>
                        <li>• <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Ctrl+E</kbd> - Export current chat</li>
                        <li>• <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">F11</kbd> - Toggle focus mode</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Customization Guide */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Customization Guide</h3>
                  <div className="bg-gray-800/50 rounded-lg p-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-white mb-2">How to Customize Shortcuts</h4>
                        <ol className="text-gray-400 text-sm space-y-2 list-decimal list-inside">
                          <li>Go to the "Customize" tab</li>
                          <li>Click the edit button next to any customizable shortcut</li>
                          <li>Press your desired key combination</li>
                          <li>Click "Save" to confirm the change</li>
                        </ol>
                      </div>

                      <div>
                        <h4 className="font-medium text-white mb-2">Best Practices</h4>
                        <ul className="text-gray-400 text-sm space-y-1">
                          <li>• Use modifier keys (Ctrl, Shift, Alt) for custom shortcuts</li>
                          <li>• Avoid conflicting with system shortcuts</li>
                          <li>• Keep frequently used shortcuts simple and memorable</li>
                          <li>• Test shortcuts after customization to ensure they work</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}