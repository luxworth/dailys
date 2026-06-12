import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { getTodayFeed } from '../api/challenges';
import { deleteReaction, upsertReaction } from '../api/reactions';
import { ApiReactionType, FeedItem } from '../api/types';
import { useDailyChallenge } from '../hooks/useDailyChallenge';
import { useScreenLayout } from '../hooks/useScreenLayout';
import { Theme } from '../theme/themes';
import { useTheme } from '../theme/ThemeContext';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { RootTabParamList } from '../navigation/AppNavigator';

type FeedNav = BottomTabNavigationProp<RootTabParamList, 'Feed'>;

function formatPostTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function createStyles(theme: Theme, layout: ReturnType<typeof useScreenLayout>) {
  const pad = layout.section.padding;

  return StyleSheet.create({
    safeArea: {
      backgroundColor: theme.colors.background,
      flex: 1,
    },
    header: {
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
      flexDirection: 'row',
      flexShrink: 0,
      justifyContent: 'space-between',
      paddingHorizontal: pad,
      paddingVertical: layout.header.paddingVertical,
    },
    headerTitle: {
      color: theme.colors.text,
      fontFamily: theme.fonts.mono,
      fontSize: 14,
      letterSpacing: 4,
      textTransform: 'uppercase',
    },
    headerMeta: {
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.mono,
      fontSize: 12,
    },
    flex: {
      flex: 1,
      position: 'relative',
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      gap: layout.trace.cardGap,
      padding: pad,
      paddingBottom: 24,
    },
    postCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      gap: 12,
      padding: layout.trace.cardPadding,
    },
    postTop: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    postUser: {
      color: theme.colors.text,
      fontFamily: theme.fonts.mono,
      fontSize: 11,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    postTime: {
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.mono,
      fontSize: 10,
    },
    postProof: {
      color: theme.colors.text,
      fontFamily: theme.fonts.sans,
      fontSize: 15,
      lineHeight: 22,
    },
    reactions: {
      flexDirection: 'row',
      gap: 8,
    },
    reactionButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderColor: theme.colors.border,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    reactionEmoji: {
      fontSize: 14,
    },
    reactionCount: {
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.mono,
      fontSize: 10,
    },
    reactionButtonActive: {
      borderColor: theme.colors.accent,
    },
    emptyText: {
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.sans,
      fontSize: 14,
      textAlign: 'center',
    },
    lockedFeed: {
      opacity: 0.15,
    },
    overlay: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      backgroundColor: `${theme.colors.background}E6`,
      justifyContent: 'center',
      padding: pad,
    },
    lockBox: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
      height: 72,
      justifyContent: 'center',
      marginBottom: 20,
      width: 72,
    },
    lockTitle: {
      color: theme.colors.text,
      fontFamily: theme.fonts.display,
      fontSize: layout.tight ? 22 : 26,
      marginBottom: 8,
      textAlign: 'center',
    },
    lockBody: {
      color: theme.colors.textMuted,
      fontFamily: theme.fonts.sans,
      fontSize: 14,
      lineHeight: 22,
      marginBottom: 24,
      maxWidth: 260,
      textAlign: 'center',
    },
    unlockButton: {
      alignItems: 'center',
      backgroundColor: theme.colors.text,
      maxWidth: 320,
      paddingVertical: layout.tight ? 14 : 16,
      width: '100%',
    },
    unlockText: {
      color: theme.colors.buttonText,
      fontFamily: theme.fonts.sans,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 3,
      textTransform: 'uppercase',
    },
  });
}

const REACTIONS: { type: ApiReactionType; emoji: string; key: keyof FeedItem['reactions'] }[] = [
  { type: 'MIND_BLOWN', emoji: '🤯', key: 'mind_blown' },
  { type: 'LAUGH', emoji: '😂', key: 'laugh' },
  { type: 'RESPECT', emoji: '🫡', key: 'respect' },
];

function ReactionButton({
  emoji,
  count,
  active,
  onPress,
}: {
  emoji: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const layout = useScreenLayout();
  const styles = useMemo(() => createStyles(theme, layout), [theme, layout]);

  return (
    <Pressable
      style={[styles.reactionButton, active && styles.reactionButtonActive]}
      onPress={onPress}
    >
      <Text style={styles.reactionEmoji}>{emoji}</Text>
      <Text style={styles.reactionCount}>{count}</Text>
    </Pressable>
  );
}

export function FeedScreen() {
  const { theme } = useTheme();
  const layout = useScreenLayout();
  const styles = useMemo(() => createStyles(theme, layout), [theme, layout]);
  const navigation = useNavigation<FeedNav>();
  const { loading, status, sequenceNumber } = useDailyChallenge();
  const isUnlocked = status === 'SUBMITTED';
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);

  const handleReaction = async (post: FeedItem, reactionType: ApiReactionType) => {
    const previous = feedItems;
    const isToggleOff = post.viewer_reaction === reactionType;

    setFeedItems((items) =>
      items.map((item) => {
        if (item.id !== post.id) {
          return item;
        }

        const reactions = { ...item.reactions };
        if (item.viewer_reaction) {
          const prevKey =
            item.viewer_reaction === 'MIND_BLOWN'
              ? 'mind_blown'
              : item.viewer_reaction === 'LAUGH'
                ? 'laugh'
                : 'respect';
          reactions[prevKey] = Math.max(0, reactions[prevKey] - 1);
        }

        if (isToggleOff) {
          return { ...item, viewer_reaction: null, reactions };
        }

        const nextKey =
          reactionType === 'MIND_BLOWN'
            ? 'mind_blown'
            : reactionType === 'LAUGH'
              ? 'laugh'
              : 'respect';
        reactions[nextKey] = reactions[nextKey] + 1;

        return { ...item, viewer_reaction: reactionType, reactions };
      })
    );

    try {
      if (isToggleOff) {
        await deleteReaction(post.id);
      } else {
        await upsertReaction(post.id, reactionType);
      }
    } catch {
      setFeedItems(previous);
    }
  };

  useEffect(() => {
    if (!isUnlocked) {
      setFeedItems([]);
      return;
    }

    let cancelled = false;
    setFeedLoading(true);
    getTodayFeed()
      .then((page) => {
        if (!cancelled) {
          setFeedItems(page.items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFeedItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setFeedLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isUnlocked, status]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const posts = (
    <View style={isUnlocked ? undefined : styles.lockedFeed}>
      {feedLoading ? (
        <ActivityIndicator color={theme.colors.accent} />
      ) : feedItems.length === 0 ? (
        <Text style={styles.emptyText}>No submissions yet. Be the first to finish today.</Text>
      ) : (
        feedItems.map((post) => (
          <View key={post.id} style={styles.postCard}>
            <View style={styles.postTop}>
              <View style={{ alignItems: 'center', flexDirection: 'row', gap: 6 }}>
                <Feather name="crosshair" size={10} color={theme.colors.accent} />
                <Text style={styles.postUser}>{post.username}</Text>
              </View>
              <Text style={styles.postTime}>{formatPostTime(post.submitted_at)}</Text>
            </View>
            <Text style={styles.postProof}>{post.proof_preview}</Text>
            <View style={styles.reactions}>
              {REACTIONS.map((reaction) => (
                <ReactionButton
                  key={reaction.type}
                  emoji={reaction.emoji}
                  count={post.reactions[reaction.key]}
                  active={post.viewer_reaction === reaction.type}
                  onPress={() => handleReaction(post, reaction.type)}
                />
              ))}
            </View>
          </View>
        ))
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Global Feed</Text>
        <Text style={styles.headerMeta}>DAY {String(sequenceNumber).padStart(3, '0')}</Text>
      </View>

      <View style={styles.flex}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={isUnlocked}
        >
          {posts}
        </ScrollView>

        {!isUnlocked && (
          <View style={styles.overlay}>
            <View style={styles.lockBox}>
              <Feather name="eye-off" size={32} color={theme.colors.textMuted} />
            </View>
            <Text style={styles.lockTitle}>Feed Locked</Text>
            <Text style={styles.lockBody}>
              You must submit today's proof to unlock the global feed.
            </Text>
            <Pressable
              style={styles.unlockButton}
              onPress={() => navigation.navigate('Daily')}
            >
              <Text style={styles.unlockText}>Submit Proof</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
