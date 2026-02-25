import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react'
import { motion } from 'motion/react'
import './App.css'

const suggestionButtons = [
  { label: 'Homework help', icon: 'Homework' },
  { label: 'Study plan', icon: 'StudyPlan' },
  { label: 'Test prep', icon: 'TestPrep' },
  { label: 'Start research', icon: 'Research' },
  { label: 'Learn something', icon: 'LearnSomething' },
]

const COMPOSER_PROMPTS: Record<string, string> = {
  'Homework help': 'I need help with my homework on ',
  'Study plan': 'Help me create a study plan for ',
  'Test prep': 'Prepare me for a test in ',
  'Start research': 'I want to research ',
  'Learn something': 'I\'d like to learn about ',
}

interface FlashcardItem {
  term: string
  phonetic: string
  definition: string
  definitionNote: string
}

const GERMAN_FLASHCARDS: FlashcardItem[] = [
  { term: 'Guten Tag!', phonetic: 'goo-ten tahg', definition: 'Good day! / Hello!', definitionNote: 'A common greeting in German.' },
  { term: 'Guten Morgen', phonetic: 'goo-ten mor-gen', definition: 'Good morning', definitionNote: 'Used until around noon.' },
  { term: 'Guten Abend', phonetic: 'goo-ten ah-bent', definition: 'Good evening', definitionNote: 'Used in the evening.' },
  { term: 'Auf Wiedersehen', phonetic: 'owf vee-der-zay-en', definition: 'Goodbye', definitionNote: 'Formal way to say goodbye.' },
  { term: 'Tschüss', phonetic: 'chooss', definition: 'Bye (informal)', definitionNote: 'Casual farewell among friends.' },
  { term: 'Bitte', phonetic: 'bit-uh', definition: 'Please / You\'re welcome', definitionNote: 'Used for both please and you\'re welcome.' },
  { term: 'Danke', phonetic: 'dahn-kuh', definition: 'Thank you', definitionNote: 'Common way to express thanks.' },
  { term: 'Entschuldigung', phonetic: 'ent-shool-dee-goong', definition: 'Excuse me / Sorry', definitionNote: 'Used to apologize or get attention.' },
  { term: 'Ja', phonetic: 'yah', definition: 'Yes', definitionNote: '' },
  { term: 'Nein', phonetic: 'nine', definition: 'No', definitionNote: '' },
  { term: 'Ich heiße...', phonetic: 'ikh hye-suh', definition: 'My name is...', definitionNote: 'Introducing yourself.' },
  { term: 'Wie geht es Ihnen?', phonetic: 'vee gayt es ee-nen', definition: 'How are you? (formal)', definitionNote: 'Polite way to ask how someone is.' },
  { term: 'Es geht mir gut', phonetic: 'es gayt meer goot', definition: 'I\'m doing well', definitionNote: 'Common response to "How are you?"' },
  { term: 'Wo ist...?', phonetic: 'voh ist', definition: 'Where is...?', definitionNote: 'Asking for directions.' },
  { term: 'Der Bahnhof', phonetic: 'dayr bahn-hohf', definition: 'The train station', definitionNote: '' },
  { term: 'Das Flugzeug', phonetic: 'dahs floog-tsoyg', definition: 'The airplane', definitionNote: '' },
  { term: 'Ein Ticket, bitte', phonetic: 'ine tik-et bit-uh', definition: 'One ticket, please', definitionNote: 'Useful when traveling.' },
  { term: 'Wie viel kostet das?', phonetic: 'vee feel kos-tet dahs', definition: 'How much does that cost?', definitionNote: '' },
  { term: 'Ich verstehe nicht', phonetic: 'ikh fair-shtay-uh nikht', definition: 'I don\'t understand', definitionNote: 'Useful phrase when learning.' },
  { term: 'Sprechen Sie Englisch?', phonetic: 'shprekh-en zee eng-lish', definition: 'Do you speak English?', definitionNote: '' },
]

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [composerOpen, setComposerOpen] = useState(false)
  const [composerPrefix, setComposerPrefix] = useState('')
  const [composerSuffix, setComposerSuffix] = useState('')
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [classDropdownOpen, setClassDropdownOpen] = useState(false)
  const [selectedPowerUp, setSelectedPowerUp] = useState<string | null>(null)
  const [powerUpDropdownOpen, setPowerUpDropdownOpen] = useState(false)
  const [composerInputFocused, setComposerInputFocused] = useState(false)
  const [composerSomethingElse, setComposerSomethingElse] = useState(false)
  const [composerShowInfix, setComposerShowInfix] = useState(true)
  const [composerInfixText, setComposerInfixText] = useState('by')
  const [composerExiting, setComposerExiting] = useState(false)
  const [composerExitQuick, setComposerExitQuick] = useState(false)
  const [view, setView] = useState<'home' | 'test-prep-chat'>('home')
  const [testPrepClass, setTestPrepClass] = useState<string | null>(null)
  const [powerUpPanelOpen, setPowerUpPanelOpen] = useState(true)
  const [powerUpAsSidebar, setPowerUpAsSidebar] = useState(false)
  const [flashcardPanelWidth, setFlashcardPanelWidth] = useState(560)
  const [powerUpWidgetLeft, setPowerUpWidgetLeft] = useState<number | null>(null)
  const [powerUpWidgetTop, setPowerUpWidgetTop] = useState<number | null>(null)
  const [powerUpWidgetWidth, setPowerUpWidgetWidth] = useState(580)
  const [powerUpWidgetHeight, setPowerUpWidgetHeight] = useState(760)
  const [powerUpWidgetFullscreen, setPowerUpWidgetFullscreen] = useState(false)
  const [powerUpWidgetMinimized, setPowerUpWidgetMinimized] = useState(false)
  const [powerUpWidgetMinimizing, setPowerUpWidgetMinimizing] = useState(false)
  const [powerUpWidgetMinimizeAnimating, setPowerUpWidgetMinimizeAnimating] = useState(false)
  const [powerUpWidgetMinimizePreviewVisible, setPowerUpWidgetMinimizePreviewVisible] = useState(false)
  const [powerUpWidgetMinimizeStartRect, setPowerUpWidgetMinimizeStartRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null)
  const powerUpWidgetPrevRectRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null)
  const testPrepContentRef = useRef<HTMLDivElement>(null)
  const powerUpWidgetRef = useRef<HTMLDivElement>(null)
  const [testPrepCurrentCard, setTestPrepCurrentCard] = useState(1)
  const [testPrepTotalCards] = useState(20)
  const [testPrepKnownCount, setTestPrepKnownCount] = useState(0)
  const [flashcardFlipped, setFlashcardFlipped] = useState(false)
  const [flashcardExitDirection, setFlashcardExitDirection] = useState<'left' | 'right' | null>(null)
  const [testPrepIntroPhase, setTestPrepIntroPhase] = useState<'idle' | 'user' | 'typing' | 'actions' | 'composer' | 'panel' | 'done'>('idle')
  const [agentTypingIndex, setAgentTypingIndex] = useState(0)
  const [agentTypingLength, setAgentTypingLength] = useState(0)
  const [testPrepReplyInput, setTestPrepReplyInput] = useState('')
  const [timerWidgetOpen, setTimerWidgetOpen] = useState(false)
  const [timerDurationSeconds, setTimerDurationSeconds] = useState(300)
  const [timerRemainingSeconds, setTimerRemainingSeconds] = useState(300)
  const [timerPaused, setTimerPaused] = useState(false)
  const [timerLabel, setTimerLabel] = useState('STUDY')
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [timerWidgetLeft, setTimerWidgetLeft] = useState<number | null>(null)
  const [timerWidgetTop, setTimerWidgetTop] = useState<number | null>(null)
  const [timerWidgetWidth, setTimerWidgetWidth] = useState(220)
  const [timerWidgetHeight, setTimerWidgetHeight] = useState(220)
  const timerWidgetRef = useRef<HTMLDivElement>(null)
  const [timerWidgetMinimized, setTimerWidgetMinimized] = useState(false)
  const [timerWidgetMinimizing, setTimerWidgetMinimizing] = useState(false)
  const [timerWidgetMinimizeAnimating, setTimerWidgetMinimizeAnimating] = useState(false)
  const [timerWidgetMinimizeStartRect, setTimerWidgetMinimizeStartRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null)
  const [timerWidgetMinimizePhase, setTimerWidgetMinimizePhase] = useState<1 | 2 | null>(null)

  const TIMER_WIDGET_PADDING = 24
  const TIMER_WIDGET_MIN = 180
  const TIMER_WIDGET_MAX = 400

  const clampTimerWidgetInBounds = useCallback((left: number, top: number, w: number, h: number) => {
    const maxLeft = typeof window !== 'undefined' ? window.innerWidth - w - TIMER_WIDGET_PADDING : 0
    const maxTop = typeof window !== 'undefined' ? window.innerHeight - h - TIMER_WIDGET_PADDING : 0
    return {
      left: Math.max(TIMER_WIDGET_PADDING, Math.min(maxLeft, left)),
      top: Math.max(TIMER_WIDGET_PADDING, Math.min(maxTop, top)),
      w: Math.max(TIMER_WIDGET_MIN, Math.min(TIMER_WIDGET_MAX, w)),
      h: Math.max(TIMER_WIDGET_MIN, Math.min(TIMER_WIDGET_MAX, h)),
    }
  }, [])

  useLayoutEffect(() => {
    if (!timerWidgetOpen || timerWidgetLeft !== null) return
    if (typeof window === 'undefined') return
    setTimerWidgetLeft(TIMER_WIDGET_PADDING)
    setTimerWidgetTop(TIMER_WIDGET_PADDING)
  }, [timerWidgetOpen, timerWidgetLeft])

  const handleTimerWidgetDragStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.timer-widget-resize-handle') || (e.target as HTMLElement).closest('button')) return
    e.preventDefault()
    const widget = timerWidgetRef.current
    if (!widget) return
    const widgetRect = widget.getBoundingClientRect()
    let currentLeft = timerWidgetLeft ?? widgetRect.left
    let currentTop = timerWidgetTop ?? widgetRect.top
    if (timerWidgetLeft === null || timerWidgetTop === null) {
      setTimerWidgetLeft(currentLeft)
      setTimerWidgetTop(currentTop)
    }
    const startX = e.clientX - currentLeft
    const startY = e.clientY - currentTop
    const onMove = (e2: MouseEvent) => {
      const left = e2.clientX - startX
      const top = e2.clientY - startY
      const out = clampTimerWidgetInBounds(left, top, timerWidgetWidth, timerWidgetHeight)
      setTimerWidgetLeft(out.left)
      setTimerWidgetTop(out.top)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const handleTimerWidgetResizeStart = (e: React.MouseEvent, corner: 'se' | 'sw' | 'ne' | 'nw' | 'e' | 'w' | 'n' | 's') => {
    e.preventDefault()
    e.stopPropagation()
    const widget = timerWidgetRef.current
    if (!widget) return
    const widgetRect = widget.getBoundingClientRect()
    let startLeft = timerWidgetLeft ?? widgetRect.left
    let startTop = timerWidgetTop ?? widgetRect.top
    if (timerWidgetLeft === null || timerWidgetTop === null) {
      setTimerWidgetLeft(startLeft)
      setTimerWidgetTop(startTop)
    }
    const startX = e.clientX
    const startY = e.clientY
    const startW = timerWidgetWidth
    const startH = timerWidgetHeight
    const onMove = (e2: MouseEvent) => {
      const dx = e2.clientX - startX
      const dy = e2.clientY - startY
      let rawW = startW
      let rawH = startH
      if (corner.includes('e')) rawW = startW + dx
      if (corner.includes('w')) rawW = startW - dx
      if (corner.includes('s')) rawH = startH + dy
      if (corner.includes('n')) rawH = startH - dy
      const side = Math.max(TIMER_WIDGET_MIN, Math.min(TIMER_WIDGET_MAX, Math.max(rawW, rawH)))
      let left = startLeft
      let top = startTop
      if (corner.includes('w')) left = startLeft + startW - side
      if (corner.includes('n')) top = startTop + startH - side
      if (corner === 'e' || corner === 'w') top = startTop + (startH - side) / 2
      if (corner === 'n' || corner === 's') left = startLeft + (startW - side) / 2
      const out = clampTimerWidgetInBounds(left, top, side, side)
      setTimerWidgetLeft(out.left)
      setTimerWidgetTop(out.top)
      setTimerWidgetWidth(out.w)
      setTimerWidgetHeight(out.h)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const COMPOSER_EXIT_MS = 280
  const TYPING_MS_PER_CHAR = 28
  const POWERUP_PANEL_MIN = 380

  const agentIntroMessages = useMemo(() => [
    `I see you have a ${testPrepClass ?? 'German'} vocabulary test this Friday — let's make sure you're ready! 🎯`,
    "Auf geht's!",
    "I'll quiz you one flashcard at a time — your timer starts with the first card. Try to answer before checking, then I'll let you know if you're right."
  ], [testPrepClass])

  useEffect(() => {
    if (view !== 'test-prep-chat') {
      setTestPrepIntroPhase('idle')
      setAgentTypingIndex(0)
      setAgentTypingLength(0)
      return
    }
    if (testPrepIntroPhase === 'idle') {
      setPowerUpPanelOpen(false)
      setTestPrepIntroPhase('user')
      return
    }
  }, [view, testPrepIntroPhase])

  useEffect(() => {
    if (view !== 'test-prep-chat' || testPrepIntroPhase !== 'user') return
    const t = setTimeout(() => setTestPrepIntroPhase('typing'), 600)
    return () => clearTimeout(t)
  }, [view, testPrepIntroPhase])

  useEffect(() => {
    if (view !== 'test-prep-chat' || testPrepIntroPhase !== 'typing') return
    const len = agentIntroMessages[agentTypingIndex]?.length ?? 0
    if (agentTypingLength >= len) {
      if (agentTypingIndex >= 2) {
        setTestPrepIntroPhase('actions')
        return
      }
      setAgentTypingIndex((i) => i + 1)
      setAgentTypingLength(0)
      return
    }
    const t = setTimeout(() => setAgentTypingLength((n) => n + 1), TYPING_MS_PER_CHAR)
    return () => clearTimeout(t)
  }, [view, testPrepIntroPhase, agentTypingIndex, agentTypingLength, agentIntroMessages])

  useEffect(() => {
    if (view !== 'test-prep-chat' || testPrepIntroPhase !== 'actions') return
    const t = setTimeout(() => setTestPrepIntroPhase('composer'), 400)
    return () => clearTimeout(t)
  }, [view, testPrepIntroPhase])

  useEffect(() => {
    if (view !== 'test-prep-chat' || testPrepIntroPhase !== 'composer') return
    const t = setTimeout(() => {
      setTestPrepIntroPhase('panel')
      setPowerUpPanelOpen(true)
      setPowerUpWidgetMinimized(false)
    }, 500)
    return () => clearTimeout(t)
  }, [view, testPrepIntroPhase])

  useEffect(() => {
    if (view !== 'test-prep-chat' || testPrepIntroPhase !== 'panel') return
    const t = setTimeout(() => setTestPrepIntroPhase('done'), 50)
    return () => clearTimeout(t)
  }, [view, testPrepIntroPhase])

  const POWERUP_WIDGET_PADDING = 24
  const POWERUP_WIDGET_MIN_W = 320
  const POWERUP_WIDGET_MIN_H = 400
  const POWERUP_WIDGET_MAX_W = 720
  const POWERUP_WIDGET_MAX_H = 900

  const clampWidgetInBounds = useCallback((left: number, top: number, w: number, h: number) => {
    const maxLeft = typeof window !== 'undefined' ? window.innerWidth - w - POWERUP_WIDGET_PADDING : 0
    const maxTop = typeof window !== 'undefined' ? window.innerHeight - h - POWERUP_WIDGET_PADDING : 0
    return {
      left: Math.max(POWERUP_WIDGET_PADDING, Math.min(maxLeft, left)),
      top: Math.max(POWERUP_WIDGET_PADDING, Math.min(maxTop, top)),
      w: Math.max(POWERUP_WIDGET_MIN_W, Math.min(POWERUP_WIDGET_MAX_W, w)),
      h: Math.max(POWERUP_WIDGET_MIN_H, Math.min(POWERUP_WIDGET_MAX_H, h)),
    }
  }, [])

  useLayoutEffect(() => {
    if (!powerUpPanelOpen || powerUpWidgetLeft !== null) return
    if (typeof window === 'undefined') return
    const left = Math.max(POWERUP_WIDGET_PADDING, window.innerWidth - powerUpWidgetWidth - POWERUP_WIDGET_PADDING)
    const top = POWERUP_WIDGET_PADDING
    setPowerUpWidgetLeft(left)
    setPowerUpWidgetTop(top)
  }, [powerUpPanelOpen, powerUpWidgetLeft, powerUpWidgetWidth, powerUpWidgetHeight])

  const parseTimerDuration = useCallback((text: string): number => {
    const lower = text.toLowerCase()
    const minuteMatch = lower.match(/(\d+)\s*(minute|min|minutes?)\b/)
    if (minuteMatch) return Math.max(1, parseInt(minuteMatch[1], 10) * 60)
    const secondMatch = lower.match(/(\d+)\s*(second|sec|seconds?)\b/)
    if (secondMatch) return Math.max(1, parseInt(secondMatch[1], 10))
    const hourMatch = lower.match(/(\d+)\s*(hour|hr|hours?)\b/)
    if (hourMatch) return Math.max(1, parseInt(hourMatch[1], 10) * 3600)
    return 300
  }, [])

  const handleTestPrepReplySubmit = useCallback(() => {
    const trimmed = testPrepReplyInput.trim()
    if (!trimmed) return
    if (/timer/i.test(trimmed)) {
      const duration = parseTimerDuration(trimmed)
      setTimerDurationSeconds(duration)
      setTimerRemainingSeconds(duration)
      setTimerPaused(false)
      setTimerWidgetOpen(true)
      setTestPrepReplyInput('')
    }
  }, [testPrepReplyInput, parseTimerDuration])

  useEffect(() => {
    if (!timerWidgetOpen || timerPaused) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
      return
    }
    timerIntervalRef.current = setInterval(() => {
      setTimerRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current)
            timerIntervalRef.current = null
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
  }, [timerWidgetOpen, timerPaused])

  const handleWidgetDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    if ((e.target as HTMLElement).closest('.powerup-widget-resize-handle')) return
    const widget = powerUpWidgetRef.current
    if (!widget) return
    const widgetRect = widget.getBoundingClientRect()
    let currentLeft = powerUpWidgetLeft ?? widgetRect.left
    let currentTop = powerUpWidgetTop ?? widgetRect.top
    if (powerUpWidgetLeft === null || powerUpWidgetTop === null) {
      setPowerUpWidgetLeft(currentLeft)
      setPowerUpWidgetTop(currentTop)
    }
    const startX = e.clientX - currentLeft
    const startY = e.clientY - currentTop
    const onMove = (e2: MouseEvent) => {
      const left = e2.clientX - startX
      const top = e2.clientY - startY
      const out = clampWidgetInBounds(left, top, powerUpWidgetWidth, powerUpWidgetHeight)
      setPowerUpWidgetLeft(out.left)
      setPowerUpWidgetTop(out.top)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const handleWidgetResizeStart = (e: React.MouseEvent, corner: 'se' | 'sw' | 'ne' | 'nw' | 'e' | 'w' | 'n' | 's') => {
    e.preventDefault()
    e.stopPropagation()
    const widget = powerUpWidgetRef.current
    if (!widget) return
    const widgetRect = widget.getBoundingClientRect()
    let startLeft = powerUpWidgetLeft ?? widgetRect.left
    let startTop = powerUpWidgetTop ?? widgetRect.top
    if (powerUpWidgetLeft === null || powerUpWidgetTop === null) {
      setPowerUpWidgetLeft(startLeft)
      setPowerUpWidgetTop(startTop)
    }
    const startX = e.clientX
    const startY = e.clientY
    const startW = powerUpWidgetWidth
    const startH = powerUpWidgetHeight
    const onMove = (e2: MouseEvent) => {
      const dx = e2.clientX - startX
      const dy = e2.clientY - startY
      let left = startLeft
      let top = startTop
      let w = startW
      let h = startH
      if (corner.includes('e')) w = startW + dx
      if (corner.includes('w')) { left = startLeft + dx; w = startW - dx }
      if (corner.includes('s')) h = startH + dy
      if (corner.includes('n')) { top = startTop + dy; h = startH - dy }
      const out = clampWidgetInBounds(left, top, w, h)
      setPowerUpWidgetLeft(out.left)
      setPowerUpWidgetTop(out.top)
      setPowerUpWidgetWidth(out.w)
      setPowerUpWidgetHeight(out.h)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const FLASHCARD_PANEL_MIN = 320
  const FLASHCARD_PANEL_MAX = 720

  const handleFlashcardPanelResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startWidth = flashcardPanelWidth
    const onMove = (e2: MouseEvent) => {
      const dx = startX - e2.clientX
      const next = Math.max(FLASHCARD_PANEL_MIN, Math.min(FLASHCARD_PANEL_MAX, startWidth + dx))
      setFlashcardPanelWidth(next)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const handlePowerUpMinimizeToCircle = () => {
    const widget = powerUpWidgetRef.current
    if (!widget) return
    const rect = widget.getBoundingClientRect()
    setPowerUpWidgetMinimizeStartRect({ left: rect.left, top: rect.top, width: rect.width, height: rect.height })
    setPowerUpWidgetMinimizeAnimating(false)
    setPowerUpWidgetMinimizing(true)
    setTimeout(() => {
      setPowerUpWidgetMinimized(true)
      setPowerUpWidgetMinimizing(false)
      setPowerUpWidgetMinimizeAnimating(false)
      setPowerUpWidgetMinimizePreviewVisible(false)
      setPowerUpWidgetMinimizeStartRect(null)
    }, 580)
  }

  useLayoutEffect(() => {
    if (!powerUpWidgetMinimizing) return
    setPowerUpWidgetMinimizePreviewVisible(false)
    let id1: number | undefined
    const id2 = requestAnimationFrame(() => {
      id1 = requestAnimationFrame(() => {
        setPowerUpWidgetMinimizeAnimating(true)
        requestAnimationFrame(() => setPowerUpWidgetMinimizePreviewVisible(true))
      })
    })
    return () => {
      cancelAnimationFrame(id2)
      if (id1 !== undefined) cancelAnimationFrame(id1)
    }
  }, [powerUpWidgetMinimizing])

  const handlePowerUpRestoreFromCircle = () => {
    setPowerUpWidgetMinimized(false)
  }

  const handleTimerMinimizeToCircle = () => {
    const widget = timerWidgetRef.current
    if (!widget) return
    const rect = widget.getBoundingClientRect()
    setTimerWidgetMinimizeStartRect({ left: rect.left, top: rect.top, width: rect.width, height: rect.height })
    setTimerWidgetMinimizeAnimating(false)
    setTimerWidgetMinimizePhase(1)
    setTimerWidgetMinimizing(true)
    setTimeout(() => setTimerWidgetMinimizePhase(2), 280)
    setTimeout(() => {
      setTimerWidgetMinimized(true)
      setTimerWidgetMinimizing(false)
      setTimerWidgetMinimizeAnimating(false)
      setTimerWidgetMinimizeStartRect(null)
      setTimerWidgetMinimizePhase(null)
    }, 280 + 550)
  }

  useLayoutEffect(() => {
    if (!timerWidgetMinimizing) return
    let id1: number | undefined
    const id2 = requestAnimationFrame(() => {
      id1 = requestAnimationFrame(() => {
        setTimerWidgetMinimizeAnimating(true)
      })
    })
    return () => {
      cancelAnimationFrame(id2)
      if (id1 !== undefined) cancelAnimationFrame(id1)
    }
  }, [timerWidgetMinimizing])

  const handleTimerRestoreFromCircle = () => {
    setTimerWidgetMinimized(false)
  }

  const handlePowerUpFullscreenToggle = () => {
    if (powerUpWidgetFullscreen) {
      setPowerUpWidgetFullscreen(false)
      const prev = powerUpWidgetPrevRectRef.current
      if (prev) {
        setPowerUpWidgetLeft(prev.left)
        setPowerUpWidgetTop(prev.top)
        setPowerUpWidgetWidth(prev.width)
        setPowerUpWidgetHeight(prev.height)
        powerUpWidgetPrevRectRef.current = null
      }
    } else {
      const widget = powerUpWidgetRef.current
      if (!widget) return
      const widgetRect = widget.getBoundingClientRect()
      const left = powerUpWidgetLeft ?? widgetRect.left
      const top = powerUpWidgetTop ?? widgetRect.top
      powerUpWidgetPrevRectRef.current = { left, top, width: powerUpWidgetWidth, height: powerUpWidgetHeight }
      setPowerUpWidgetFullscreen(true)
    }
  }

  const COMPOSER_EXIT_QUICK_MS = 180

  const closeComposer = (quick = false) => {
    setComposerExitQuick(quick)
    setComposerExiting(true)
  }

  useEffect(() => {
    if (!composerExiting) return
    const duration = composerExitQuick ? COMPOSER_EXIT_QUICK_MS : COMPOSER_EXIT_MS
    const t = setTimeout(() => {
      setComposerOpen(false)
      setComposerExiting(false)
      setComposerExitQuick(false)
      setComposerSomethingElse(false)
      setComposerShowInfix(true)
      setComposerInfixText('by')
      if (!navigatingToTestPrepRef.current) {
        setSelectedClass(null)
        setSelectedPowerUp(null)
      }
      navigatingToTestPrepRef.current = false
    }, duration)
    return () => clearTimeout(t)
  }, [composerExiting, composerExitQuick])

  const CLASS_OPTIONS = [
    'English Language Arts',
    'Algebra I',
    'Physical Science',
    'Ancient Civilizations',
    'Health & PE',
    'Art',
    'German',
    'Computer Applications',
    'Home Economics',
  ]
  const POWERUP_OPTIONS = ['creating flashcards', 'using a graphing calculator', 'doodling and sketching', 'creating a document', 'creating an image', 'creating a mind map', 'creating a presentation']
  const classDropdownRef = useRef<HTMLDivElement>(null)
  const powerUpDropdownRef = useRef<HTMLDivElement>(null)
  const composerInputRef = useRef<HTMLTextAreaElement>(null)
  const navigatingToTestPrepRef = useRef(false)

  useEffect(() => {
    if (!classDropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (classDropdownRef.current && !classDropdownRef.current.contains(e.target as Node)) {
        setClassDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [classDropdownOpen])

  useEffect(() => {
    if (!powerUpDropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (powerUpDropdownRef.current && !powerUpDropdownRef.current.contains(e.target as Node)) {
        setPowerUpDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [powerUpDropdownOpen])

  useEffect(() => {
    const el = composerInputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [composerSuffix])

  const toolbarButtons = (
      <>
        <button className="icon-btn" aria-label="Tools">
          <img src="/assets/Language.svg" alt="" className="icon-img" />
        </button>
        <button className="icon-btn" aria-label="Accessibility">
          <img src="/assets/Accessibility.svg" alt="" className="icon-img" />
        </button>
        <button className="new-btn">
          <img src="/assets/NewMessage.svg" alt="" className="icon-img-sm" />
          New
        </button>
        <button className="icon-btn" aria-label="Menu">
          <img src="/assets/Menu.svg" alt="" className="icon-img-md" />
        </button>
      </>
    )

  const testPrepCurrentCardData = GERMAN_FLASHCARDS[Math.min(testPrepCurrentCard - 1, GERMAN_FLASHCARDS.length - 1)] ?? GERMAN_FLASHCARDS[0]

  return (
    <div className="app-shell">
      {/* Toolbar: on home, fixed top-right; on Test Prep chat, inside chat header so it stays at edge of chat experience */}
      {view !== 'test-prep-chat' && (
        <div className="toolbar-float">
          {toolbarButtons}
        </div>
      )}

      <div className="app-body">
          {/* Sidebar - floats over content, transparent bg */}
          <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
            <div className="sidebar-header">
              <img src="/assets/SchoolAI.svg" alt="schoolai" className="sidebar-logo" />
              <button
                className="sidebar-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
              >
                <img
                  src="/assets/Collapse.svg"
                  alt=""
                  className={`sidebar-toggle-icon ${!sidebarOpen ? 'sidebar-toggle-expand' : ''}`}
                />
              </button>
            </div>
            <div className="sidebar-nav">
              <button className="space-btn" title="Spaces">
                <img src="/assets/Spaces.svg" alt="" className="space-icon" />
                <span className="space-btn-label">Spaces</span>
              </button>
              <button className="space-btn active" title="Sidekick">
                <img src="/assets/Sidekick.svg" alt="" className="space-icon" />
                <span className="space-btn-label">Sidekick</span>
              </button>
              <button className="space-btn" title="Join a Space">
                <img src="/assets/JoinSpace.svg" alt="" className="space-icon" />
                <span className="space-btn-label">Join a Space</span>
              </button>
            </div>
            <div className="user-profile">
              <div className="avatar">
                <img
                  src="/assets/avatar.jpg"
                  alt="Annika"
                  className="avatar-img"
                  onError={(e) => {
                    const img = e.currentTarget
                    img.style.display = 'none'
                    const fallback = img.nextElementSibling as HTMLElement
                    fallback?.classList.remove('avatar-fallback-hidden')
                  }}
                />
                <span className="avatar-placeholder avatar-fallback-hidden" aria-hidden="true">A</span>
              </div>
              <div className="user-info">
                <span className="user-name">Annika</span>
                <span className="user-school">Skyridge High School</span>
              </div>
            </div>
          </aside>

          {/* Main content */}
          {view === 'test-prep-chat' ? (
            <main className="main-content test-prep-layout">
              {/* Full-width header: same position as before (Accessibility, Language, New, Menu) */}
              <header className="test-prep-chat-header test-prep-chat-header--full">
                <span className="test-prep-chat-title">
                  <span className="test-prep-chat-flag" aria-hidden="true">🇩🇪</span>
                  Prüfung Flashcards
                </span>
                <div className="test-prep-chat-header-toolbar">
                  {toolbarButtons}
                </div>
              </header>
              {/* Content: chat + floating PowerUp widget or sidebar */}
              <div className={`test-prep-chat-content-wrap ${powerUpAsSidebar ? 'test-prep-chat-content-wrap--with-sidebar' : ''}`} ref={testPrepContentRef}>
                <div className="test-prep-chat-experience">
                <div className="test-prep-chat-messages">
                  <div className={`chat-bubble chat-bubble--user test-prep-intro-user ${testPrepIntroPhase !== 'idle' ? 'test-prep-intro-user--animate' : ''}`}>
                    Help me prepare for a test in {testPrepClass ?? 'German'} using Flashcards and set a timer to see how quickly I'm able to complete them.
                  </div>
                  {testPrepIntroPhase !== 'idle' && (
                    <>
                      <div className="chat-bubble chat-bubble--assistant test-prep-intro-agent">
                        {agentTypingIndex > 0 ? agentIntroMessages[0] : agentIntroMessages[0].slice(0, agentTypingLength)}
                        {agentTypingIndex === 0 && agentTypingLength < agentIntroMessages[0].length && <span className="test-prep-typing-cursor" aria-hidden="true" />}
                      </div>
                      {agentTypingIndex >= 1 && (
                        <div className="chat-bubble chat-bubble--assistant test-prep-intro-agent">
                          {agentTypingIndex > 1 ? agentIntroMessages[1] : agentIntroMessages[1].slice(0, agentTypingLength)}
                          {agentTypingIndex === 1 && agentTypingLength < agentIntroMessages[1].length && <span className="test-prep-typing-cursor" aria-hidden="true" />}
                        </div>
                      )}
                      {agentTypingIndex >= 2 && (
                        <div className="chat-bubble chat-bubble--assistant test-prep-intro-agent">
                          {agentTypingIndex > 2 ? agentIntroMessages[2] : agentIntroMessages[2].slice(0, agentTypingLength)}
                          {agentTypingIndex === 2 && agentTypingLength < agentIntroMessages[2].length && <span className="test-prep-typing-cursor" aria-hidden="true" />}
                        </div>
                      )}
                    </>
                  )}
                  <div className={`test-prep-chat-actions test-prep-intro-actions ${testPrepIntroPhase >= 'actions' ? 'test-prep-intro-actions--animate' : ''}`}>
                    <button type="button" className="suggestion-btn test-prep-speak-btn">
                      <img src="/assets/Speak.svg" alt="" className="test-prep-action-icon" width={16} height={16} />
                      Speak
                    </button>
                    <button type="button" className="icon-btn test-prep-icon-btn" aria-label="Like"><img src="/assets/ThumbsUp.svg" alt="" width={16} height={16} /></button>
                    <button type="button" className="icon-btn test-prep-icon-btn" aria-label="Dislike"><img src="/assets/ThumbsDown.svg" alt="" width={16} height={16} /></button>
                    <button type="button" className="icon-btn test-prep-icon-btn" aria-label="Copy"><img src="/assets/Copy.svg" alt="" width={16} height={16} /></button>
                  </div>
                </div>
                <div className={`test-prep-composer-wrap test-prep-intro-composer ${testPrepIntroPhase >= 'composer' ? 'test-prep-intro-composer--animate' : ''}`}>
                  <div className="test-prep-composer">
                    <div className="test-prep-composer-top-row">
                      <input
                        type="text"
                        className="test-prep-reply-input"
                        placeholder="Reply..."
                        aria-label="Reply"
                        value={testPrepReplyInput}
                        onChange={(e) => setTestPrepReplyInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleTestPrepReplySubmit()
                          }
                        }}
                      />
                    </div>
                    <div className="composer-toolbar test-prep-composer-toolbar">
                      <div className="composer-toolbar-left">
                        <button type="button" className="composer-tool-btn" aria-label="Attach file"><img src="/assets/Paperclip.svg" alt="" className="composer-tool-icon" /></button>
                        <button type="button" className="composer-tool-btn" aria-label="Quick action"><img src="/assets/Lightningbolt.svg" alt="" className="composer-tool-icon" /></button>
                      </div>
                      <div className="composer-toolbar-right">
                        <button type="button" className="composer-icon-btn" aria-label="Voice input"><img src="/assets/Microphone.svg" alt="" className="composer-icon-img" /></button>
                        <button type="button" className="composer-send-btn" aria-label="Send" onClick={handleTestPrepReplySubmit}><img src="/assets/Paper_Airplane.svg" alt="" className="composer-send-icon" /></button>
                      </div>
                    </div>
                  </div>
                  <p className="composer-disclaimer test-prep-disclaimer">
                    AI can make mistakes, please verify important details. Your data is private and never shared. Teachers or school leaders may view messages to support your learning.
                  </p>
                </div>
              </div>

                {powerUpAsSidebar && powerUpPanelOpen && (
                  <aside className="test-prep-flashcard-sidebar" aria-label="Flashcards" style={{ width: flashcardPanelWidth }}>
                    <div
                      className="test-prep-flashcard-sidebar-resize"
                      onMouseDown={handleFlashcardPanelResizeStart}
                      role="separator"
                      aria-orientation="vertical"
                      aria-label="Resize panel"
                    />
                    <header className="test-prep-flashcard-header test-prep-flashcard-sidebar-header">
                      <button type="button" className="icon-btn test-prep-dismiss-btn" aria-label="Close panel" onClick={() => { setPowerUpAsSidebar(false); setPowerUpPanelOpen(false); }}>
                        <img src="/assets/Close.svg" alt="" width={20} height={20} />
                      </button>
                      <div className="test-prep-flashcard-header-center">
                        <div className="test-prep-flashcard-title-wrap">
                          <span className="test-prep-flashcard-icon-wrap" aria-hidden="true">
                            <img src="/assets/Flashcards.svg" alt="" className="test-prep-flashcard-icon" width={16} height={16} />
                          </span>
                          <span className="test-prep-flashcard-title">{testPrepClass ?? 'German'} Test: Greetings, Basics and Travel</span>
                        </div>
                        <button type="button" className="test-prep-edit-btn">Edit <img src="/assets/caret-down.svg" alt="" width={14} height={14} className="test-prep-edit-caret" /></button>
                      </div>
                    </header>
                    <div className="test-prep-flashcard-body test-prep-flashcard-sidebar-body">
                      <div className="test-prep-flashcard-scroll">
                        <div className="test-prep-flashcard-hero">
                          <img src="/assets/BrandenburgGate.jpg" alt="Brandenburg Gate, Berlin" className="test-prep-flashcard-hero-img" />
                        </div>
                        <div className="test-prep-flashcard-progress">
                          <div className="test-prep-flashcard-progress-left">
                            <div className="test-prep-flashcard-progress-ring" aria-hidden="true">
                              <svg width="24" height="24" viewBox="0 0 24 24" className="test-prep-progress-ring-svg">
                                <circle className="test-prep-progress-ring-track" cx="12" cy="12" r="10" fill="none" strokeWidth="2.5" />
                                <circle className="test-prep-progress-ring-fill" cx="12" cy="12" r="10" fill="none" strokeWidth="2.5" strokeDasharray={`${(testPrepCurrentCard / testPrepTotalCards) * 62.83} 62.83`} strokeLinecap="round" transform="rotate(-90 12 12)" />
                              </svg>
                            </div>
                            <span className="test-prep-flashcard-progress-text">{testPrepCurrentCard} of {testPrepTotalCards} cards</span>
                          </div>
                          <span className="test-prep-flashcard-progress-known">{Math.round((testPrepKnownCount / testPrepTotalCards) * 100)}% answers known</span>
                        </div>
                        <motion.div className={`test-prep-flashcard-card ${flashcardFlipped ? 'test-prep-flashcard-card--flipped' : ''}`} animate={{ x: flashcardExitDirection === 'left' ? '-130%' : flashcardExitDirection === 'right' ? '130%' : 0, y: flashcardExitDirection ? -20 : 0, rotate: flashcardExitDirection === 'left' ? -48 : flashcardExitDirection === 'right' ? 48 : 0, scale: flashcardExitDirection ? 0.82 : 1, opacity: flashcardExitDirection ? 0.2 : 1 }} transition={{ type: 'spring', stiffness: 320, damping: 26 }} onAnimationComplete={() => { if (flashcardExitDirection === 'left') { setTestPrepCurrentCard((c) => Math.min(testPrepTotalCards, c + 1)); setFlashcardFlipped(false); setFlashcardExitDirection(null); } else if (flashcardExitDirection === 'right') { setTestPrepCurrentCard((c) => Math.min(testPrepTotalCards, c + 1)); setTestPrepKnownCount((k) => Math.min(testPrepTotalCards, k + 1)); setFlashcardFlipped(false); setFlashcardExitDirection(null); } }} style={{ pointerEvents: flashcardExitDirection ? 'none' : undefined }}>
                          <div className="test-prep-flashcard-inner">
                            <div className="test-prep-flashcard-front">
                              <div className="test-prep-flashcard-card-actions"><button type="button" className="suggestion-btn test-prep-listen-btn"><img src="/assets/Audio.svg" alt="" className="test-prep-action-icon" width={16} height={16} /> Listen</button></div>
                              <div className="test-prep-flashcard-content"><p className="test-prep-flashcard-term">{testPrepCurrentCardData.term}</p><p className="test-prep-flashcard-phonetic">{testPrepCurrentCardData.phonetic}</p></div>
                              <button type="button" className="suggestion-btn test-prep-flip-btn" onClick={() => setFlashcardFlipped(true)}><img src="/assets/Flip.svg" alt="" className="test-prep-action-icon" width={16} height={16} /> Flip card</button>
                            </div>
                            <div className="test-prep-flashcard-back">
                              <div className="test-prep-flashcard-content test-prep-flashcard-back-content"><p className="test-prep-flashcard-term">{testPrepCurrentCardData.definition}</p>{testPrepCurrentCardData.definitionNote && <p className="test-prep-flashcard-phonetic">{testPrepCurrentCardData.definitionNote}</p>}</div>
                              <button type="button" className="suggestion-btn test-prep-flip-btn" onClick={() => setFlashcardFlipped(false)}><img src="/assets/Flip.svg" alt="" className="test-prep-action-icon" width={16} height={16} /> Flip card</button>
                            </div>
                          </div>
                        </motion.div>
                        <div className="test-prep-flashcard-controls">
                          <button type="button" className="test-prep-control-btn test-prep-control-edge" aria-label="Back" onClick={() => { setTestPrepCurrentCard((c) => Math.max(1, c - 1)); setFlashcardFlipped(false); }}><img src="/assets/Previous.svg" alt="" width={20} height={20} /></button>
                          <div className="test-prep-flashcard-controls-center">
                            <button type="button" className="test-prep-control-wrong" aria-label="Don't know" onClick={() => { if (flashcardExitDirection) return; setFlashcardExitDirection('left'); }}><img src="/assets/Close.svg" alt="" width={20} height={20} /></button>
                            <button type="button" className="test-prep-control-right" aria-label="Know" onClick={() => { if (flashcardExitDirection) return; setFlashcardExitDirection('right'); }}><img src="/assets/Check.svg" alt="" width={20} height={20} /></button>
                          </div>
                          <button type="button" className="test-prep-control-btn test-prep-control-edge" aria-label="Shuffle"><img src="/assets/Shuffle.svg" alt="" width={20} height={20} /></button>
                        </div>
                      </div>
                      <div className="test-prep-flashcard-footer">
                        <label className="test-prep-track-toggle"><input type="checkbox" defaultChecked className="test-prep-track-checkbox" /><span className="test-prep-track-label">Track Progress</span><span className="test-prep-track-switch" /></label>
                      </div>
                    </div>
                  </aside>
                )}
                {powerUpPanelOpen && !powerUpAsSidebar && (!powerUpWidgetMinimized || powerUpWidgetMinimizing) && (
                  <div
                    ref={powerUpWidgetRef}
                    className={`powerup-widget ${powerUpWidgetFullscreen ? 'powerup-widget--fullscreen' : ''} ${powerUpWidgetMinimizing && powerUpWidgetMinimizeAnimating ? 'powerup-widget--minimizing' : ''}`}
                    style={
                      powerUpWidgetFullscreen
                        ? undefined
                        : powerUpWidgetMinimizing && powerUpWidgetMinimizeStartRect
                          ? {
                              position: 'fixed',
                              left: powerUpWidgetMinimizeStartRect.left,
                              top: powerUpWidgetMinimizeStartRect.top,
                              width: powerUpWidgetMinimizeStartRect.width,
                              height: powerUpWidgetMinimizeStartRect.height,
                            }
                          : {
                              position: 'fixed',
                              zIndex: 50,
                              left: powerUpWidgetLeft ?? undefined,
                              top: (powerUpWidgetTop ?? POWERUP_WIDGET_PADDING),
                              right: powerUpWidgetLeft === null ? POWERUP_WIDGET_PADDING : undefined,
                              width: powerUpWidgetWidth,
                              height: powerUpWidgetHeight,
                            }
                    }
                  >
                    {powerUpWidgetMinimizing && powerUpWidgetMinimizeAnimating && (
                      <span
                        className={`powerup-widget-minimizing-preview ${powerUpWidgetMinimizePreviewVisible ? 'powerup-widget-minimizing-preview--visible' : ''}`}
                        style={{ backgroundImage: 'url(/assets/Flashcards_Closed.jpg)' }}
                        aria-hidden
                      />
                    )}
                    <div className="powerup-widget-drag-header" onMouseDown={handleWidgetDragStart}>
                      <header className="test-prep-flashcard-header">
                        <button type="button" className="icon-btn test-prep-dismiss-btn" aria-label="Close" onClick={() => { setPowerUpPanelOpen(false); setPowerUpWidgetMinimized(false); }}>
                          <img src="/assets/Close.svg" alt="" width={20} height={20} />
                        </button>
                        <button type="button" className="icon-btn test-prep-close-btn" aria-label="Minimize to corner" onClick={handlePowerUpMinimizeToCircle}>
                          <img src="/assets/minus.svg" alt="" width={20} height={20} />
                        </button>
                        <div className="test-prep-flashcard-header-center">
                          <div className="test-prep-flashcard-title-wrap">
                            <span className="test-prep-flashcard-icon-wrap" aria-hidden="true">
                              <img src="/assets/Flashcards.svg" alt="" className="test-prep-flashcard-icon" width={16} height={16} />
                            </span>
                            <span className="test-prep-flashcard-title">{testPrepClass ?? 'German'} Test: Greetings, Basics and Travel</span>
                          </div>
                          <button type="button" className="test-prep-edit-btn">Edit <img src="/assets/caret-down.svg" alt="" width={14} height={14} className="test-prep-edit-caret" /></button>
                        </div>
                        <button type="button" className="icon-btn test-prep-fullscreen-btn" aria-label={powerUpWidgetFullscreen ? 'Minimize' : 'Fullscreen'} onClick={handlePowerUpFullscreenToggle}>
                          <img src={powerUpWidgetFullscreen ? '/assets/Minimize.svg' : '/assets/Expand.svg'} alt="" width={20} height={20} />
                        </button>
                      </header>
                    </div>
                    <div className="test-prep-flashcard-body powerup-widget-body">
                      <div className="test-prep-flashcard-scroll">
                        <div className="test-prep-flashcard-hero">
                          <img src="/assets/BrandenburgGate.jpg" alt="Brandenburg Gate, Berlin" className="test-prep-flashcard-hero-img" />
                        </div>
                        <div className="test-prep-flashcard-progress">
                          <div className="test-prep-flashcard-progress-left">
                            <div className="test-prep-flashcard-progress-ring" aria-hidden="true">
                              <svg width="24" height="24" viewBox="0 0 24 24" className="test-prep-progress-ring-svg">
                                <circle className="test-prep-progress-ring-track" cx="12" cy="12" r="10" fill="none" strokeWidth="2.5" />
                                <circle
                                  className="test-prep-progress-ring-fill"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  fill="none"
                                  strokeWidth="2.5"
                                  strokeDasharray={`${(testPrepCurrentCard / testPrepTotalCards) * 62.83} 62.83`}
                                  strokeLinecap="round"
                                  transform="rotate(-90 12 12)"
                                />
                              </svg>
                            </div>
                            <span className="test-prep-flashcard-progress-text">{testPrepCurrentCard} of {testPrepTotalCards} cards</span>
                          </div>
                          <span className="test-prep-flashcard-progress-known">{Math.round((testPrepKnownCount / testPrepTotalCards) * 100)}% answers known</span>
                        </div>
                        <motion.div
                          className={`test-prep-flashcard-card ${flashcardFlipped ? 'test-prep-flashcard-card--flipped' : ''}`}
                          animate={{
                            x: flashcardExitDirection === 'left' ? '-130%' : flashcardExitDirection === 'right' ? '130%' : 0,
                            y: flashcardExitDirection ? -20 : 0,
                            rotate: flashcardExitDirection === 'left' ? -48 : flashcardExitDirection === 'right' ? 48 : 0,
                            scale: flashcardExitDirection ? 0.82 : 1,
                            opacity: flashcardExitDirection ? 0.2 : 1,
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 320,
                            damping: 26,
                          }}
                          onAnimationComplete={() => {
                            if (flashcardExitDirection === 'left') {
                              setTestPrepCurrentCard((c) => Math.min(testPrepTotalCards, c + 1))
                              setFlashcardFlipped(false)
                              setFlashcardExitDirection(null)
                            } else if (flashcardExitDirection === 'right') {
                              setTestPrepCurrentCard((c) => Math.min(testPrepTotalCards, c + 1))
                              setTestPrepKnownCount((k) => Math.min(testPrepTotalCards, k + 1))
                              setFlashcardFlipped(false)
                              setFlashcardExitDirection(null)
                            }
                          }}
                          style={{ pointerEvents: flashcardExitDirection ? 'none' : undefined }}
                        >
                          <div className="test-prep-flashcard-inner">
                            <div className="test-prep-flashcard-front">
                              <div className="test-prep-flashcard-card-actions">
                                <button type="button" className="suggestion-btn test-prep-listen-btn"><img src="/assets/Audio.svg" alt="" className="test-prep-action-icon" width={16} height={16} /> Listen</button>
                              </div>
                              <div className="test-prep-flashcard-content">
                                <p className="test-prep-flashcard-term">{testPrepCurrentCardData.term}</p>
                                <p className="test-prep-flashcard-phonetic">{testPrepCurrentCardData.phonetic}</p>
                              </div>
                              <button type="button" className="suggestion-btn test-prep-flip-btn" onClick={() => setFlashcardFlipped(true)}><img src="/assets/Flip.svg" alt="" className="test-prep-action-icon" width={16} height={16} /> Flip card</button>
                            </div>
                            <div className="test-prep-flashcard-back">
                              <div className="test-prep-flashcard-content test-prep-flashcard-back-content">
                                <p className="test-prep-flashcard-term">{testPrepCurrentCardData.definition}</p>
                                {testPrepCurrentCardData.definitionNote && (
                                  <p className="test-prep-flashcard-phonetic">{testPrepCurrentCardData.definitionNote}</p>
                                )}
                              </div>
                              <button type="button" className="suggestion-btn test-prep-flip-btn" onClick={() => setFlashcardFlipped(false)}><img src="/assets/Flip.svg" alt="" className="test-prep-action-icon" width={16} height={16} /> Flip card</button>
                            </div>
                          </div>
                        </motion.div>
                        <div className="test-prep-flashcard-controls">
                          <button type="button" className="test-prep-control-btn test-prep-control-edge" aria-label="Back" onClick={() => { setTestPrepCurrentCard((c) => Math.max(1, c - 1)); setFlashcardFlipped(false); }}><img src="/assets/Previous.svg" alt="" width={20} height={20} /></button>
                          <div className="test-prep-flashcard-controls-center">
                            <button type="button" className="test-prep-control-wrong" aria-label="Don't know" onClick={() => {
                              if (flashcardExitDirection) return
                              setFlashcardExitDirection('left')
                            }}><img src="/assets/Close.svg" alt="" width={20} height={20} /></button>
                            <button type="button" className="test-prep-control-right" aria-label="Know" onClick={() => {
                              if (flashcardExitDirection) return
                              setFlashcardExitDirection('right')
                            }}><img src="/assets/Check.svg" alt="" width={20} height={20} /></button>
                          </div>
                          <button type="button" className="test-prep-control-btn test-prep-control-edge" aria-label="Shuffle"><img src="/assets/Shuffle.svg" alt="" width={20} height={20} /></button>
                        </div>
                      </div>
                      <div className="test-prep-flashcard-footer">
                        <span
                          className="test-prep-footer-corner-hint"
                          role="button"
                          tabIndex={0}
                          aria-label="Resize widget"
                          onMouseDown={(e) => {
                            e.stopPropagation()
                            handleWidgetResizeStart(e, 'sw')
                          }}
                        >
                          <img src="/assets/CornerDrag.svg" alt="" className="test-prep-corner-drag-icon-footer" width={24} height={24} />
                        </span>
                        <label className="test-prep-track-toggle">
                          <input type="checkbox" defaultChecked className="test-prep-track-checkbox" />
                          <span className="test-prep-track-label">Track Progress</span>
                          <span className="test-prep-track-switch" />
                        </label>
                      </div>
                    </div>
                    {!powerUpWidgetFullscreen && (
                      <>
                        <div className="powerup-widget-resize-handle powerup-widget-resize-se powerup-widget-resize-corner" onMouseDown={(e) => handleWidgetResizeStart(e, 'se')} aria-label="Resize widget" />
                        <div className="powerup-widget-resize-handle powerup-widget-resize-sw" onMouseDown={(e) => handleWidgetResizeStart(e, 'sw')} aria-label="Resize" />
                        <div className="powerup-widget-resize-handle powerup-widget-resize-ne" onMouseDown={(e) => handleWidgetResizeStart(e, 'ne')} aria-label="Resize" />
                        <div className="powerup-widget-resize-handle powerup-widget-resize-nw" onMouseDown={(e) => handleWidgetResizeStart(e, 'nw')} aria-label="Resize" />
                        <div className="powerup-widget-resize-handle powerup-widget-resize-e" onMouseDown={(e) => handleWidgetResizeStart(e, 'e')} aria-label="Resize" />
                        <div className="powerup-widget-resize-handle powerup-widget-resize-w" onMouseDown={(e) => handleWidgetResizeStart(e, 'w')} aria-label="Resize" />
                        <div className="powerup-widget-resize-handle powerup-widget-resize-n" onMouseDown={(e) => handleWidgetResizeStart(e, 'n')} aria-label="Resize" />
                        <div className="powerup-widget-resize-handle powerup-widget-resize-s" onMouseDown={(e) => handleWidgetResizeStart(e, 's')} aria-label="Resize" />
                      </>
                    )}
                  </div>
                )}
                {powerUpPanelOpen && !powerUpAsSidebar && powerUpWidgetMinimized && !powerUpWidgetMinimizing && (
                  <div className="powerup-minimized-circle-wrap">
                    <div className="powerup-minimized-circle-tooltip" role="tooltip">
                      German Vocab Flashcards
                    </div>
                    <button
                      type="button"
                      className="powerup-minimized-circle"
                      onClick={handlePowerUpRestoreFromCircle}
                      aria-label="Open flashcards"
                    >
                      <span className="powerup-minimized-circle-img" style={{ backgroundImage: 'url(/assets/Flashcards_Closed.jpg)' }} />
                    </button>
                    <button
                      type="button"
                      className="powerup-minimized-circle-close"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPowerUpPanelOpen(false)
                        setPowerUpWidgetMinimized(false)
                      }}
                      aria-label="Dismiss"
                    >
                      <img src="/assets/Close_Small.svg" alt="" width={28} height={28} />
                    </button>
                  </div>
                )}
                {view === 'test-prep-chat' && (
                  <div className="test-prep-flashcard-tab-bar" role="tablist" aria-label="Flashcard view">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={powerUpPanelOpen && !powerUpAsSidebar}
                      className={`test-prep-flashcard-tab ${powerUpPanelOpen && !powerUpAsSidebar ? 'test-prep-flashcard-tab--active' : ''}`}
                      onClick={() => { setPowerUpAsSidebar(false); setPowerUpPanelOpen(true); }}
                    >
                      Widget
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={powerUpPanelOpen && powerUpAsSidebar}
                      className={`test-prep-flashcard-tab ${powerUpPanelOpen && powerUpAsSidebar ? 'test-prep-flashcard-tab--active' : ''}`}
                      onClick={() => { setPowerUpAsSidebar(true); setPowerUpPanelOpen(true); }}
                    >
                      Panel
                    </button>
                  </div>
                )}
                {timerWidgetOpen && view === 'test-prep-chat' && (!timerWidgetMinimized || timerWidgetMinimizing) && (
                  <div
                    ref={timerWidgetRef}
                    className={`timer-widget ${timerWidgetMinimizing && timerWidgetMinimizeAnimating && timerWidgetMinimizePhase === 1 ? 'timer-widget--minimizing-phase1' : ''} ${timerWidgetMinimizing && timerWidgetMinimizeAnimating && timerWidgetMinimizePhase === 2 ? 'timer-widget--minimizing-phase2' : ''}`}
                    style={{
                      ...(timerWidgetMinimizing && timerWidgetMinimizeStartRect
                        ? timerWidgetMinimizePhase === 2
                          ? {
                              position: 'fixed',
                              left: 'calc(100vw - 24px - 72px)',
                              top: powerUpWidgetMinimized ? 'calc(100vh - 176px)' : 'calc(100vh - 96px)',
                              width: 72,
                              height: 72,
                            }
                          : {
                              position: 'fixed',
                              left: timerWidgetMinimizeStartRect.left,
                              top: timerWidgetMinimizeStartRect.top,
                              width: timerWidgetMinimizeStartRect.width,
                              height: timerWidgetMinimizeStartRect.height,
                            }
                        : {
                            position: 'fixed',
                            zIndex: 50,
                            left: timerWidgetLeft ?? TIMER_WIDGET_PADDING,
                            top: timerWidgetTop ?? TIMER_WIDGET_PADDING,
                            width: timerWidgetWidth,
                            height: timerWidgetHeight,
                          }),
                    }}
                  >
                    {timerWidgetMinimizing && timerWidgetMinimizeAnimating && (
                      <span className="timer-widget-minimizing-preview" aria-hidden />
                    )}
                    <div
                      className="timer-widget-card"
                      onMouseDown={handleTimerWidgetDragStart}
                    >
                      <button type="button" className="timer-widget-icon-btn timer-widget-close" aria-label="Close" onClick={(e) => { e.stopPropagation(); setTimerWidgetOpen(false); }}>
                        <img src="/assets/Close.svg" alt="" width={18} height={18} />
                      </button>
                      <button type="button" className="timer-widget-icon-btn timer-widget-minimize" aria-label="Minimize" onClick={(e) => { e.stopPropagation(); handleTimerMinimizeToCircle(); }}>
                        <img src="/assets/minus.svg" alt="" width={20} height={20} />
                      </button>
                      <button type="button" className="timer-widget-icon-btn timer-widget-bell" aria-label="Alarm">
                        <img src="/assets/Bell.svg" alt="" width={20} height={20} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('timer-widget-fallback-hidden'); }} />
                        <svg className="timer-widget-fallback-icon timer-widget-fallback-hidden" width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M8 2a4 4 0 0 1 4 4v2.5l.5.5H14v1H2v-1h1.5l.5-.5V6a4 4 0 0 1 4-4zM6 12h4a2 2 0 0 1-4 0z" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>
                      </button>
                      <button type="button" className="timer-widget-icon-btn timer-widget-settings" aria-label="Settings">
                        <img src="/assets/Settings.svg" alt="" width={18} height={18} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/Menu.svg'; }} />
                      </button>
                      <div className="timer-widget-ring-wrap">
                        <svg className="timer-widget-ring-svg" viewBox="0 0 102 102" aria-hidden>
                          <circle className="timer-widget-ring-track" cx="51" cy="51" r="43" fill="none" strokeWidth="5" />
                          <circle
                            className="timer-widget-ring-fill"
                            cx="51"
                            cy="51"
                            r="43"
                            fill="none"
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={`${timerDurationSeconds > 0 ? (timerRemainingSeconds / timerDurationSeconds) * 270 : 0} 270`}
                            transform="rotate(-90 51 51)"
                          />
                        </svg>
                        <div className="timer-widget-glass" aria-hidden />
                        <div className="timer-widget-center">
                          <div className="timer-widget-center-icon" aria-hidden>
                            <img src="/assets/Book.svg" alt="" width={24} height={24} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/assets/Flashcards.svg'; }} />
                          </div>
                          <div className="timer-widget-time">
                            {`${String(Math.floor(timerRemainingSeconds / 60)).padStart(2, '0')}:${String(timerRemainingSeconds % 60).padStart(2, '0')}`}
                          </div>
                          <div className="timer-widget-label">{timerLabel}</div>
                          <button
                            type="button"
                            className="timer-widget-icon-btn timer-widget-play-pause"
                            aria-label={timerPaused ? 'Resume' : 'Pause'}
                            onClick={(e) => { e.stopPropagation(); setTimerPaused((p) => !p); }}
                          >
                            {timerPaused ? (
                              <img src="/assets/Play.svg" alt="" width={20} height={20} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('timer-widget-fallback-hidden'); }} />
                            ) : (
                              <img src="/assets/Pause.svg" alt="" width={20} height={20} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('timer-widget-fallback-hidden'); }} />
                            )}
                            <span className="timer-widget-fallback-icon timer-widget-fallback-hidden">
                              {timerPaused ? (
                                <svg width="20" height="20" viewBox="0 0 10 14" fill="currentColor" aria-hidden><path d="M0 0v14l10-7L0 0z"/></svg>
                              ) : (
                                <svg width="20" height="20" viewBox="0 0 12 14" fill="currentColor" aria-hidden><path d="M2 0h3v14H2V0zm5 0h3v14H7V0z"/></svg>
                              )}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="timer-widget-resize-handle timer-widget-resize-se" onMouseDown={(e) => handleTimerWidgetResizeStart(e, 'se')} aria-label="Resize" />
                    <div className="timer-widget-resize-handle timer-widget-resize-sw" onMouseDown={(e) => handleTimerWidgetResizeStart(e, 'sw')} aria-label="Resize" />
                    <div className="timer-widget-resize-handle timer-widget-resize-ne" onMouseDown={(e) => handleTimerWidgetResizeStart(e, 'ne')} aria-label="Resize" />
                    <div className="timer-widget-resize-handle timer-widget-resize-nw" onMouseDown={(e) => handleTimerWidgetResizeStart(e, 'nw')} aria-label="Resize" />
                    <div className="timer-widget-resize-handle timer-widget-resize-e" onMouseDown={(e) => handleTimerWidgetResizeStart(e, 'e')} aria-label="Resize" />
                    <div className="timer-widget-resize-handle timer-widget-resize-w" onMouseDown={(e) => handleTimerWidgetResizeStart(e, 'w')} aria-label="Resize" />
                    <div className="timer-widget-resize-handle timer-widget-resize-n" onMouseDown={(e) => handleTimerWidgetResizeStart(e, 'n')} aria-label="Resize" />
                    <div className="timer-widget-resize-handle timer-widget-resize-s" onMouseDown={(e) => handleTimerWidgetResizeStart(e, 's')} aria-label="Resize" />
                  </div>
                )}
                {timerWidgetOpen && view === 'test-prep-chat' && timerWidgetMinimized && !timerWidgetMinimizing && (
                  <div
                    className="timer-minimized-circle-wrap"
                    style={{ bottom: powerUpWidgetMinimized ? 104 : 24 }}
                  >
                    <div className="timer-minimized-circle-tooltip" role="tooltip">
                      Study timer
                    </div>
                    <button
                      type="button"
                      className="timer-minimized-circle"
                      onClick={handleTimerRestoreFromCircle}
                      aria-label="Open timer"
                    >
                      <span className="timer-minimized-circle-time">
                        {`${String(Math.floor(timerRemainingSeconds / 60)).padStart(2, '0')}:${String(timerRemainingSeconds % 60).padStart(2, '0')}`}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="timer-minimized-circle-close"
                      onClick={(e) => {
                        e.stopPropagation()
                        setTimerWidgetOpen(false)
                        setTimerWidgetMinimized(false)
                      }}
                      aria-label="Dismiss timer"
                    >
                      <img src="/assets/Close_Small.svg" alt="" width={28} height={28} />
                    </button>
                  </div>
                )}
              </div>
            </main>
          ) : (
          <main className="main-content">
            {/* AI gradient - always visible, including behind composer */}
            <img src="/assets/AIGradient.svg" alt="" className="gradient-bg" aria-hidden="true" />
            {!composerOpen && (
              <>
                <div className="content-inner">
                  <h1 className="greeting">Hi, Annika!</h1>
                  <p className="instruction">Pick a starting point and I'll guide you step by step.</p>
                  <div className="suggestion-buttons">
                    {suggestionButtons.slice(0, 3).map((btn) => (
                      <button
                        key={btn.label}
                        className="suggestion-btn"
                        onClick={() => {
                          setComposerSomethingElse(false)
                          setComposerShowInfix(true)
                          setComposerInfixText('by')
                          setComposerPrefix(COMPOSER_PROMPTS[btn.label] ?? '')
                          setComposerSuffix('')
                          setSelectedClass(null)
                          setSelectedPowerUp(null)
                          setComposerOpen(true)
                        }}
                      >
                        <img src={`/assets/${btn.icon}.svg`} alt="" className="suggestion-icon" />
                        {btn.label}
                      </button>
                    ))}
                  </div>
                  <div className="suggestion-buttons">
                    {suggestionButtons.slice(3).map((btn) => (
                      <button
                        key={btn.label}
                        className="suggestion-btn"
                        onClick={() => {
                          setComposerSomethingElse(false)
                          setComposerShowInfix(true)
                          setComposerInfixText('by')
                          setComposerPrefix(COMPOSER_PROMPTS[btn.label] ?? '')
                          setComposerSuffix('')
                          setSelectedClass(null)
                          setSelectedPowerUp(null)
                          setComposerOpen(true)
                        }}
                      >
                        <img src={`/assets/${btn.icon}.svg`} alt="" className="suggestion-icon" />
                        {btn.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="something-else"
                    onClick={() => {
                      setComposerSomethingElse(true)
                      setComposerShowInfix(true)
                      setComposerInfixText('by')
                      setComposerPrefix('')
                      setComposerSuffix('')
                      setSelectedClass(null)
                      setSelectedPowerUp(null)
                      setComposerOpen(true)
                    }}
                  >
                    Or, ask anything
                  </button>
                </div>
              </>
            )}

            {/* Composer window - completely replaces content when open */}
            {(composerOpen || composerExiting) && (
              <div
                className={`composer-overlay ${composerExiting ? 'composer-overlay--exiting' : ''} ${composerExiting && composerExitQuick ? 'composer-overlay--exiting-quick' : ''}`}
                onClick={composerExiting ? undefined : () => closeComposer(true)}
              >
                <div className="composer-overlay-content" onClick={(e) => e.stopPropagation()}>
                <div className={`composer-card ${composerExiting ? 'composer-card--exiting' : ''} ${composerExiting && composerExitQuick ? 'composer-card--exiting-quick' : ''}`}>
                  <div className="composer-input-row">
                    <div className="composer-inline-prompt">
                      {!composerSomethingElse && (
                        <>
                      <span className="composer-prompt-prefix">{composerPrefix}</span>
                      <div className="composer-choose-class-wrap" ref={classDropdownRef}>
                        <button
                          type="button"
                          className="composer-choose-class"
                          onClick={() => setClassDropdownOpen(!classDropdownOpen)}
                          aria-expanded={classDropdownOpen}
                          aria-haspopup="listbox"
                        >
                          <span className="composer-choose-class-text">{selectedClass ?? 'Class'}</span>
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 5l3 3 3-3" />
                          </svg>
                        </button>
                        {classDropdownOpen && (
                          <div className="class-select-menu">
                            <ul className="class-select-menu-inner" role="listbox">
                              {CLASS_OPTIONS.map((cls) => (
                                <li
                                  key={cls}
                                  role="option"
                                  aria-selected={cls === selectedClass}
                                  className={`class-select-option ${cls === selectedClass ? 'class-select-option--selected' : ''}`}
                                  onClick={() => {
                                    setSelectedClass(cls)
                                    setComposerShowInfix(true)
                                    setComposerInfixText('by')
                                    setClassDropdownOpen(false)
                                  }}
                                >
                                  {cls}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      {composerShowInfix && composerInfixText.length > 0 && <span className="composer-prompt-infix">{composerInfixText}</span>}
                      <div className="composer-choose-class-wrap" ref={powerUpDropdownRef}>
                        <button
                          type="button"
                          className="composer-choose-class"
                          onClick={() => setPowerUpDropdownOpen(!powerUpDropdownOpen)}
                          aria-expanded={powerUpDropdownOpen}
                          aria-haspopup="listbox"
                        >
                          <span className="composer-choose-class-text">{selectedPowerUp ?? 'PowerUp'}</span>
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 5l3 3 3-3" />
                          </svg>
                        </button>
                        {powerUpDropdownOpen && (
                          <div className="class-select-menu">
                            <ul className="class-select-menu-inner" role="listbox">
                              {POWERUP_OPTIONS.map((opt) => (
                                <li
                                  key={opt}
                                  role="option"
                                  aria-selected={opt === selectedPowerUp}
                                  className={`class-select-option ${opt === selectedPowerUp ? 'class-select-option--selected' : ''}`}
                                  onClick={() => {
                                    setSelectedPowerUp(opt)
                                    setPowerUpDropdownOpen(false)
                                  }}
                                >
                                  {opt}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                        </>
                      )}
                      <div className="composer-input-wrap">
                        <textarea
                          ref={composerInputRef}
                          className="composer-input"
                          value={composerSuffix}
                          onChange={(e) => setComposerSuffix(e.target.value)}
                          onFocus={() => setComposerInputFocused(true)}
                          onBlur={() => setComposerInputFocused(false)}
                          onKeyDown={(e) => {
                            if (e.key !== 'Backspace') return
                            const target = e.target as HTMLTextAreaElement
                            const atStart = target.selectionStart === 0 && target.selectionEnd === 0
                            if (composerSuffix.length > 0 || !atStart) return
                            e.preventDefault()
                            if (!composerSomethingElse && selectedPowerUp) {
                              setSelectedPowerUp(null)
                              return
                            }
                            if (!composerSomethingElse && composerInfixText.length > 0) {
                              if (composerInfixText.length === 1) setComposerShowInfix(false)
                              setComposerInfixText((prev) => prev.slice(0, -1))
                              return
                            }
                            if (!composerSomethingElse && selectedClass) {
                              setSelectedClass(null)
                              return
                            }
                            if (composerPrefix.length > 0) {
                              setComposerPrefix((prev) => prev.slice(0, -1))
                              return
                            }
                          }}
                          placeholder=""
                          rows={1}
                        />
                        {!composerSuffix && !composerInputFocused && (
                          <span className="composer-hint">
                            {composerSomethingElse ? 'What would you like to learn about...' : 'and...'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="composer-toolbar">
                    <div className="composer-toolbar-left">
                      <button type="button" className="composer-tool-btn" aria-label="Attach file">
                        <img src="/assets/Paperclip.svg" alt="" className="composer-tool-icon" />
                      </button>
                      <button type="button" className="composer-tool-btn" aria-label="Quick action">
                        <img src="/assets/Lightningbolt.svg" alt="" className="composer-tool-icon" />
                      </button>
                    </div>
                    <div className="composer-toolbar-right">
                      <button type="button" className="composer-icon-btn" aria-label="Voice input">
                        <img src="/assets/Microphone.svg" alt="" className="composer-icon-img" />
                      </button>
                      <button
                        type="button"
                        className={`composer-send-btn ${!composerSomethingElse && !selectedClass ? 'composer-send-btn--no-class' : ''}`}
                        aria-label="Send"
                        onClick={() => {
                          if (!composerSomethingElse && selectedClass && selectedPowerUp && composerPrefix === COMPOSER_PROMPTS['Test prep']) {
                            navigatingToTestPrepRef.current = true
                            setTestPrepClass(selectedClass)
                            setView('test-prep-chat')
                            setSidebarOpen(false)
                            closeComposer(true)
                          } else {
                            closeComposer(false)
                          }
                        }}
                      >
                        <img src="/assets/Paper_Airplane.svg" alt="" className="composer-send-icon" />
                      </button>
                    </div>
                  </div>
                </div>
                <p className="composer-disclaimer">
                  AI can make mistakes, please verify important details. Your data is private and never shared. Teachers or school leaders may view messages to support your learning.
                </p>
                <button
                  type="button"
                  className="composer-start-over"
                  onClick={composerExiting ? undefined : () => closeComposer(false)}
                >
                  Or, start over
                </button>
                </div>
              </div>
            )}
          </main>
          )}
      </div>
    </div>
  )
}

export default App
