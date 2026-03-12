interface StatusIndicatorsProps {
  cameraActive?: boolean
  screenActive?: boolean
  voiceListening?: boolean
  streamingActive?: boolean
  aiThinking?: boolean
  className?: string
}

export const StatusIndicators = ({
  cameraActive = false,
  screenActive = false,
  voiceListening = false,
  streamingActive = false,
  aiThinking = false,
  className = ''
}: StatusIndicatorsProps) => {
  const indicators = [
    {
      id: 'camera',
      active: cameraActive,
      icon: '📷',
      label: 'Camera',
      activeColor: 'bg-blue-500',
      inactiveColor: 'bg-gray-300'
    },
    {
      id: 'screen',
      active: screenActive,
      icon: '🖥️',
      label: 'Screen',
      activeColor: 'bg-purple-500',
      inactiveColor: 'bg-gray-300'
    },
    {
      id: 'voice',
      active: voiceListening,
      icon: '🎤',
      label: 'Voice',
      activeColor: 'bg-red-500',
      inactiveColor: 'bg-gray-300'
    },
    {
      id: 'streaming',
      active: streamingActive,
      icon: '📡',
      label: 'Live',
      activeColor: 'bg-green-500',
      inactiveColor: 'bg-gray-300'
    },
    {
      id: 'ai',
      active: aiThinking,
      icon: '🤖',
      label: 'AI',
      activeColor: 'bg-yellow-500',
      inactiveColor: 'bg-gray-300'
    }
  ]

  const activeIndicators = indicators.filter(i => i.active)

  // Don't render if nothing is active
  if (activeIndicators.length === 0) {
    return null
  }

  return (
    <div className={`flex gap-2 flex-wrap ${className}`}>
      {activeIndicators.map((indicator) => (
        <div
          key={indicator.id}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm ${
            indicator.active ? indicator.activeColor : indicator.inactiveColor
          } text-white transition-all animate-pulse`}
        >
          <span className="text-sm">{indicator.icon}</span>
          <span className="text-xs font-medium">{indicator.label}</span>
        </div>
      ))}
    </div>
  )
}
