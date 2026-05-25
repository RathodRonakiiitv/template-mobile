import React, { useEffect, useState } from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated'

const { width: SW, height: SH } = Dimensions.get('window')
const COLORS = ['#FF4A4A', '#FF9E4A', '#FFEC4A', '#4AFF4A', '#4AECFF', '#B54AFF', '#FF4AE3']

interface Particle {
  id: number
  color: string
  startX: number
  targetX: number
  targetY: number
  scale: number
  rotation: number
  delay: number
}

export default function ConfettiCelebration({ trigger }: { trigger: number }) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (trigger === 0) return

    // Generate random confetti particles
    const newParticles = Array.from({ length: 35 }).map((_, idx) => {
      const startX = Math.random() * SW
      const targetX = startX + (Math.random() - 0.5) * 160 // sway X left/right
      const targetY = SH + 50
      const color = COLORS[Math.floor(Math.random() * COLORS.length)]
      const scale = 0.5 + Math.random() * 0.7
      const rotation = Math.random() * 720
      const delay = Math.random() * 300 // random staggered delays

      return {
        id: Date.now() + idx,
        color,
        startX,
        targetX,
        targetY,
        scale,
        rotation,
        delay
      }
    })

    setParticles(newParticles)

    // Clear particles after animation completes to free memory
    const timer = setTimeout(() => {
      setParticles([])
    }, 2500)

    return () => clearTimeout(timer)
  }, [trigger])

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <ConfettiParticle key={p.id} {...p} />
      ))}
    </View>
  )
}

function ConfettiParticle({
  color,
  startX,
  targetX,
  targetY,
  scale,
  rotation,
  delay
}: Particle) {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, {
        duration: 1800 + Math.random() * 600,
        easing: Easing.out(Easing.cubic)
      })
    )
  }, [])

  const animatedStyle = useAnimatedStyle(() => {
    const y = -60 + progress.value * (targetY + 60)
    // Sine wave motion for swaying left/right
    const x = startX + (targetX - startX) * progress.value + Math.sin(progress.value * 6) * 12
    const rotate = `${rotation * progress.value}deg`
    const opacity = progress.value > 0.85 ? 1 - (progress.value - 0.85) / 0.15 : 1

    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { rotate: rotate },
        { scale: scale }
      ],
      opacity: opacity < 0 ? 0 : opacity
    }
  })

  return (
    <Animated.View
      style={[
        s.particle,
        {
          backgroundColor: color,
          borderRadius: Math.random() > 0.5 ? 4 : 0, // mix of squares and circles/capsules
          width: Math.random() > 0.4 ? 8 : 12,
          height: Math.random() > 0.4 ? 12 : 8,
        },
        animatedStyle
      ]}
    />
  )
}

const s = StyleSheet.create({
  particle: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 9999,
  }
})
