import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { ApiRequestError } from '../api/client';
import {
  createSquad,
  getMySquad,
  getPercentile,
  getSquadLeaderboard,
  joinSquad,
} from '../api/squads';
import { mapSubmissionStatusToUi } from '../api/statusMap';
import { MySquadResponse, SquadLeaderboardEntry } from '../api/types';
import { useDailyChallenge } from '../hooks/useDailyChallenge';
import { useScreenLayout } from '../hooks/useScreenLayout';
import { Theme } from '../theme/themes';
import { useTheme } from '../theme/ThemeContext';
import { CompletionStatus } from '../types';

function createStyles(theme: Theme, layout: ReturnType<typeof useScreenLayout>) {
  const pad = layout.section.padding;

  return StyleSheet.create({
    safeArea: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    hero: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
      paddingBottom: layout.tight ? 24 : 32,
      paddingHorizontal: pad,
      paddingTop: layout.hero.paddingVertical,
    },
    flameWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: layout.hero.iconMarginBottom,
      position: 'relative',
    },
    flameBox: {
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderColor: 'rgba(96,165,250,0.4)',
      borderWidth: 1,
      height: layout.tight ? 72 : 88,
      justifyContent: 'center',
      width: layout.tight ? 72 : 88,
    },
    heroTitle: {
      color: theme.colors.text,
      fontFamily: theme.fonts.display,
      fontSize: layout.tight ? 24 : 28,
      marginBottom: 8,
      textAlign: 'center',
    },
    tierPill: {
      borderColor: 'rgba(96,165,250,0.3)',
      borderWidth: 1,
      marginBottom: 8,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    tierText: {
      color: '#60A5FA',
      fontFamily: theme.fonts.mono,
      fontSize: 11,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    heroMeta: {
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.sans,
      fontSize: 14,
      marginTop: 8,
      textAlign: 'center',
    },
    heroMetaStrong: {
      color: theme.colors.text,
      fontFamily: theme.fonts.mono,
    },
    section: {
      padding: pad,
      paddingBottom: 24,
    },
    sectionHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: layout.section.headerMarginBottom,
    },
    sectionTitle: {
      color: theme.colors.text,
      fontFamily: theme.fonts.mono,
      fontSize: 12,
      letterSpacing: 3,
      textTransform: 'uppercase',
    },
    sectionMeta: {
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.mono,
      fontSize: 10,
    },
    memberList: {
      gap: layout.trace.cardGap,
    },
    memberRow: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      flexDirection: 'row',
      padding: layout.tight ? 10 : 12,
    },
    memberRowEliminated: {
      opacity: 0.55,
    },
    rank: {
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.mono,
      fontSize: 12,
      marginRight: 8,
      width: 24,
    },
    avatar: {
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderColor: theme.colors.border,
      borderWidth: 1,
      height: 40,
      justifyContent: 'center',
      marginRight: 12,
      position: 'relative',
      width: 40,
    },
    statusDot: {
      borderColor: theme.colors.background,
      borderWidth: 1,
      bottom: -2,
      height: 10,
      position: 'absolute',
      right: -2,
      width: 10,
    },
    memberInfo: {
      flex: 1,
      minWidth: 0,
    },
    memberName: {
      color: theme.colors.text,
      fontFamily: theme.fonts.mono,
      fontSize: 13,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    memberStreak: {
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.mono,
      fontSize: 10,
      marginTop: 2,
    },
    eliminatedBadge: {
      color: theme.colors.danger,
      fontFamily: theme.fonts.mono,
      fontSize: 9,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    formCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      gap: 12,
      marginBottom: 16,
      padding: layout.trace.cardPadding,
    },
    input: {
      backgroundColor: theme.colors.background,
      borderColor: theme.colors.border,
      borderWidth: 1,
      color: theme.colors.text,
      fontFamily: theme.fonts.mono,
      fontSize: 13,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    button: {
      alignItems: 'center',
      backgroundColor: theme.colors.text,
      paddingVertical: 12,
    },
    buttonText: {
      color: theme.colors.buttonText,
      fontFamily: theme.fonts.sans,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    inviteCode: {
      color: theme.colors.accent,
      fontFamily: theme.fonts.mono,
      fontSize: 12,
      letterSpacing: 2,
      marginTop: 4,
    },
    errorText: {
      color: theme.colors.danger,
      fontFamily: theme.fonts.sans,
      fontSize: 12,
    },
    emptyText: {
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.sans,
      fontSize: 14,
      textAlign: 'center',
    },
  });
}

function statusColor(status: CompletionStatus, theme: Theme): string {
  if (status === 'SUBMITTED') return theme.colors.success;
  if (status === 'FAILED') return theme.colors.danger;
  return theme.colors.textMuted;
}

function memberTodayStatus(entry: SquadLeaderboardEntry): CompletionStatus {
  return mapSubmissionStatusToUi(entry.today_status);
}

export function SquadsScreen() {
  const { theme } = useTheme();
  const layout = useScreenLayout();
  const styles = useMemo(() => createStyles(theme, layout), [theme, layout]);
  const { loading: challengeLoading, streak } = useDailyChallenge();

  const [squad, setSquad] = useState<MySquadResponse | null>(null);
  const [entries, setEntries] = useState<SquadLeaderboardEntry[]>([]);
  const [percentile, setPercentile] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [squadName, setSquadName] = useState('');
  const [inviteInput, setInviteInput] = useState('');

  const loadSquad = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const mySquad = await getMySquad();
      setSquad(mySquad);

      try {
        const pct = await getPercentile();
        setPercentile(pct);
      } catch {
        setPercentile(null);
      }

      if (mySquad) {
        const leaderboard = await getSquadLeaderboard(mySquad.squad_id);
        setEntries(leaderboard.entries);
      } else {
        setEntries([]);
      }
    } catch (err) {
      setSquad(null);
      setEntries([]);
      setError(err instanceof ApiRequestError ? err.message : 'Failed to load squad data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSquad();
  }, [loadSquad]);

  const handleCreate = async () => {
    if (!squadName.trim()) {
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      await createSquad(squadName.trim());
      setSquadName('');
      await loadSquad();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not create squad.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteInput.trim()) {
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      await joinSquad(inviteInput.trim());
      setInviteInput('');
      await loadSquad();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not join squad.');
    } finally {
      setActionLoading(false);
    }
  };

  if (challengeLoading || loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const percentileLabel =
    percentile !== null ? `Top ${Math.max(1, Math.round(100 - percentile))}% of Finishers` : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.flameWrap}>
            <View style={styles.flameBox}>
              <MaterialCommunityIcons
                name="fire"
                size={layout.hero.iconSize}
                color="#60A5FA"
              />
            </View>
          </View>
          <Text style={styles.heroTitle}>Flame Evolution</Text>
          <View style={styles.tierPill}>
            <Text style={styles.tierText}>Tier 4: Plasma</Text>
          </View>
          <Text style={styles.heroMeta}>
            Streak: <Text style={styles.heroMetaStrong}>{streak} Days</Text>
            {percentileLabel ? ` (${percentileLabel})` : ''}
          </Text>
        </View>

        <View style={styles.section}>
          {error && <Text style={[styles.errorText, { marginBottom: 12 }]}>{error}</Text>}

          {!squad ? (
            <>
              <View style={styles.formCard}>
                <Text style={styles.sectionTitle}>Create Squad</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Squad name"
                  placeholderTextColor={theme.colors.textMuted}
                  value={squadName}
                  onChangeText={setSquadName}
                />
                <Pressable style={styles.button} onPress={handleCreate} disabled={actionLoading}>
                  <Text style={styles.buttonText}>
                    {actionLoading ? 'Working...' : 'Create'}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.formCard}>
                <Text style={styles.sectionTitle}>Join Squad</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Invite code"
                  placeholderTextColor={theme.colors.textMuted}
                  autoCapitalize="none"
                  value={inviteInput}
                  onChangeText={setInviteInput}
                />
                <Pressable style={styles.button} onPress={handleJoin} disabled={actionLoading}>
                  <Text style={styles.buttonText}>
                    {actionLoading ? 'Working...' : 'Join'}
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{squad.name}</Text>
                <Text style={styles.sectionMeta}>
                  {squad.member_count} / {squad.max_members} ACTIVE
                </Text>
              </View>
              <Text style={styles.inviteCode}>INVITE: {squad.invite_code}</Text>

              <View style={[styles.memberList, { marginTop: 16 }]}>
                {entries.length === 0 ? (
                  <Text style={styles.emptyText}>No members yet.</Text>
                ) : (
                  entries.map((member) => {
                    const eliminated = member.status === 'ELIMINATED';
                    return (
                    <View
                      key={member.user_id}
                      style={[styles.memberRow, eliminated && styles.memberRowEliminated]}
                    >
                      <Text style={styles.rank}>{String(member.rank).padStart(2, '0')}</Text>
                      <View style={styles.avatar}>
                        <MaterialCommunityIcons
                          name="hexagon-outline"
                          size={18}
                          color={theme.colors.textMuted}
                        />
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor: statusColor(
                                memberTodayStatus(member),
                                theme
                              ),
                            },
                          ]}
                        />
                      </View>
                      <View style={styles.memberInfo}>
                        <View style={{ alignItems: 'center', flexDirection: 'row', gap: 6 }}>
                          <Text style={styles.memberName} numberOfLines={1}>
                            {member.username}
                          </Text>
                          {eliminated && (
                            <Text style={styles.eliminatedBadge}>Eliminated</Text>
                          )}
                          {member.rank === 1 && !eliminated && (
                            <Feather name="award" size={12} color={theme.colors.accent} />
                          )}
                        </View>
                        <Text style={styles.memberStreak}>
                          {eliminated ? 'OUT OF RUN' : `STREAK: ${member.streak}`}
                        </Text>
                      </View>
                    </View>
                    );
                  })
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
