import React from 'react'
import { View, StyleSheet } from 'react-native'
import Svg, { Circle } from 'react-native-svg'

interface ProgressRingProps {
  /** Value between 0 and 1 */
  percentage: number
  /** Diameter of the ring */
  size?: number
  /** Width of the ring outline */
  strokeWidth?: number
  /** Color of the progress track */
  color: string
  /** Color of the background ring track */
  trackColor?: string
  /** Children placed in the absolute center of the ring */
  children?: React.ReactNode
}

export function ProgressRing({
  percentage = 0,
  size = 80,
  strokeWidth = 6,
  color,
  trackColor = 'rgba(255, 255, 255, 0.05)',
  children,
}: ProgressRingProps) {
  const cleanPercentage = Math.min(Math.max(percentage, 0), 1)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - cleanPercentage * circumference

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background track circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress indicator circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children && <View style={[StyleSheet.absoluteFillObject, styles.center]}>{children}</View>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
})
