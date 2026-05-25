import { useMemo, useState } from 'react'
import { View, ScrollView, StyleSheet, RefreshControl, Pressable } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
    ACCENT,
    ACCENT_DIM,
    ACCENT_LIGHT,
    BG,
    BORDER,
    SURFACE,
    SURFACE2,
    TEXT_PRIMARY,
    TEXT_SECONDARY,
    TEXT_TERTIARY,
    SUCCESS,
    WARNING,
} from '@/lib/theme'
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'
import { useWorkout } from '@/contexts/WorkoutContext'
import { useProfile } from '@/hooks/useProfile'
import { ProgressRing } from '@/components/ui/ProgressRing'

export default function HomeScreen() {
    const insets = useSafeAreaInsets()
    const [refreshing, setRefreshing] = useState(false)
    const { history, streak, quickStats, startNewWorkout } = useWorkout()
    const { data: profile } = useProfile()

    const greeting = (() => {
        const h = new Date().getHours()
        if (h < 12) return 'Good morning'
        if (h < 17) return 'Good afternoon'
        return 'Good evening'
    })()

    // Determine today's workout target based on day of week
    const todayTarget = useMemo(() => {
        const day = new Date().getDay() // 0 = Sun, 1 = Mon, etc.
        if (day === 1 || day === 4) return { name: 'Upper Body A', exercises: ['Bench Press (Barbell)', 'Overhead Press (Barbell)', 'Pull-up'] }
        if (day === 2 || day === 5) return { name: 'Lower Body A', exercises: ['Barbell Squat', 'Deadlift (Barbell)'] }
        if (day === 3) return { name: 'Full Body B', exercises: ['Barbell Squat', 'Barbell Row', 'Bench Press (Barbell)'] }
        return null // Rest Day
    }, [])

    const latestActivity = useMemo(() => {
        return [...history].reverse().slice(0, 3)
    }, [history])

    const weeklyConsistency = useMemo(() => {
        const today = new Date()
        const currentDay = today.getDay()
        const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1
        const monday = new Date(today)
        monday.setDate(today.getDate() - distanceToMonday)
        monday.setHours(0, 0, 0, 0)

        return Array.from({ length: 7 }).map((_, i) => {
            const date = new Date(monday)
            date.setDate(monday.getDate() + i)
            const dateStr = date.toDateString()
            
            const completed = history.some((w) => {
                const wDate = new Date(w.date)
                return wDate.toDateString() === dateStr
            })

            const label = ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]
            const isToday = today.toDateString() === dateStr

            return { label, completed, isToday }
        })
    }, [history])

    const weeklyCompletedCount = useMemo(() => {
        return weeklyConsistency.filter((day) => day.completed).length
    }, [weeklyConsistency])

    const motivationalQuote = useMemo(() => {
        const quotes = [
            { text: "Success isn't owned, it's leased. And rent is due everyday.", author: "J.J. Watt" },
            { text: "Consistency beats intensity. Show up, put in the work, every day.", author: "Dwayne Johnson" },
            { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
            { text: "Strength does not come from winning. Your struggles develop your strengths.", author: "Arnold Schwarzenegger" },
            { text: "Your body can stand almost anything. It's your mind that you have to convince.", author: "Unknown" },
            { text: "No rest, no progress. Recover strong, train harder.", author: "Fitness Legend" },
            { text: "Action is the foundational key to all success.", author: "Pablo Picasso" }
        ]
        const day = new Date().getDay()
        return quotes[day % quotes.length]
    }, [])

    const targetDetails = useMemo(() => {
        if (!todayTarget) return null
        
        let focus = 'Full Body'
        let duration = '45 mins'
        let intensity = 'MODERATE'
        let intensityColor = ACCENT

        if (todayTarget.name === 'Upper Body A') {
            focus = 'Chest, Back & Shoulders'
            duration = '50 mins'
            intensity = 'HIGH INTENSITY'
            intensityColor = WARNING
        } else if (todayTarget.name === 'Lower Body A') {
            focus = 'Quads, Hamstrings & Glutes'
            duration = '45 mins'
            intensity = 'MAX EFFORT'
            intensityColor = '#ef4444' // red HSL/HEX
        } else if (todayTarget.name === 'Full Body B') {
            focus = 'Compound Movements'
            duration = '60 mins'
            intensity = 'STRENGTH'
            intensityColor = SUCCESS
        }

        return { focus, duration, intensity, intensityColor }
    }, [todayTarget])

    const onRefresh = async () => {
        setRefreshing(true)
        // Simulate a minor refresh latency
        await new Promise((resolve) => setTimeout(resolve, 800))
        setRefreshing(false)
    }

    const handleStartWorkout = () => {
        const routineName = todayTarget ? todayTarget.name : 'Full Body Workout'
        startNewWorkout(routineName)
        router.push('/logger')
    }

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: BG }}
            contentContainerStyle={[s.container, { paddingTop: insets.top + 16, paddingBottom: TAB_BAR_CLEARANCE + 16 }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
            showsVerticalScrollIndicator={false}
        >
            {/* Header section with Settings Cog and Streak Flame */}
            <View style={s.header}>
                <View style={s.headerRow}>
                    <View>
                        <Text style={s.greeting}>{greeting}, {(profile?.fullName ?? 'Athlete').split(' ')[0]}</Text>
                        <Text style={s.subGreeting}>Time to crush your goals.</Text>
                    </View>
                    <View style={s.headerActions}>
                        <Pressable 
                            onPress={() => router.push('/settings')} 
                            style={({ pressed }) => [s.settingsButton, pressed && { opacity: 0.7 }]}
                        >
                            <Ionicons name="settings-outline" size={22} color="#fff" />
                        </Pressable>
                    </View>
                </View>
            </View>

            {/* Premium Motivational Quote Card */}
            <Card style={s.quoteCard}>
                <LinearGradient
                    colors={[`${ACCENT}1A`, 'rgba(0,0,0,0)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                />
                <Text style={s.quoteText}>"{motivationalQuote.text}"</Text>
                <Text style={s.quoteAuthor}>— {motivationalQuote.author}</Text>
            </Card>

            {/* Weekly Consistency Tracker Grid */}
            <Text style={s.sectionTitle}>Weekly Consistency</Text>
            <Card style={s.calendarCard}>
                <View style={s.calendarRow}>
                    {weeklyConsistency.map((day, i) => (
                        <View key={i} style={s.calendarDayWrap}>
                            <View
                                style={[
                                    s.calendarBubble,
                                    day.completed && s.calendarBubbleCompleted,
                                    day.isToday && s.calendarBubbleToday
                                ]}
                            >
                                {day.completed ? (
                                    <Ionicons name="flame" size={16} color={WARNING} />
                                ) : (
                                    <Text style={[s.calendarDayText, day.isToday && { color: ACCENT, fontWeight: '800' }]}>
                                        {day.label}
                                    </Text>
                                )}
                            </View>
                            {day.isToday && <View style={s.todayDot} />}
                        </View>
                    ))}
                </View>
            </Card>

            {/* Weekly Target Goal Card with SVG ProgressRing */}
            <Text style={s.sectionTitle}>Weekly Target</Text>
            <Card style={s.targetGoalCard}>
                <View style={s.targetGoalRow}>
                    <View style={s.targetGoalInfo}>
                        <Text style={s.targetGoalTitle}>Weekly Workout Goal</Text>
                        <Text style={s.targetGoalSubtitle}>
                            Goal: <Text style={{ fontWeight: '800', color: '#fff' }}>4 sessions</Text> • Completed: <Text style={{ fontWeight: '800', color: ACCENT_LIGHT }}>{weeklyCompletedCount}</Text>
                        </Text>
                        <Text style={s.targetGoalMotivation}>
                            {weeklyCompletedCount >= 4 
                                ? '🏆 Weekly goal achieved! Legend!' 
                                : `Keep it up! ${4 - weeklyCompletedCount} more session${4 - weeklyCompletedCount === 1 ? '' : 's'} to go.`}
                        </Text>
                    </View>
                    <ProgressRing 
                        percentage={weeklyCompletedCount / 4} 
                        size={60} 
                        strokeWidth={6} 
                        color={ACCENT}
                    >
                        <Ionicons name="flame" size={20} color={weeklyCompletedCount >= 4 ? WARNING : ACCENT_LIGHT} />
                    </ProgressRing>
                </View>
            </Card>

            {/* Quick Stats Dashboard */}
            <Text style={s.sectionTitle}>Dashboard</Text>
            <View style={s.statsGrid}>
                {/* Streak Metric */}
                <Card style={[s.statCard, { borderColor: `${WARNING}33` }]}>
                    <View style={s.statHeader}>
                        <Ionicons name="flame" size={16} color={WARNING} />
                        <Text style={s.statLabel}>Streak</Text>
                    </View>
                    <Text style={[s.statValue, { color: WARNING }]}>{streak} Days</Text>
                    <Text style={s.statSubtitle}>Active consistency</Text>
                </Card>

                {/* Workouts Completed Metric */}
                <Card style={[s.statCard, { borderColor: `${ACCENT}33` }]}>
                    <View style={s.statHeader}>
                        <Ionicons name="fitness" size={16} color={ACCENT} />
                        <Text style={s.statLabel}>Workouts</Text>
                    </View>
                    <Text style={s.statValue}>{quickStats.totalWorkouts}</Text>
                    <Text style={s.statSubtitle}>Total completed</Text>
                </Card>
            </View>

            <View style={s.statsGrid}>
                {/* Weekly Volume Metric */}
                <Card style={[s.statCard, { borderColor: `${SUCCESS}33` }]}>
                    <View style={s.statHeader}>
                        <Ionicons name="bar-chart" size={16} color={SUCCESS} />
                        <Text style={s.statLabel}>Weekly Volume</Text>
                    </View>
                    <Text style={[s.statValue, { color: SUCCESS }]}>{quickStats.weeklyVolume.toLocaleString()} kg</Text>
                    <Text style={s.statSubtitle}>Past 7 days volume</Text>
                </Card>

                {/* Avg Volume Metric */}
                <Card style={s.statCard}>
                    <View style={s.statHeader}>
                        <Ionicons name="trending-up" size={16} color={ACCENT} />
                        <Text style={s.statLabel}>Avg Volume</Text>
                    </View>
                    <Text style={s.statValue}>{quickStats.avgVolume.toLocaleString()} kg</Text>
                    <Text style={s.statSubtitle}>Per training log</Text>
                </Card>
            </View>

            {/* Today's Target Card */}
            <Text style={s.sectionTitle}>Today's Target</Text>
            {todayTarget ? (
                <Card style={s.routineCard}>
                    <LinearGradient
                        colors={[`${ACCENT}12`, 'rgba(0,0,0,0)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                    />
                    <View style={s.routineHeader}>
                        <View style={s.routineBadgeRow}>
                            <View style={s.routineBadge}>
                                <Text style={s.routineBadgeText}>RECOMMENDED</Text>
                            </View>
                            {targetDetails && (
                                <View style={[s.intensityBadge, { borderColor: `${targetDetails.intensityColor}33`, backgroundColor: `${targetDetails.intensityColor}12` }]}>
                                    <Text style={[s.intensityBadgeText, { color: targetDetails.intensityColor }]}>{targetDetails.intensity}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={s.routineName}>{todayTarget.name}</Text>
                        {targetDetails && (
                            <View style={s.routineSpecsRow}>
                                <View style={s.specItem}>
                                    <Ionicons name="body-outline" size={13} color={TEXT_SECONDARY} style={{ marginTop: -1 }} />
                                    <Text style={s.specValue}>{targetDetails.focus}</Text>
                                </View>
                                <View style={s.specItem}>
                                    <Ionicons name="time-outline" size={13} color={TEXT_SECONDARY} style={{ marginTop: -1 }} />
                                    <Text style={s.specValue}>{targetDetails.duration}</Text>
                                </View>
                            </View>
                        )}
                        <Text style={s.routineDesc}>Targeting key compound movement patterns for progressive overload.</Text>
                    </View>

                    <View style={s.exerciseList}>
                        {todayTarget.exercises.map((ex, i) => (
                            <View key={i} style={s.exerciseItem}>
                                <View style={s.bulletPoint} />
                                <Text style={s.exerciseItemText}>{ex}</Text>
                            </View>
                        ))}
                    </View>

                    <Button
                        label="Start Logger"
                        variant="primary"
                        fullWidth
                        onPress={handleStartWorkout}
                        style={{ marginTop: 6 }}
                    />
                </Card>
            ) : (
                <Card style={s.routineCard}>
                    <View style={s.restDayRow}>
                        <View style={s.restIconWrap}>
                            <Ionicons name="bed-outline" size={24} color={WARNING} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.routineName}>Active Rest Day</Text>
                            <Text style={s.routineDesc}>Muscle repair occurs during rest. Hydrate, stretch, and recover.</Text>
                        </View>
                    </View>
                    <Button
                        label="Log Extra Session"
                        variant="outline"
                        fullWidth
                        onPress={handleStartWorkout}
                        style={{ marginTop: 12 }}
                    />
                </Card>
            )}

            {/* Recent Workout Logs */}
            <Text style={s.sectionTitle}>Recent Sessions</Text>
            {latestActivity.length > 0 ? (
                latestActivity.map((log) => (
                    <Card key={log.id} style={s.historyCard}>
                        <View style={s.historyHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={s.historyName}>{log.name}</Text>
                                <Text style={s.historyDate}>
                                    {new Date(log.date).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </Text>
                            </View>
                            <View style={s.historyStats}>
                                <Text style={s.historyVolume}>{log.volume.toLocaleString()} kg</Text>
                                <Text style={s.historyVolumeLabel}>Total Volume</Text>
                            </View>
                        </View>

                        <View style={s.historyDivider} />

                        <View style={s.historyExercises}>
                            {log.exercises.map((ex, i) => (
                                <View key={i} style={s.historyExerciseRow}>
                                    <Text style={s.historyExName} numberOfLines={1}>{ex.name}</Text>
                                    <Text style={s.historyExSets}>{ex.sets.length} sets • Max {Math.max(...ex.sets.map(s => s.weight))} kg</Text>
                                </View>
                            ))}
                        </View>
                    </Card>
                ))
            ) : (
                <Card style={s.emptyCard}>
                    <Ionicons name="calendar-outline" size={28} color={TEXT_TERTIARY} />
                    <Text style={s.emptyText}>No workouts logged yet. Start training!</Text>
                </Card>
            )}
        </ScrollView>
    )
}

const s = StyleSheet.create({
    container: { paddingHorizontal: 20, gap: 14 },
    header: { marginBottom: 6 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    greeting: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.6 },
    subGreeting: { fontSize: 13, color: TEXT_SECONDARY, marginTop: 1 },
    headerActions: { flexDirection: 'row', gap: 10 },
    settingsButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: BORDER,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: TEXT_TERTIARY,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginTop: 6,
        marginBottom: 2,
    },
    statsGrid: { flexDirection: 'row', gap: 10 },
    statCard: { flex: 1, gap: 4, paddingVertical: 12, paddingHorizontal: 14, overflow: 'hidden' },
    statHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statLabel: { fontSize: 11, color: TEXT_SECONDARY, fontWeight: '600' },
    statValue: { fontSize: 18, color: '#fff', fontWeight: '900', letterSpacing: -0.2, marginTop: 2 },
    statSubtitle: { fontSize: 10, color: TEXT_TERTIARY },
    routineCard: { padding: 18, gap: 14, overflow: 'hidden' },
    routineHeader: { gap: 4 },
    routineBadge: {
        alignSelf: 'flex-start',
        backgroundColor: ACCENT_DIM,
        borderColor: `${ACCENT}44`,
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    routineBadgeText: { fontSize: 9, fontWeight: '800', color: ACCENT, letterSpacing: 0.5 },
    routineName: { fontSize: 18, fontWeight: '800', color: '#fff' },
    routineDesc: { fontSize: 12.5, color: TEXT_SECONDARY, lineHeight: 18 },
    exerciseList: { gap: 8, marginVertical: 4 },
    exerciseItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    bulletPoint: { width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT },
    exerciseItemText: { fontSize: 13, color: '#fff', fontWeight: '600' },
    restDayRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
    restIconWrap: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: 'rgba(251,191,36,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(251,191,36,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    historyCard: { padding: 16, gap: 10 },
    historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    historyName: { fontSize: 15, fontWeight: '700', color: '#fff' },
    historyDate: { fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 },
    historyStats: { alignItems: 'flex-end' },
    historyVolume: { fontSize: 15, fontWeight: '900', color: ACCENT },
    historyVolumeLabel: { fontSize: 9, color: TEXT_TERTIARY, textTransform: 'uppercase', letterSpacing: 0.3 },
    historyDivider: { height: 1, backgroundColor: BORDER },
    historyExercises: { gap: 6 },
    historyExerciseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    historyExName: { fontSize: 13, color: '#fff', fontWeight: '600', flex: 1, marginRight: 10 },
    historyExSets: { fontSize: 11.5, color: TEXT_SECONDARY },
    emptyCard: { padding: 24, alignItems: 'center', gap: 8, justifyContent: 'center' },
    emptyText: { fontSize: 12.5, color: TEXT_SECONDARY, textAlign: 'center' },
    quoteCard: {
        padding: 16,
        gap: 6,
        overflow: 'hidden',
        borderLeftWidth: 3,
        borderLeftColor: ACCENT,
        backgroundColor: SURFACE,
    },
    quoteText: {
        fontSize: 13.5,
        color: '#fff',
        fontWeight: '600',
        fontStyle: 'italic',
        lineHeight: 20,
    },
    quoteAuthor: {
        fontSize: 11,
        color: TEXT_SECONDARY,
        alignSelf: 'flex-end',
        fontWeight: '700',
    },
    calendarCard: {
        paddingVertical: 14,
        paddingHorizontal: 8,
        backgroundColor: SURFACE,
    },
    calendarRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    calendarDayWrap: {
        alignItems: 'center',
        gap: 4,
    },
    calendarBubble: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: BORDER,
        alignItems: 'center',
        justifyContent: 'center',
    },
    calendarBubbleCompleted: {
        backgroundColor: 'rgba(251,191,36,0.08)',
        borderColor: 'rgba(251,191,36,0.22)',
    },
    calendarBubbleToday: {
        borderColor: ACCENT,
        backgroundColor: 'rgba(59,130,246,0.08)',
        borderWidth: 1.5,
    },
    calendarDayText: {
        fontSize: 11,
        color: TEXT_SECONDARY,
        fontWeight: '600',
    },
    todayDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: ACCENT,
        marginTop: 2,
    },
    routineBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 2,
    },
    intensityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
    },
    intensityBadgeText: {
        fontSize: 8.5,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    routineSpecsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginTop: 6,
        marginBottom: 4,
    },
    specItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    specValue: {
        fontSize: 11.5,
        color: TEXT_SECONDARY,
        fontWeight: '600',
    },
    targetGoalCard: {
        padding: 16,
        backgroundColor: SURFACE,
    },
    targetGoalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    targetGoalInfo: {
        flex: 1,
        gap: 3,
    },
    targetGoalTitle: {
        fontSize: 14.5,
        fontWeight: '700',
        color: '#fff',
    },
    targetGoalSubtitle: {
        fontSize: 12.5,
        color: TEXT_SECONDARY,
    },
    targetGoalMotivation: {
        fontSize: 11.5,
        color: TEXT_TERTIARY,
        marginTop: 2,
    },
})
