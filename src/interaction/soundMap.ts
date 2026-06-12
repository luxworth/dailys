import { AudioType } from '../api/types';

export const soundAssets: Record<AudioType, number> = {
  CALCULATOR_CLICK: require('../../assets/sounds/calculator_click.wav'),
  ORCHESTRA_CRESCENDO: require('../../assets/sounds/orchestra_crescendo.wav'),
  MATCH_STRIKE: require('../../assets/sounds/match_strike.wav'),
  PLASMA_IGNITION: require('../../assets/sounds/plasma_ignition.wav'),
  ERROR_DULL: require('../../assets/sounds/error_dull.wav'),
};
