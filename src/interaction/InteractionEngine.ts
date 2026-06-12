import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

import { AudioType, HapticType, InteractionMeta } from '../api/types';
import { soundAssets } from './soundMap';

const loadedSounds = new Map<AudioType, Audio.Sound>();
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

async function ensureSoundLoaded(audio: AudioType): Promise<Audio.Sound> {
  const cached = loadedSounds.get(audio);
  if (cached) {
    return cached;
  }

  const { sound } = await Audio.Sound.createAsync(soundAssets[audio], {
    shouldPlay: false,
    volume: 1,
  });
  loadedSounds.set(audio, sound);
  return sound;
}

export async function preloadInteractionSounds(): Promise<void> {
  if (!preloadPromise) {
    preloadPromise = (async () => {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });

      await Promise.all(
        (Object.keys(soundAssets) as AudioType[]).map((audio) => ensureSoundLoaded(audio))
      );
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
  const sound = await ensureSoundLoaded(audio);
  const volume = Math.max(0, Math.min(1, intensity));

  try {
    await sound.setPositionAsync(0);
    await sound.setVolumeAsync(volume);
    await sound.playAsync();
  } catch {
    const { sound: fresh } = await Audio.Sound.createAsync(soundAssets[audio], {
      shouldPlay: true,
      volume,
    });
    loadedSounds.set(audio, fresh);
  }
}

export const InteractionEngine = {
  preload: preloadInteractionSounds,
  fire: fireInteraction,
};
