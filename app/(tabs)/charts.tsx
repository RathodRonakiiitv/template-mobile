import { useState, useMemo } from 'react'
import { View, ScrollView, StyleSheet, Pressable, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line } from 'react-native-svg'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import {
    ACCENT,
    ACCENT_DIM,
    BG,
    BORDER,
    SURFACE,
    SURFACE2,
    TEXT_PRIMARY,
    TEXT_SECONDARY,
    TEXT_TERTIARY,
} from '@/lib/theme'
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'
import { useWorkout, EXERCISES, calculateEstOneRepMax } from '@/contexts/WorkoutContext'

const { width: SW } = Dimensions.get('window')

export default function ProgressChartsScreen() {
    const insets = useSafeAreaInsets()
    const { history } = useWorkout()
    
    const [selectedExercise, setSelectedExercise] = useState('Bench Press (Barbell)')
    const [showSelector, setShowSelector] = useState(false)
    const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null)
    const [chartMode, setChartMode] = useState<'peakWeight' | 'est1RM'>('peakWeight')

    // Compile historical data points for the selected exercise
    const dataPoints = useMemo(() => {
        const points: { date: Date; dateStr: string; peakWeight: number; est1RM: number }[] = []

        history.forEach((workout) => {
            const exLog = workout.exercises.find((e) => e.name === selectedExercise)
            if (exLog && exLog.sets.length > 0) {
                // Find peak weight and estimated 1RM for this workout
                let maxW = 0
                let max1RM = 0
                exLog.sets.forEach((set) => {
                    if (set.completed) {
                        if (set.weight > maxW) maxW = set.weight
                        const e1RM = calculateEstOneRepMax(set.weight, set.reps)
                        if (e1RM > max1RM) max1RM = e1RM
                    }
                })

                if (maxW > 0) {
                    const d = new Date(workout.date)
                    points.push({
                        date: d,
                        dateStr: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                        peakWeight: maxW,
                        est1RM: max1RM,
                    })
                }
            }
        })

        // Sort chronologically
        return points.sort((a, b) => a.date.getTime() - b.date.getTime())
    }, [history, selectedExercise])

    // Automatically highlight the latest data point by default
    useMemo(() => {
        if (dataPoints.length > 0) {
            setSelectedPointIndex(dataPoints.length - 1)
        } else {
            setSelectedPointIndex(null)
        }
    }, [dataPoints])

    // SVG Line chart path calculations
    const chartLayout = useMemo(() => {
        const padding = 20
        const chartW = SW - 40
        const chartH = 180
        
        if (dataPoints.length === 0) return { path: '', fillPath: '', coordinates: [] }

        // Find min/max values for scaling based on chartMode
        const values = dataPoints.map((p) => chartMode === 'peakWeight' ? p.peakWeight : p.est1RM)
        const maxVal = Math.max(...values, 80) * 1.05
        const minVal = Math.max(0, Math.min(...values, 40) * 0.95)
        const valRange = maxVal - minVal

        const coordinates = dataPoints.map((p, idx) => {
            const val = chartMode === 'peakWeight' ? p.peakWeight : p.est1RM
            const x = padding + (idx / Math.max(1, dataPoints.length - 1)) * (chartW - padding * 2)
            const y = chartH - padding - ((val - minVal) / (valRange || 1)) * (chartH - padding * 2)
            return { x, y }
        })

        // Compute SVG path string
        let path = ''
        let fillPath = ''

        if (coordinates.length > 0) {
            // Bezier control points helper
            path = `M ${coordinates[0].x} ${coordinates[0].y}`
            for (let i = 1; i < coordinates.length; i++) {
                const prev = coordinates[i - 1]
                const curr = coordinates[i]
                // simple smooth control points
                const cp1x = prev.x + (curr.x - prev.x) / 3
                const cp1y = prev.y
                const cp2x = prev.x + 2 * (curr.x - prev.x) / 3
                const cp2y = curr.y
                path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`
            }

            // Fill area path (closes at the bottom of the chart area)
            fillPath = `${path} L ${coordinates[coordinates.length - 1].x} ${chartH - padding} L ${coordinates[0].x} ${chartH - padding} Z`
        }

        return { path, fillPath, coordinates }
    }, [dataPoints, chartMode])

    const activePointDetails = useMemo(() => {
        if (selectedPointIndex !== null && dataPoints[selectedPointIndex]) {
            return dataPoints[selectedPointIndex]
        }
        return null
    }, [selectedPointIndex, dataPoints])

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: BG }}
            contentContainerStyle={[s.container, { paddingTop: insets.top + 16, paddingBottom: TAB_BAR_CLEARANCE + 16 }]}
            showsVerticalScrollIndicator={false}
        >
            {/* Top Selector bar */}
            <View style={s.header}>
                <Text style={s.title}>Progress Charts</Text>
                <Text style={s.subtitle}>Track your strength curve over time.</Text>
            </View>

            {/* Selector Dropdown trigger */}
            <Pressable
                onPress={() => setShowSelector(!showSelector)}
                style={({ pressed }) => [s.dropdownTrigger, pressed && { opacity: 0.8 }]}
            >
                <View style={s.dropdownLeft}>
                    <Ionicons name="barbell-sharp" size={16} color={ACCENT} />
                    <Text style={s.dropdownText}>{selectedExercise}</Text>
                </View>
                <Ionicons name={showSelector ? 'chevron-up' : 'chevron-down'} size={18} color="#fff" />
            </Pressable>

            {/* Dropdown body */}
            {showSelector && (
                <Card style={s.dropdownList}>
                    {EXERCISES.map((ex, i) => (
                        <Pressable
                            key={i}
                            onPress={() => {
                                setSelectedExercise(ex)
                                setShowSelector(false)
                            }}
                            style={({ pressed }) => [
                                s.dropdownItem,
                                selectedExercise === ex && s.dropdownItemActive,
                                pressed && { backgroundColor: SURFACE2 }
                            ]}
                        >
                            <Text style={[s.dropdownItemText, selectedExercise === ex && { color: ACCENT, fontWeight: '700' }]}>
                                {ex}
                            </Text>
                            {selectedExercise === ex && <Ionicons name="checkmark" size={14} color={ACCENT} />}
                        </Pressable>
                    ))}
                </Card>
            )}

            {/* SVG Chart display card */}
            {dataPoints.length > 0 ? (
                <Card style={s.chartCard}>
                    {/* Interactive Mode Segment Selector */}
                    <View style={s.segmentContainer}>
                        <Pressable
                            onPress={() => {
                                setChartMode('peakWeight')
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                            }}
                            style={[s.segmentBtn, chartMode === 'peakWeight' && s.segmentBtnActive]}
                        >
                            <Text style={[s.segmentText, chartMode === 'peakWeight' && s.segmentTextActive]}>Peak Weight</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => {
                                setChartMode('est1RM')
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                            }}
                            style={[s.segmentBtn, chartMode === 'est1RM' && s.segmentBtnActive]}
                        >
                            <Text style={[s.segmentText, chartMode === 'est1RM' && s.segmentTextActive]}>Est. 1-Rep Max</Text>
                        </Pressable>
                    </View>

                    {/* Selected Node Details HUD */}
                    {activePointDetails && (
                        <View style={s.hudRow}>
                            <View>
                                <Text style={s.hudLabel}>{activePointDetails.dateStr} Peak</Text>
                                <Text style={s.hudValue}>{activePointDetails.peakWeight} kg</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={s.hudLabel}>Est. 1RM Max</Text>
                                <Text style={[s.hudValue, { color: ACCENT }]}>{activePointDetails.est1RM} kg</Text>
                            </View>
                        </View>
                    )}

                    {/* SVG Curve rendering */}
                    <View style={s.svgContainer}>
                        <Svg width={SW - 40} height={180}>
                            <Defs>
                                <LinearGradient id="gradientGrad" x1="0" y1="0" x2="0" y2="1">
                                    <Stop offset="0" stopColor={ACCENT} stopOpacity="0.22" />
                                    <Stop offset="1" stopColor={ACCENT} stopOpacity="0.00" />
                                </LinearGradient>
                            </Defs>

                            {/* Horizontal gridlines */}
                            <Line x1="20" y1="30" x2={SW - 60} y2="30" stroke="rgba(255,255,255,0.04)" strokeDasharray="3,3" />
                            <Line x1="20" y1="90" x2={SW - 60} y2="90" stroke="rgba(255,255,255,0.04)" strokeDasharray="3,3" />
                            <Line x1="20" y1="150" x2={SW - 60} y2="150" stroke="rgba(255,255,255,0.04)" strokeDasharray="3,3" />

                            {/* Chart Area Fill */}
                            {chartLayout.fillPath !== '' && (
                                <Path d={chartLayout.fillPath} fill="url(#gradientGrad)" />
                            )}

                            {/* Line path */}
                            {chartLayout.path !== '' && (
                                <Path d={chartLayout.path} fill="none" stroke={ACCENT} strokeWidth={2.4} />
                            )}

                            {/* Data points */}
                            {chartLayout.coordinates.map((pt, i) => (
                                <Circle
                                    key={i}
                                    cx={pt.x}
                                    cy={pt.y}
                                    r={selectedPointIndex === i ? 6.5 : 4}
                                    fill={selectedPointIndex === i ? '#fff' : ACCENT}
                                    stroke={selectedPointIndex === i ? ACCENT : BG}
                                    strokeWidth={selectedPointIndex === i ? 3 : 1.5}
                                />
                            ))}
                        </Svg>

                        {/* Interactive touch hotspots container overlay */}
                        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
                            <View style={s.hotspotOverlay}>
                                {chartLayout.coordinates.map((pt, i) => {
                                    const colW = (SW - 40) / Math.max(1, chartLayout.coordinates.length)
                                    return (
                                        <Pressable
                                            key={i}
                                            onPress={() => setSelectedPointIndex(i)}
                                            style={[
                                                s.hotspotCol,
                                                {
                                                    left: pt.x - colW / 2,
                                                    width: colW,
                                                }
                                            ]}
                                        />
                                    )
                                })}
                            </View>
                        </View>
                    </View>
                    <Text style={s.chartHint}>Tap near dots on the graph to inspect logs</Text>
                </Card>
            ) : (
                <Card style={s.emptyCard}>
                    <Ionicons name="stats-chart" size={32} color={TEXT_TERTIARY} />
                    <Text style={s.emptyText}>Insufficient data points. Log workouts with {selectedExercise} to populate the strength chart.</Text>
                </Card>
            )}

            {/* History Table */}
            <Text style={s.sectionTitle}>History Feed</Text>
            {dataPoints.length > 0 ? (
                <Card style={s.tableCard}>
                    {/* Header */}
                    <View style={s.tableRowHeader}>
                        <Text style={[s.colHead, { width: 70 }]}>DATE</Text>
                        <Text style={[s.colHead, { flex: 1 }]}>PEAK WT</Text>
                        <Text style={[s.colHead, { flex: 1, textAlign: 'right' }]}>EST. 1RM</Text>
                    </View>

                    {/* Table Body (reverse chronological) */}
                    {[...dataPoints].reverse().map((pt, i) => (
                        <View key={i} style={[s.tableRow, i < dataPoints.length - 1 && s.rowDivider]}>
                            <Text style={s.colDate}>{pt.dateStr}</Text>
                            <Text style={s.colWeight}>{pt.peakWeight} kg</Text>
                            <Text style={s.col1RM}>{pt.est1RM} kg</Text>
                        </View>
                    ))}
                </Card>
            ) : (
                <Card style={s.emptyCard}>
                    <Text style={s.emptyText}>History log will appear here after your first completed workout.</Text>
                </Card>
            )}
        </ScrollView>
    )
}

const s = StyleSheet.create({
    container: { paddingHorizontal: 20, gap: 14 },
    header: { marginBottom: 4 },
    title: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.6 },
    subtitle: { fontSize: 13, color: TEXT_SECONDARY, marginTop: 1 },
    dropdownTrigger: {
        height: 48,
        backgroundColor: SURFACE,
        borderColor: BORDER,
        borderWidth: 1,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    dropdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dropdownText: { fontSize: 14.5, color: '#fff', fontWeight: '700' },
    dropdownList: { padding: 4, gap: 2, overflow: 'hidden', marginTop: -6 },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 42,
        paddingHorizontal: 14,
        borderRadius: 10,
    },
    dropdownItemActive: { backgroundColor: ACCENT_DIM },
    dropdownItemText: { fontSize: 13.5, color: TEXT_SECONDARY, fontWeight: '500' },
    chartCard: { padding: 14, gap: 14 },
    hudRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
    hudLabel: { fontSize: 10, color: TEXT_TERTIARY, textTransform: 'uppercase', letterSpacing: 0.5 },
    hudValue: { fontSize: 18, color: '#fff', fontWeight: '900', marginTop: 1 },
    svgContainer: { height: 180, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    hotspotOverlay: {
        ...StyleSheet.absoluteFillObject,
        flexDirection: 'row',
    },
    hotspotCol: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        backgroundColor: 'transparent',
    },
    chartHint: { fontSize: 10.5, color: TEXT_TERTIARY, textAlign: 'center', marginTop: -4 },
    emptyCard: { padding: 28, alignItems: 'center', gap: 12, justifyContent: 'center' },
    emptyText: { fontSize: 12.5, color: TEXT_SECONDARY, textAlign: 'center', lineHeight: 18 },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: TEXT_TERTIARY,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginTop: 6,
        marginBottom: 2,
    },
    tableCard: { paddingVertical: 6, paddingHorizontal: 14 },
    tableRowHeader: { flexDirection: 'row', alignItems: 'center', height: 38, borderBottomWidth: 1, borderBottomColor: BORDER },
    colHead: { fontSize: 9.5, fontWeight: '700', color: TEXT_TERTIARY, letterSpacing: 0.5 },
    tableRow: { flexDirection: 'row', alignItems: 'center', height: 42 },
    rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.06)' },
    colDate: { width: 70, fontSize: 12.5, color: TEXT_SECONDARY, fontWeight: '600' },
    colWeight: { flex: 1, fontSize: 13, color: '#fff', fontWeight: '900' },
    col1RM: { flex: 1, fontSize: 13, color: ACCENT, fontWeight: '900', textAlign: 'right' },
    segmentContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 10,
        padding: 2,
        borderWidth: 1,
        borderColor: BORDER,
        marginBottom: 4,
    },
    segmentBtn: {
        flex: 1,
        paddingVertical: 6,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },
    segmentBtnActive: {
        backgroundColor: SURFACE2,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    segmentText: {
        fontSize: 11.5,
        color: TEXT_SECONDARY,
        fontWeight: '600',
    },
    segmentTextActive: {
        color: ACCENT,
        fontWeight: '800',
    },
})
