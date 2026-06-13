import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

import { AudioType, HapticType, InteractionMeta } from '../api/types';
import { soundAssets } from './soundMap';

const loadedSounds = new Map<AudioType, AudioPlayer>();
let preloadPromise: Promise<void> | null = null;

async function playHaptic(haptic: HapticType): Promise<void> {
  switch (haptic) {
    case 'HEAVY':
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      break;
    case 'MEDIUM':
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'LIGHT':
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case 'SUCCESS_CHIME':
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'FAILURE_BUZZ':
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
    default:
      break;
  }
}

function ensureSoundLoaded(audio: AudioType): AudioPlayer {
  const cached = loadedSounds.get(audio);
  if (cached) {
    return cached;
  }

  const player = createAudioPlayer(soundAssets[audio]);
  loadedSounds.set(audio, player);
  return player;
}

export async function preloadInteractionSounds(): Promise<void> {
  if (!preloadPromise) {
    preloadPromise = (async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          interruptionMode: 'duckOthers',
        });

        for (const audio of Object.keys(soundAssets) as AudioType[]) {
          ensureSoundLoaded(audio);
        }
      } catch {
        preloadPromise = null;
      }
    })();
  }

  await preloadPromise;
}

export async function fireInteraction(meta: InteractionMeta): Promise<void> {
  await Promise.all([
    playHaptic(meta.haptic),
    meta.audio ? playAudio(meta.audio, meta.intensity) : Promise.resolve(),
  ]);
}

async function playAudio(audio: AudioType, intensity: number): Promise<void> {
  const volume = Math.max(0, Math.min(1, intensity));

  try {
    const player = ensureSoundLoaded(audio);
    player.volume = volume;
    await player.seekTo(0);
    player.play();
  } catch {
    loadedSounds.get(audio)?.remove();
    const fresh = createAudioPlayer(soundAssets[audio]);
    loadedSounds.set(audio, fresh);
    fresh.volume = volume;
    fresh.play();
  }
}

export const InteractionEngine = {
  preload: preloadInteractionSounds,
  fire: fireInteraction,
};
