import { useMemo, useState } from 'react'
import { View, ScrollView, StyleSheet, Dimensions, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
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
    SUCCESS,
    WARNING,
} from '@/lib/theme'
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'
import { useWorkout } from '@/contexts/WorkoutContext'

const { width: SW } = Dimensions.get('window')

export default function LeaderboardScreen() {
    const insets = useSafeAreaInsets()
    const { leaderboard, quickStats } = useWorkout()
    const [leaderboardMode, setLeaderboardMode] = useState<'weekly' | 'allTime'>('weekly')

    const ALL_TIME_CHAMPIONS = useMemo(() => {
        const userLifetimeVolume = quickStats.totalWorkouts * 1650 + 24200
        const list = [
            { rank: 1, name: 'Chris Bumstead', avatar: '💪', weeklyVolume: 512000, verified: true },
            { rank: 2, name: 'Arnold Schwarzenegger', avatar: '👑', weeklyVolume: 478000, verified: true },
            { rank: 3, name: 'Ronnie Coleman', avatar: '🏋️‍♂️', weeklyVolume: 456000, verified: true },
            { rank: 4, name: 'Jay Cutler', avatar: '⚡', weeklyVolume: 388000, verified: true },
            { rank: 5, name: 'You (Athlete)', avatar: '🔥', weeklyVolume: userLifetimeVolume, isUser: true, verified: true },
            { rank: 6, name: 'Phil Heath', avatar: '🌟', weeklyVolume: 345000, verified: true }
        ]

        const sorted = list.sort((a, b) => b.weeklyVolume - a.weeklyVolume)
        return sorted.map((u, i) => ({ ...u, rank: i + 1 }))
    }, [quickStats.totalWorkouts])

    const activeList = useMemo(() => {
        return leaderboardMode === 'weekly' ? leaderboard : ALL_TIME_CHAMPIONS
    }, [leaderboardMode, leaderboard, ALL_TIME_CHAMPIONS])

    const userRankDetails = useMemo(() => {
        return activeList.find((u) => u.isUser) || { rank: 7, weeklyVolume: 0 }
    }, [activeList])

    // Rank medallion styling
    const renderRankBadge = (rank: number) => {
        if (rank === 1) return <Text style={s.rankMedal}>🏆</Text>
        if (rank === 2) return <Text style={s.rankMedal}>🥈</Text>
        if (rank === 3) return <Text style={s.rankMedal}>🥉</Text>

        return (
            <View style={s.rankCircle}>
                <Text style={s.rankCircleText}>{rank}</Text>
            </View>
        )
    }

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: BG }}
            contentContainerStyle={[s.container, { paddingTop: insets.top + 16, paddingBottom: TAB_BAR_CLEARANCE + 16 }]}
            showsVerticalScrollIndicator={false}
        >
            {/* Header section */}
            <View style={s.header}>
                <Text style={s.title}>Leaderboard</Text>
                <Text style={s.subtitle}>Weekly Volume Ranking across the community.</Text>
            </View>

            {/* Interactive Mode Segment Selector */}
            <View style={s.segmentContainer}>
                <Pressable
                    onPress={() => {
                        setLeaderboardMode('weekly')
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    }}
                    style={[s.segmentBtn, leaderboardMode === 'weekly' && s.segmentBtnActive]}
                >
                    <Text style={[s.segmentText, leaderboardMode === 'weekly' && s.segmentTextActive]}>Weekly Challenge</Text>
                </Pressable>
                <Pressable
                    onPress={() => {
                        setLeaderboardMode('allTime')
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    }}
                    style={[s.segmentBtn, leaderboardMode === 'allTime' && s.segmentBtnActive]}
                >
                    <Text style={[s.segmentText, leaderboardMode === 'allTime' && s.segmentTextActive]}>All-Time Champions</Text>
                </Pressable>
            </View>

            {/* Weekly/AllTime Competition HUD Banner */}
            <Card style={s.challengeHUD}>
                <View style={s.hudLeft}>
                    <View style={s.trophyWrap}>
                        <Ionicons name="trophy" size={24} color="#f59e0b" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.challengeTitle}>
                            {leaderboardMode === 'weekly' ? 'Weekly Volume Challenge' : 'All-Time Champions'}
                        </Text>
                        <Text style={s.challengeSub}>
                            {leaderboardMode === 'weekly' ? 'Lift the maximum total weight to win.' : 'Hall of fame lifetime weight lifted.'}
                        </Text>
                    </View>
                </View>
                <View style={s.hudDivider} />
                <View style={s.hudStatsRow}>
                    <View style={s.hudStatItem}>
                        <Text style={s.hudStatLabel}>YOUR VOLUME</Text>
                        <Text style={[s.hudStatVal, { color: ACCENT, fontWeight: '900' }]}>
                            {leaderboardMode === 'weekly'
                                ? quickStats.weeklyVolume.toLocaleString()
                                : userRankDetails.weeklyVolume.toLocaleString()} kg
                        </Text>
                    </View>
                    <View style={s.hudStatItem}>
                        <Text style={s.hudStatLabel}>CURRENT RANK</Text>
                        <Text style={[s.hudStatVal, { color: WARNING, fontWeight: '900' }]}># {userRankDetails.rank}</Text>
                    </View>
                    <View style={s.hudStatItem}>
                        <Text style={s.hudStatLabel}>
                            {leaderboardMode === 'weekly' ? 'ENDS IN' : 'STATUS'}
                        </Text>
                        <Text style={[s.hudStatVal, leaderboardMode === 'allTime' && { color: SUCCESS, fontWeight: '900' }]}>
                            {leaderboardMode === 'weekly' ? '3d 12h' : 'LEGEND'}
                        </Text>
                    </View>
                </View>
            </Card>

            {/* Leaderboard Rankings Feed */}
            <Text style={s.sectionTitle}>Standings</Text>
            <View style={s.leaderboardList}>
                {activeList.map((user) => (
                    <Card
                        key={user.rank}
                        style={[
                            s.userRowCard,
                            user.isUser && s.activeUserRow,
                            user.rank <= 3 && { borderColor: 'rgba(255,255,255,0.06)' },
                        ]}
                    >
                        <View style={s.rowInner}>
                            {/* Rank medallion */}
                            <View style={s.medallionWrap}>
                                {renderRankBadge(user.rank)}
                            </View>

                            {/* Avatar Emoji */}
                            <View style={s.avatarWrap}>
                                <Text style={s.avatarEmoji}>{user.avatar}</Text>
                            </View>

                            {/* User Name */}
                            <View style={s.userInfo}>
                                <View style={s.nameBadgeRow}>
                                    <Text style={[s.userName, user.isUser && { color: ACCENT_LIGHT, fontWeight: '800' }]} numberOfLines={1}>
                                        {user.name} {user.isUser && '🔥'}
                                    </Text>
                                    {((user as any).verified || user.isUser) && (
                                        <Ionicons name="checkmark-circle-sharp" size={12} color={ACCENT} style={s.verifiedIcon} />
                                    )}
                                </View>
                                <Text style={s.userSub}>
                                    {user.isUser ? 'Verified Athlete' : 'Community Competitor'}
                                </Text>
                            </View>

                            {/* Volume logged */}
                            <View style={s.volumeWrap}>
                                <Text style={[s.volumeText, { fontWeight: '900' }, user.isUser && { color: ACCENT }]}>
                                    {user.weeklyVolume.toLocaleString()} kg
                                </Text>
                                <Text style={s.volumeSub}>
                                    {leaderboardMode === 'weekly' ? 'This Week' : 'Lifetime'}
                                </Text>
                            </View>
                        </View>
                    </Card>
                ))}
            </View>
        </ScrollView>
    )
}

// Accent text color matching theme
const ACCENT_LIGHT = '#5eead4'

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
    challengeHUD: { padding: 16, gap: 14, overflow: 'hidden' },
    hudLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    trophyWrap: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(245,158,11,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    challengeTitle: { fontSize: 15.5, fontWeight: '800', color: '#fff' },
    challengeSub: { fontSize: 12, color: TEXT_SECONDARY },
    hudDivider: { height: 1, backgroundColor: BORDER },
    hudStatsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    hudStatItem: { flex: 1, alignItems: 'center', gap: 4 },
    hudStatLabel: { fontSize: 8.5, fontWeight: '700', color: TEXT_TERTIARY, letterSpacing: 0.5 },
    hudStatVal: { fontSize: 14, fontWeight: '800', color: '#fff' },
    leaderboardList: { gap: 10 },
    userRowCard: { padding: 10 },
    activeUserRow: {
        backgroundColor: SURFACE2,
        borderColor: `${ACCENT}44`,
        borderWidth: 1.2,
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 8,
    },
    rowInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    medallionWrap: { width: 34, alignItems: 'center', justifyContent: 'center' },
    rankMedal: { fontSize: 18 },
    rankCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: BORDER,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankCircleText: { fontSize: 10.5, fontWeight: '800', color: TEXT_SECONDARY },
    avatarWrap: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: SURFACE2,
        borderWidth: 1,
        borderColor: BORDER,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarEmoji: { fontSize: 18 },
    userInfo: { flex: 1, gap: 2 },
    userName: { fontSize: 14, fontWeight: '700', color: '#fff' },
    userSub: { fontSize: 10.5, color: TEXT_TERTIARY },
    volumeWrap: { alignItems: 'flex-end', gap: 2 },
    volumeText: { fontSize: 13.5, fontWeight: '800', color: '#fff' },
    volumeSub: { fontSize: 9, color: TEXT_TERTIARY, textTransform: 'uppercase', letterSpacing: 0.3 },
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
    nameBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    verifiedIcon: {
        marginLeft: 2,
    },
})
