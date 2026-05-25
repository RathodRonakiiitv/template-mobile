import { useState, useMemo } from 'react'
import { View, ScrollView, StyleSheet, Pressable, TextInput } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
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
import { useWorkout, calculateEstOneRepMax } from '@/contexts/WorkoutContext'

export default function PersonalRecordsScreen() {
    const insets = useSafeAreaInsets()
    const { prs, history } = useWorkout()

    // Real-time 1RM Calculator HUD state
    const [calcWeight, setCalcWeight] = useState('80')
    const [calcReps, setCalcReps] = useState('5')

    const calculated1RM = useMemo(() => {
        const w = parseFloat(calcWeight) || 0
        const r = parseInt(calcReps) || 0
        return calculateEstOneRepMax(w, r)
    }, [calcWeight, calcReps])

    // PR badges classification helper
    const getBadgeProps = (weight: number) => {
        if (weight >= 100) {
            return {
                title: 'Gold',
                emoji: '🏆',
                colors: ['#f59e0b', '#d97706'], // warm yellow gold
                labelColor: '#fef3c7',
                border: '#f59e0b',
            }
        }
        if (weight >= 60) {
            return {
                title: 'Silver',
                emoji: '🥈',
                colors: ['#9ca3af', '#4b5563'], // sleek silver grey
                labelColor: '#f3f4f6',
                border: '#9ca3af',
            }
        }
        return {
            title: 'Bronze',
            emoji: '🥉',
            colors: ['#b45309', '#78350f'], // bronze copper
            labelColor: '#ffedd5',
            border: '#b45309',
        }
    }

    // Sort PRs by max weight descending
    const sortedPrs = useMemo(() => {
        return [...prs].sort((a, b) => b.maxWeight - a.maxWeight)
    }, [prs])

    // Find 3 most recent PR events
    const recentMilestones = useMemo(() => {
        const events: { exerciseName: string; weight: number; dateStr: string; date: Date }[] = []
        
        // Find every workout where a set matched or was equal to the current PR max weight
        prs.forEach((pr) => {
            const date = new Date(pr.date)
            events.push({
                exerciseName: pr.exerciseName,
                weight: pr.maxWeight,
                dateStr: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
                date,
            })
        })

        return events.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 3)
    }, [prs])

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: BG }}
            contentContainerStyle={[s.container, { paddingTop: insets.top + 16, paddingBottom: TAB_BAR_CLEARANCE + 16 }]}
            showsVerticalScrollIndicator={false}
        >
            {/* Header bar */}
            <View style={s.header}>
                <Text style={s.title}>Personal Records</Text>
                <Text style={s.subtitle}>Celebrate your milestones and max intensity lifts.</Text>
            </View>

            {/* Real-time 1RM Calculator Widget */}
            <Text style={s.sectionTitle}>Interactive 1RM Estimator</Text>
            <Card style={s.calculatorCard}>
                <Text style={s.calcHeader}>Estimate your maximum single-rep capability.</Text>
                <View style={s.calcInputsRow}>
                    <View style={s.calcInputWrap}>
                        <Text style={s.calcInputLabel}>WEIGHT (kg)</Text>
                        <TextInput
                            style={s.calcInput}
                            value={calcWeight}
                            keyboardType="decimal-pad"
                            onChangeText={setCalcWeight}
                            placeholder="e.g. 80"
                            placeholderTextColor="rgba(255,255,255,0.2)"
                        />
                    </View>
                    <View style={s.calcInputWrap}>
                        <Text style={s.calcInputLabel}>REPS</Text>
                        <TextInput
                            style={s.calcInput}
                            value={calcReps}
                            keyboardType="number-pad"
                            onChangeText={setCalcReps}
                            placeholder="e.g. 5"
                            placeholderTextColor="rgba(255,255,255,0.2)"
                        />
                    </View>
                    <View style={s.calcResultWrap}>
                        <Text style={s.calcInputLabel}>EST. 1-REP MAX</Text>
                        <View style={s.resultValWrap}>
                            <Text style={s.resultVal}>{calculated1RM} kg</Text>
                        </View>
                    </View>
                </View>
            </Card>

            {/* List of Personal Records */}
            <Text style={s.sectionTitle}>Personal Bests</Text>
            {sortedPrs.length > 0 ? (
                sortedPrs.map((pr, i) => {
                    const badge = getBadgeProps(pr.maxWeight)
                    return (
                        <Card key={i} style={s.prCard}>
                            <View style={s.prRow}>
                                {/* Left: Badge Trophy with subtle gradient backing */}
                                <LinearGradient
                                    colors={[badge.colors[0], badge.colors[1]]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[s.badgeGradient, { borderColor: `${badge.border}66` }]}
                                >
                                    <Text style={s.badgeText}>{badge.emoji}</Text>
                                </LinearGradient>

                                {/* Middle: PR Lift description */}
                                <View style={s.prInfo}>
                                    <Text style={s.prExName}>{pr.exerciseName}</Text>
                                    <Text style={s.prDetail}>Max weight: <Text style={s.prWeightText}>{pr.maxWeight} kg</Text> for {pr.maxReps} reps</Text>
                                    <Text style={s.prDate}>
                                        Achieved on {new Date(pr.date).toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </Text>
                                </View>

                                {/* Right: Estimated 1RM Pill */}
                                <View style={s.oneRmPill}>
                                    <Text style={s.oneRmLbl}>1RM</Text>
                                    <Text style={s.oneRmVal}>{pr.estOneRepMax} kg</Text>
                                </View>
                            </View>
                        </Card>
                    )
                })
            ) : (
                <Card style={s.emptyCard}>
                    <Ionicons name="trophy-outline" size={32} color={TEXT_TERTIARY} />
                    <Text style={s.emptyText}>Complete a workout session inside the Logger to achieve your first personal record trophies!</Text>
                </Card>
            )}

            {/* Recent PR achievements */}
            <Text style={s.sectionTitle}>Recent Milestones</Text>
            {recentMilestones.length > 0 ? (
                <Card style={s.milestonesCard}>
                    {recentMilestones.map((ms, index) => (
                        <View key={index} style={[s.milestoneRow, index < recentMilestones.length - 1 && s.milestoneDivider]}>
                            <View style={s.milestoneIconWrap}>
                                <Ionicons name="sparkles" size={12} color={WARNING} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.milestoneText}>
                                    Smashed record for <Text style={{ color: '#fff', fontWeight: '700' }}>{ms.exerciseName}</Text> hitting <Text style={{ color: ACCENT, fontWeight: '800' }}>{ms.weight} kg</Text>!
                                </Text>
                                <Text style={s.milestoneTime}>{ms.dateStr}</Text>
                            </View>
                        </View>
                    ))}
                </Card>
            ) : (
                <Card style={s.emptyCard}>
                    <Text style={s.emptyText}>Milestones will trigger dynamically as you train.</Text>
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
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: TEXT_TERTIARY,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginTop: 6,
        marginBottom: 2,
    },
    calculatorCard: { padding: 14, gap: 10 },
    calcHeader: { fontSize: 12.5, color: TEXT_SECONDARY, fontWeight: '500' },
    calcInputsRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    calcInputWrap: { width: 90 },
    calcInputLabel: { fontSize: 8.5, fontWeight: '700', color: TEXT_TERTIARY, letterSpacing: 0.5, marginBottom: 4 },
    calcInput: {
        height: 44,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 10,
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        fontWeight: '900'
    },
    calcResultWrap: { flex: 1 },
    resultValWrap: {
        height: 44,
        backgroundColor: ACCENT_DIM,
        borderColor: `${ACCENT}33`,
        borderWidth: 1,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center'
    },
    resultVal: { fontSize: 16, fontWeight: '900', color: ACCENT_LIGHT },
    prCard: { padding: 12, overflow: 'hidden' },
    prRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    badgeGradient: {
        width: 44,
        height: 44,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: { fontSize: 22 },
    prInfo: { flex: 1, gap: 2 },
    prExName: { fontSize: 15, fontWeight: '700', color: '#fff' },
    prDetail: { fontSize: 12, color: TEXT_SECONDARY },
    prWeightText: { color: '#fff', fontWeight: '700' },
    prDate: { fontSize: 10.5, color: TEXT_TERTIARY },
    oneRmPill: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderColor: BORDER,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 5,
        alignItems: 'center'
    },
    oneRmLbl: { fontSize: 8.5, fontWeight: '700', color: TEXT_TERTIARY, letterSpacing: 0.2 },
    oneRmVal: { fontSize: 12.5, fontWeight: '800', color: ACCENT },
    milestonesCard: { paddingVertical: 4, paddingHorizontal: 12 },
    milestoneRow: { flexDirection: 'row', gap: 10, paddingVertical: 10 },
    milestoneDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.06)' },
    milestoneIconWrap: { width: 22, height: 22, borderRadius: 6, backgroundColor: 'rgba(251,191,36,0.08)', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
    milestoneText: { fontSize: 12.5, color: TEXT_SECONDARY, lineHeight: 18 },
    milestoneTime: { fontSize: 10.5, color: TEXT_TERTIARY, marginTop: 2 },
    emptyCard: { padding: 24, alignItems: 'center', gap: 10, justifyContent: 'center' },
    emptyText: { fontSize: 12.5, color: TEXT_SECONDARY, textAlign: 'center', lineHeight: 18 }
})
