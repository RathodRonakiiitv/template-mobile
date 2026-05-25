import { useState, useMemo, useEffect } from 'react'
import { View, ScrollView, StyleSheet, Pressable, TextInput, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import ConfettiCelebration from '../../components/ConfettiCelebration'
import { useToast } from '@/contexts/ToastContext'
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
    SURFACE3,
    TEXT_PRIMARY,
    TEXT_SECONDARY,
    TEXT_TERTIARY,
    SUCCESS,
    ERROR,
    WARNING,
} from '@/lib/theme'
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'
import { useWorkout, EXERCISES, EXERCISE_LIBRARY } from '@/contexts/WorkoutContext'

const { width: SW } = Dimensions.get('window')

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    All: 'apps-sharp',
    Chest: 'heart-sharp',
    Back: 'accessibility-sharp',
    Legs: 'walk-sharp',
    Shoulders: 'sparkles-sharp',
    Arms: 'barbell-sharp',
}

export default function WorkoutLoggerScreen() {
    const insets = useSafeAreaInsets()
    const { showToast } = useToast()
    const {
        activeWorkout,
        restTimerActive,
        restTimerDuration,
        restTimerSecondsLeft,
        startNewWorkout,
        addExerciseToActive,
        addSetToActiveExercise,
        removeSetFromActiveExercise,
        updateActiveSet,
        toggleSetCompleted,
        startRestTimer,
        stopRestTimer,
        finishActiveWorkout,
        cancelActiveWorkout,
        checkIfSetIsPR,
        adjustRestTimerSecondsLeft,
        setDefaultRestDuration,
    } = useWorkout()

    const [showExercisePicker, setShowExercisePicker] = useState(false)
    const [durationSeconds, setDurationSeconds] = useState(0)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<'All' | 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms'>('All')
    const [confettiTrigger, setConfettiTrigger] = useState(0)
    const [activePRCelebration, setActivePRCelebration] = useState<{ exerciseName: string; weight: number; reps: number } | null>(null)

    const filteredExercises = useMemo(() => {
        return EXERCISE_LIBRARY.filter((ex) => {
            const matchesCategory = selectedCategory === 'All' || ex.category === selectedCategory
            const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase())
            return matchesCategory && matchesSearch
        })
    }, [searchQuery, selectedCategory])

    const handleToggleSetCompleted = (exIdx: number, setIdx: number, currentlyCompleted: boolean) => {
        toggleSetCompleted(exIdx, setIdx)
        if (!currentlyCompleted) {
            const exercise = activeWorkout?.exercises[exIdx]
            const set = exercise?.sets[setIdx]
            if (exercise && set) {
                const isPR = checkIfSetIsPR(exercise.name, set.weight, set.reps)
                if (isPR) {
                    setConfettiTrigger((prev) => prev + 1)
                    setActivePRCelebration({
                        exerciseName: exercise.name,
                        weight: set.weight,
                        reps: set.reps,
                    })
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                } else {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                }
            } else {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            }
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        }
    }

    // Running duration timer for the active session
    useEffect(() => {
        let interval: any
        if (activeWorkout) {
            interval = setInterval(() => {
                setDurationSeconds((prev) => prev + 1)
            }, 1000)
        } else {
            setDurationSeconds(0)
        }
        return () => {
            if (interval) clearInterval(interval)
        }
    }, [activeWorkout])

    const formattedDuration = useMemo(() => {
        const mins = Math.floor(durationSeconds / 60)
        const secs = durationSeconds % 60
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }, [durationSeconds])

    // Rest timer formatted time
    const restTimerFormatted = useMemo(() => {
        const mins = Math.floor(restTimerSecondsLeft / 60)
        const secs = restTimerSecondsLeft % 60
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }, [restTimerSecondsLeft])

    // Rest timer radial percentage for progress bar
    const timerProgress = useMemo(() => {
        if (restTimerDuration === 0) return 0
        return restTimerSecondsLeft / restTimerDuration
    }, [restTimerSecondsLeft, restTimerDuration])

    if (!activeWorkout) {
        return (
            <ScrollView
                style={{ flex: 1, backgroundColor: BG }}
                contentContainerStyle={[s.setupContainer, { paddingTop: insets.top + 32, paddingBottom: TAB_BAR_CLEARANCE + 16 }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={s.setupHeader}>
                    <View style={s.dumbbellIconWrap}>
                        <Ionicons name="barbell-outline" size={32} color={ACCENT} />
                    </View>
                    <Text style={s.setupTitle}>Start Training</Text>
                    <Text style={s.setupSubtitle}>Select a workout routine or build a custom session.</Text>
                </View>

                {/* Workout templates */}
                <View style={s.templatesGrid}>
                    <Pressable
                        onPress={() => startNewWorkout('Upper Body A')}
                        style={({ pressed }) => [s.templateCard, pressed && s.cardPressed]}
                    >
                        <Ionicons name="rocket-outline" size={20} color={ACCENT} />
                        <Text style={s.templateTitle}>Upper Body A</Text>
                        <Text style={s.templateDesc}>Bench, Overhead Press, Pull-ups</Text>
                    </Pressable>

                    <Pressable
                        onPress={() => startNewWorkout('Lower Body A')}
                        style={({ pressed }) => [s.templateCard, pressed && s.cardPressed]}
                    >
                        <Ionicons name="flame-outline" size={20} color={ACCENT} />
                        <Text style={s.templateTitle}>Lower Body A</Text>
                        <Text style={s.templateDesc}>Squats, Deadlifts intensity</Text>
                    </Pressable>

                    <Pressable
                        onPress={() => startNewWorkout('Full Body B')}
                        style={({ pressed }) => [s.templateCard, pressed && s.cardPressed]}
                    >
                        <Ionicons name="flash-outline" size={20} color={ACCENT} />
                        <Text style={s.templateTitle}>Full Body B</Text>
                        <Text style={s.templateDesc}>Squats, Barbell Rows, Bench Press</Text>
                    </Pressable>
                </View>

                <Button
                    label="Start Empty Workout"
                    variant="outline"
                    fullWidth
                    onPress={() => startNewWorkout('Custom Workout')}
                    style={{ marginTop: 10 }}
                />
            </ScrollView>
        )
    }

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <ConfettiCelebration trigger={confettiTrigger} />
            {/* Scrollable logger container */}
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={[s.container, { paddingTop: insets.top + 16, paddingBottom: TAB_BAR_CLEARANCE + 120 }]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Active workout header details */}
                <View style={s.loggerHeader}>
                    <View style={s.loggerTitleRow}>
                        <TextInput
                            style={s.workoutNameInput}
                            value={activeWorkout.name}
                            onChangeText={(text) => {
                                // Note: Can add local title set state if needed, or directly edit
                            }}
                            placeholder="Workout Name"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                        />
                        <View style={s.timerBadge}>
                            <Ionicons name="time-outline" size={14} color={ACCENT_LIGHT} />
                            <Text style={s.timerText}>{formattedDuration}</Text>
                        </View>
                    </View>
                </View>

                {/* Rest Timer Floating Banner inside Logger */}
                {restTimerActive && (
                    <Card style={s.restTimerBanner}>
                        <View style={s.restTimerRow}>
                            <View style={s.restTimerLeft}>
                                <Ionicons name="hourglass-outline" size={18} color={WARNING} style={s.hourglassSpin} />
                                <View>
                                    <Text style={s.restTimerTitle}>Rest Timer</Text>
                                    <Text style={s.restTimerSub}>Resting helps strength recovery</Text>
                                </View>
                            </View>
                            <View style={s.restTimerRight}>
                                <Text style={s.restTimerTime}>{restTimerFormatted}</Text>
                                <Pressable onPress={stopRestTimer} style={s.restTimerClose}>
                                    <Ionicons name="close-circle" size={18} color={TEXT_SECONDARY} />
                                </Pressable>
                            </View>
                        </View>
                        {/* Dynamic linear progress bar */}
                        <View style={s.progressBarBackground}>
                            <LinearGradient
                                colors={['#d97706', '#fbbf24']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[s.progressBarFill, { width: `${timerProgress * 100}%` }]}
                            />
                        </View>

                        {/* Interactive adjustment buttons & target presets */}
                        <View style={s.restTimerControlsRow}>
                            {/* Adjustments */}
                            <View style={s.restAdjustersGroup}>
                                <Pressable
                                    onPress={() => {
                                        adjustRestTimerSecondsLeft(-30)
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                                    }}
                                    style={({ pressed }) => [s.timerAdjustBtn, pressed && s.stepBtnPressed]}
                                >
                                    <Text style={s.timerAdjustText}>-30s</Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => {
                                        adjustRestTimerSecondsLeft(30)
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                                    }}
                                    style={({ pressed }) => [s.timerAdjustBtn, pressed && s.stepBtnPressed]}
                                >
                                    <Text style={s.timerAdjustText}>+30s</Text>
                                </Pressable>
                            </View>

                            {/* Preset Defaults */}
                            <View style={s.restPresetsGroup}>
                                {([60, 90, 120] as const).map((secs) => {
                                    const active = restTimerDuration === secs
                                    return (
                                        <Pressable
                                            key={secs}
                                            onPress={() => {
                                                setDefaultRestDuration(secs)
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                                            }}
                                            style={[s.timerPresetChip, active && s.timerPresetChipActive]}
                                        >
                                            <Text style={[s.timerPresetText, active && s.timerPresetTextActive]}>{secs}s</Text>
                                        </Pressable>
                                    )
                                })}
                            </View>
                        </View>
                    </Card>
                )}

                {/* Exercises Log list */}
                {activeWorkout.exercises.map((ex, exIdx) => (
                    <Card key={exIdx} style={s.exerciseCard}>
                        <View style={s.exCardHeader}>
                            <Text style={s.exCardTitle}>{ex.name}</Text>
                            <Pressable
                                onPress={() => addSetToActiveExercise(exIdx)}
                                style={({ pressed }) => [s.addSetRowButton, pressed && { opacity: 0.7 }]}
                            >
                                <Ionicons name="add-circle-outline" size={16} color={ACCENT} />
                                <Text style={s.addSetRowText}>Add Set</Text>
                            </Pressable>
                        </View>

                        {/* Sets Editor Table */}
                        <View style={s.setsTable}>
                            <View style={s.tableHeaderRow}>
                                <Text style={[s.tableHead, { width: 36 }]}>SET</Text>
                                <Text style={[s.tableHead, { flex: 1 }]}>KG</Text>
                                <Text style={[s.tableHead, { flex: 1 }]}>REPS</Text>
                                <Text style={[s.tableHead, { width: 44, textAlign: 'center' }]}>DONE</Text>
                            </View>

                            {ex.sets.map((set, setIdx) => (
                                <View key={setIdx} style={[s.setRow, set.completed && s.setRowCompleted]}>
                                    {/* Set index with PR Badge */}
                                    <View style={s.setIndexCol}>
                                        <Text style={[s.setIndexText, set.completed && s.setIndexTextCompleted]}>{setIdx + 1}</Text>
                                        {set.completed && checkIfSetIsPR(ex.name, set.weight, set.reps) && (
                                            <View style={s.prBadge}>
                                                <Text style={s.prBadgeText}>PR</Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Weight input with tactile adjusters */}
                                    <View style={[s.pickerCellContainer, set.completed && { opacity: 0.65 }]}>
                                        <Pressable
                                            onPress={() => {
                                                const nextVal = Math.max(0, set.weight - 2.5)
                                                updateActiveSet(exIdx, setIdx, { weight: nextVal })
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                                            }}
                                            disabled={set.completed}
                                            style={({ pressed }) => [s.stepBtn, pressed && s.stepBtnPressed]}
                                        >
                                            <Ionicons name="remove" size={16} color={TEXT_SECONDARY} />
                                        </Pressable>
                                        <TextInput
                                            style={s.stepInput}
                                            value={String(set.weight)}
                                            keyboardType="decimal-pad"
                                            selectTextOnFocus={true}
                                            editable={!set.completed}
                                            onChangeText={(text) => {
                                                if (text === '') {
                                                    updateActiveSet(exIdx, setIdx, { weight: 0 })
                                                    return
                                                }
                                                const clean = parseFloat(text.replace(/[^0-9.]/g, ''))
                                                if (!isNaN(clean)) {
                                                    updateActiveSet(exIdx, setIdx, { weight: clean })
                                                }
                                            }}
                                        />
                                        <Pressable
                                            onPress={() => {
                                                const nextVal = set.weight + 2.5
                                                updateActiveSet(exIdx, setIdx, { weight: nextVal })
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                                            }}
                                            disabled={set.completed}
                                            style={({ pressed }) => [s.stepBtn, pressed && s.stepBtnPressed]}
                                        >
                                            <Ionicons name="add" size={16} color={TEXT_SECONDARY} />
                                        </Pressable>
                                    </View>

                                    {/* Reps input with tactile adjusters */}
                                    <View style={[s.pickerCellContainer, set.completed && { opacity: 0.65 }]}>
                                        <Pressable
                                            onPress={() => {
                                                const nextVal = Math.max(0, set.reps - 1)
                                                updateActiveSet(exIdx, setIdx, { reps: nextVal })
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                                            }}
                                            disabled={set.completed}
                                            style={({ pressed }) => [s.stepBtn, pressed && s.stepBtnPressed]}
                                        >
                                            <Ionicons name="remove" size={16} color={TEXT_SECONDARY} />
                                        </Pressable>
                                        <TextInput
                                            style={s.stepInput}
                                            value={String(set.reps)}
                                            keyboardType="number-pad"
                                            selectTextOnFocus={true}
                                            editable={!set.completed}
                                            onChangeText={(text) => {
                                                if (text === '') {
                                                    updateActiveSet(exIdx, setIdx, { reps: 0 })
                                                    return
                                                }
                                                const clean = parseInt(text.replace(/[^0-9]/g, ''))
                                                if (!isNaN(clean)) {
                                                    updateActiveSet(exIdx, setIdx, { reps: clean })
                                                }
                                            }}
                                        />
                                        <Pressable
                                            onPress={() => {
                                                const nextVal = set.reps + 1
                                                updateActiveSet(exIdx, setIdx, { reps: nextVal })
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                                            }}
                                            disabled={set.completed}
                                            style={({ pressed }) => [s.stepBtn, pressed && s.stepBtnPressed]}
                                        >
                                            <Ionicons name="add" size={16} color={TEXT_SECONDARY} />
                                        </Pressable>
                                    </View>

                                    {/* Check off box */}
                                    <Pressable
                                        onPress={() => handleToggleSetCompleted(exIdx, setIdx, set.completed)}
                                        style={[
                                            s.checkbox,
                                            set.completed && s.checkboxChecked,
                                        ]}
                                    >
                                        {set.completed ? (
                                            <Ionicons name="checkmark-sharp" size={14} color={BG} />
                                        ) : (
                                            <Text style={s.checkboxText}></Text>
                                        )}
                                    </Pressable>

                                    {/* Remove set button */}
                                    <Pressable
                                        onPress={() => {
                                            removeSetFromActiveExercise(exIdx, setIdx)
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                                        }}
                                        style={s.deleteSetButton}
                                    >
                                        <Ionicons name="trash-outline" size={14} color={TEXT_TERTIARY} />
                                    </Pressable>
                                </View>
                            ))}
                        </View>
                    </Card>
                ))}

                {/* Add Exercise prompt */}
                <Button
                    label="Add Exercise"
                    variant="secondary"
                    fullWidth
                    onPress={() => setShowExercisePicker(true)}
                    style={{ marginTop: 6 }}
                />

                {/* Bottom destructive cancel */}
                <Pressable
                    onPress={cancelActiveWorkout}
                    style={({ pressed }) => [s.cancelWorkoutCta, pressed && { opacity: 0.6 }]}
                >
                    <Text style={s.cancelText}>Cancel Session</Text>
                </Pressable>
            </ScrollView>

            {/* Sticky bottom floating action footer */}
            <View style={[s.stickyFooter, { paddingBottom: insets.bottom + 12 }]}>
                <Button
                    label="Finish Workout"
                    variant="primary"
                    fullWidth
                    onPress={finishActiveWorkout}
                />
            </View>

            {/* Exercise Picker Overlay list */}
            {showExercisePicker && (
                <View style={s.overlayBackground}>
                    <View style={[s.pickerSheet, { paddingBottom: insets.bottom + 20, height: '70%' }]}>
                        <View style={s.pickerHeader}>
                            <Text style={s.pickerTitle}>Add Exercise</Text>
                            <Pressable onPress={() => {
                                setShowExercisePicker(false)
                                setSearchQuery('')
                                setSelectedCategory('All')
                            }}>
                                <Ionicons name="close-circle-sharp" size={24} color={TEXT_SECONDARY} />
                            </Pressable>
                        </View>

                        {/* Search Input */}
                        <View style={s.searchBarContainer}>
                            <Ionicons name="search-outline" size={16} color={TEXT_SECONDARY} style={s.searchIcon} />
                            <TextInput
                                style={s.searchBarInput}
                                placeholder="Search exercises..."
                                placeholderTextColor="rgba(255,255,255,0.3)"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCapitalize="none"
                            />
                            {searchQuery !== '' && (
                                <Pressable onPress={() => setSearchQuery('')} style={s.searchClearBtn}>
                                    <Ionicons name="close-circle" size={16} color={TEXT_TERTIARY} />
                                </Pressable>
                            )}
                        </View>

                        {/* Category Filter Horizontal Selector */}
                        <View style={s.categoryChipsContainer}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsScroll}>
                                {(['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms'] as const).map((cat) => {
                                    const active = selectedCategory === cat
                                    return (
                                        <Pressable
                                            key={cat}
                                            onPress={() => {
                                                setSelectedCategory(cat)
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                                            }}
                                            style={[s.chipBtn, active && s.chipBtnActive]}
                                        >
                                            <Ionicons name={CATEGORY_ICONS[cat]} size={12} color={active ? '#fff' : TEXT_SECONDARY} />
                                            <Text style={[s.chipText, active && s.chipTextActive]}>{cat}</Text>
                                        </Pressable>
                                    )
                                })}
                            </ScrollView>
                        </View>

                        {/* Scrollable list of exercises */}
                        <ScrollView style={s.pickerScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            {filteredExercises.length > 0 ? (
                                filteredExercises.map((ex, i) => (
                                    <Pressable
                                        key={i}
                                        onPress={() => {
                                            addExerciseToActive(ex.name)
                                            setShowExercisePicker(false)
                                            setSearchQuery('')
                                            setSelectedCategory('All')
                                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                                        }}
                                        style={({ pressed }) => [s.pickerItem, pressed && s.pickerItemPressed]}
                                    >
                                        <View style={s.bulletIcon}>
                                            <Ionicons name={CATEGORY_ICONS[ex.category] || 'barbell'} size={15} color={ACCENT} />
                                        </View>
                                        <View style={s.pickerItemInfo}>
                                            <Text style={s.pickerItemText}>{ex.name}</Text>
                                            <View style={s.miniCategoryBadge}>
                                                <Ionicons name={CATEGORY_ICONS[ex.category] || 'barbell-sharp'} size={9} color={TEXT_TERTIARY} />
                                                <Text style={s.miniCategoryText}>{ex.category}</Text>
                                            </View>
                                        </View>
                                    </Pressable>
                                ))
                            ) : (
                                <View style={s.pickerEmptyState}>
                                    <Ionicons name="search-outline" size={32} color={TEXT_TERTIARY} />
                                    <Text style={s.pickerEmptyTitle}>No Exercises Found</Text>
                                    <Text style={s.pickerEmptySub}>Try adjusting your search query or category filters</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            )}

            {activePRCelebration && (
                <View style={s.prOverlayBackground}>
                    <View style={s.prCelebrationCard}>
                        <LinearGradient
                            colors={['rgba(251,191,36,0.12)', 'rgba(0,0,0,0)']}
                            style={StyleSheet.absoluteFillObject}
                        />
                        <View style={s.prCelebStars}>
                            <Ionicons name="star-sharp" size={24} color="#fbbf24" />
                            <Ionicons name="star-sharp" size={38} color="#fbbf24" style={{ marginHorizontal: 8 }} />
                            <Ionicons name="star-sharp" size={24} color="#fbbf24" />
                        </View>
                        <Text style={s.prCelebTitle}>NEW PERSONAL RECORD</Text>
                        <Text style={s.prCelebExName}>{activePRCelebration.exerciseName}</Text>
                        <View style={s.prCelebStatsRow}>
                            <Text style={s.prCelebStatVal}>{activePRCelebration.weight}</Text>
                            <Text style={s.prCelebStatUnit}>kg</Text>
                            <Text style={s.prCelebStatDivider}> × </Text>
                            <Text style={s.prCelebStatVal}>{activePRCelebration.reps}</Text>
                            <Text style={s.prCelebStatUnit}>reps</Text>
                        </View>
                        <Text style={s.prCelebCongrats}>Your progressive overload is paying off. Keep crushing it!</Text>
                        <Button
                            label="Sweet!"
                            variant="primary"
                            onPress={() => setActivePRCelebration(null)}
                            style={{ minWidth: 120, marginTop: 10 }}
                        />
                    </View>
                </View>
            )}
        </View>
    )
}

const s = StyleSheet.create({
    container: { paddingHorizontal: 20, gap: 14 },
    setupContainer: { paddingHorizontal: 24, flexGrow: 1, justifyContent: 'center', gap: 20 },
    setupHeader: { alignItems: 'center', gap: 8, marginVertical: 10 },
    dumbbellIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: ACCENT_DIM,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    setupTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
    setupSubtitle: { fontSize: 13.5, color: TEXT_SECONDARY, textAlign: 'center', paddingHorizontal: 12, lineHeight: 20 },
    templatesGrid: { gap: 10, marginTop: 10 },
    templateCard: {
        backgroundColor: SURFACE,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 16,
        padding: 16,
        gap: 4,
    },
    cardPressed: { opacity: 0.8, borderColor: ACCENT },
    templateTitle: { fontSize: 14.5, fontWeight: '700', color: '#fff' },
    templateDesc: { fontSize: 12, color: TEXT_SECONDARY },
    loggerHeader: { marginBottom: 4 },
    loggerTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    workoutNameInput: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        flex: 1,
        paddingVertical: 4,
        letterSpacing: -0.6,
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: ACCENT_DIM,
        borderColor: `${ACCENT}44`,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    timerText: { fontSize: 12.5, fontWeight: '900', color: ACCENT_LIGHT },
    restTimerBanner: { padding: 12, gap: 10, borderLeftWidth: 3, borderLeftColor: WARNING, backgroundColor: SURFACE2 },
    restTimerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    restTimerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    hourglassSpin: { marginTop: 1 },
    restTimerTitle: { fontSize: 13, fontWeight: '700', color: '#fff' },
    restTimerSub: { fontSize: 11, color: TEXT_SECONDARY },
    restTimerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    restTimerTime: { fontSize: 15, fontWeight: '900', color: WARNING },
    restTimerClose: { padding: 2 },
    progressBarBackground: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
    progressBarFill: { height: 4, backgroundColor: WARNING, borderRadius: 2 },
    exerciseCard: { padding: 14, gap: 12 },
    exCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    exCardTitle: { fontSize: 15.5, fontWeight: '700', color: '#fff' },
    addSetRowButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 2, paddingHorizontal: 6 },
    addSetRowText: { fontSize: 11.5, fontWeight: '600', color: ACCENT },
    setsTable: { gap: 8 },
    tableHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
    tableHead: { fontSize: 9.5, fontWeight: '700', color: TEXT_TERTIARY, letterSpacing: 0.5 },
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderRadius: 10,
        paddingHorizontal: 4,
        gap: 6,
    },
    setRowCompleted: { backgroundColor: 'rgba(74,222,128,0.04)' },
    setIndexText: { fontSize: 13.5, fontWeight: '800', color: TEXT_SECONDARY },
    setIndexTextCompleted: { color: SUCCESS, opacity: 0.85 },
    pickerCellContainer: {
        flex: 1,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: BORDER,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
    },
    stepBtn: {
        width: 24,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepBtnPressed: {
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    stepInput: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
        textAlign: 'center',
        padding: 0,
        paddingHorizontal: 0,
        fontWeight: '800',
    },
    checkbox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: BORDER,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)'
    },
    checkboxChecked: { backgroundColor: SUCCESS, borderColor: SUCCESS },
    checkboxText: { fontSize: 11, color: '#fff', fontWeight: '800' },
    deleteSetButton: {
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    cancelWorkoutCta: { alignSelf: 'center', marginTop: 14, paddingVertical: 8, paddingHorizontal: 16 },
    cancelText: { fontSize: 13, color: ERROR, fontWeight: '600' },
    stickyFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: BG,
        borderTopWidth: 1,
        borderTopColor: BORDER,
        paddingHorizontal: 20,
        paddingTop: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 10,
    },
    overlayBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end', zIndex: 1000 },
    pickerSheet: { backgroundColor: SURFACE, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
    pickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
    pickerTitle: { fontSize: 15.5, fontWeight: '700', color: '#fff' },
    pickerScroll: { maxHeight: 250, paddingHorizontal: 16, marginVertical: 8 },
    pickerItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10 },
    pickerItemPressed: { backgroundColor: SURFACE2 },
    bulletIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: ACCENT_DIM, alignItems: 'center', justifyContent: 'center' },
    pickerItemText: { fontSize: 14.5, color: '#fff', fontWeight: '600' },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: BORDER,
        marginHorizontal: 20,
        marginVertical: 10,
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchBarInput: {
        flex: 1,
        color: '#fff',
        fontSize: 13.5,
        padding: 0,
    },
    searchClearBtn: {
        padding: 4,
    },
    categoryChipsContainer: {
        height: 36,
        marginBottom: 8,
    },
    chipsScroll: {
        paddingHorizontal: 20,
        gap: 8,
        alignItems: 'center',
    },
    chipBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: BORDER,
    },
    chipBtnActive: {
        backgroundColor: ACCENT,
        borderColor: ACCENT,
    },
    chipText: {
        fontSize: 12,
        color: TEXT_SECONDARY,
        fontWeight: '600',
    },
    chipTextActive: {
        color: '#fff',
        fontWeight: '700',
    },
    pickerItemInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flex: 1,
    },
    miniCategoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    miniCategoryText: {
        fontSize: 9,
        color: TEXT_TERTIARY,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    pickerEmptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        gap: 4,
    },
    pickerEmptyTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
        marginTop: 8,
    },
    pickerEmptySub: {
        fontSize: 11.5,
        color: TEXT_SECONDARY,
        textAlign: 'center',
    },
    setIndexCol: {
        width: 36,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    prBadge: {
        backgroundColor: '#F59E0B',
        borderRadius: 4,
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    prBadgeText: {
        color: '#fff',
        fontSize: 7.5,
        fontWeight: '900',
        letterSpacing: 0.2,
    },
    restTimerControlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 6,
        paddingTop: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(255,255,255,0.06)',
    },
    restAdjustersGroup: {
        flexDirection: 'row',
        gap: 6,
    },
    timerAdjustBtn: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderColor: BORDER,
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    timerAdjustText: {
        color: TEXT_SECONDARY,
        fontSize: 10,
        fontWeight: '700',
    },
    restPresetsGroup: {
        flexDirection: 'row',
        gap: 5,
    },
    timerPresetChip: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    timerPresetChipActive: {
        backgroundColor: `${WARNING}22`,
        borderColor: WARNING,
    },
    timerPresetText: {
        fontSize: 10,
        color: TEXT_TERTIARY,
        fontWeight: '600',
    },
    timerPresetTextActive: {
        color: WARNING,
        fontWeight: '700',
    },
    prOverlayBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.82)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        paddingHorizontal: 28,
    },
    prCelebrationCard: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: SURFACE,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(251,191,36,0.25)',
        padding: 24,
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 12,
        overflow: 'hidden',
    },
    prCelebStars: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    prCelebTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#fbbf24',
        letterSpacing: 1.5,
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    prCelebExName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
    },
    prCelebStatsRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginVertical: 4,
    },
    prCelebStatVal: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -0.5,
    },
    prCelebStatUnit: {
        fontSize: 14,
        fontWeight: '700',
        color: TEXT_SECONDARY,
        marginLeft: 2,
    },
    prCelebStatDivider: {
        fontSize: 22,
        fontWeight: '600',
        color: TEXT_TERTIARY,
        marginHorizontal: 12,
    },
    prCelebCongrats: {
        fontSize: 13,
        color: TEXT_SECONDARY,
        textAlign: 'center',
        lineHeight: 18,
        paddingHorizontal: 6,
        marginBottom: 8,
    },
})
