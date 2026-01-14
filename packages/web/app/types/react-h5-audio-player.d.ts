declare module 'react-h5-audio-player' {
  import * as React from 'react';

  export interface AudioPlayerProps {
    src?: string;
    autoPlay?: boolean;
    autoPlayAfterSrcChange?: boolean;
    className?: string;
    customAdditionalControls?: React.ReactNode[];
    customProgressBarSection?: React.ReactNode[];
    customControlsSection?: React.ReactNode[];
    customVolumeControls?: React.ReactNode[];
    customIcons?: {
      play?: React.ReactNode;
      pause?: React.ReactNode;
      rewind?: React.ReactNode;
      forward?: React.ReactNode;
      previous?: React.ReactNode;
      next?: React.ReactNode;
      loop?: React.ReactNode;
      loopOff?: React.ReactNode;
      volume?: React.ReactNode;
      volumeMute?: React.ReactNode;
    };
    defaultCurrentTime?: string;
    defaultDuration?: string;
    hasDefaultKeyBindings?: boolean;
    header?: React.ReactNode;
    footer?: React.ReactNode;
    layout?: 'stacked' | 'horizontal' | 'stacked-reverse' | 'horizontal-reverse';
    listenInterval?: number;
    loop?: boolean;
    muted?: boolean;
    onAbort?: (e: Event) => void;
    onCanPlay?: (e: Event) => void;
    onCanPlayThrough?: (e: Event) => void;
    onChangeCurrentTimeError?: () => void;
    onClickNext?: (e: React.SyntheticEvent) => void;
    onClickPrevious?: (e: React.SyntheticEvent) => void;
    onEnded?: (e: Event) => void;
    onError?: (e: Event) => void;
    onListen?: (e: Event) => void;
    onLoadedData?: (e: Event) => void;
    onLoadedMetaData?: (e: Event) => void;
    onLoadStart?: (e: Event) => void;
    onPause?: (e: Event) => void;
    onPlay?: (e: Event) => void;
    onPlayError?: (err: Error) => void;
    onPlaying?: (e: Event) => void;
    onProgress?: (e: Event) => void;
    onSeeked?: (e: Event) => void;
    onSeeking?: (e: Event) => void;
    onStalled?: (e: Event) => void;
    onSuspend?: (e: Event) => void;
    onTimeUpdate?: (e: Event) => void;
    onVolumeChange?: (e: Event) => void;
    onWaiting?: (e: Event) => void;
    preload?: 'auto' | 'metadata' | 'none';
    progressJumpStep?: number;
    progressJumpSteps?: { backward?: number; forward?: number };
    progressUpdateInterval?: number;
    showDownloadProgress?: boolean;
    showFilledProgress?: boolean;
    showFilledVolume?: boolean;
    showJumpControls?: boolean;
    showLoopControl?: boolean;
    showSkipControls?: boolean;
    showVolumeControl?: boolean;
    timeFormat?: 'auto' | 'mm:ss' | 'hh:mm:ss';
    volume?: number;
    volumeJumpStep?: number;
    children?: React.ReactNode;
    style?: React.CSSProperties;
    'data-testid'?: string;
    [key: `data-${string}`]: string | undefined;
  }

  export interface AudioPlayerRef {
    audio: React.RefObject<HTMLAudioElement>;
    progressBar: React.RefObject<HTMLDivElement>;
    container: React.RefObject<HTMLDivElement>;
    loopBar: React.RefObject<HTMLDivElement>;
    volumeBar: React.RefObject<HTMLDivElement>;
  }

  const AudioPlayer: React.ForwardRefExoticComponent<
    AudioPlayerProps & React.RefAttributes<AudioPlayerRef>
  >;

  export default AudioPlayer;

  export const RHAP_UI: {
    CURRENT_TIME: string;
    CURRENT_LEFT_TIME: string;
    PROGRESS_BAR: string;
    DURATION: string;
    ADDITIONAL_CONTROLS: string;
    MAIN_CONTROLS: string;
    VOLUME_CONTROLS: string;
    LOOP: string;
    VOLUME: string;
  };
}
