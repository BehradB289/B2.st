export type RecorderStatus =
  | 'idle'
  | 'permission-requested'
  | 'recording'
  | 'paused'
  | 'stopped'
  | 'error';

export interface UseAudioRecorderReturn {
  status: RecorderStatus;
  isRecording: boolean;
  recordingTime: number;
  formattedTime: string;
  audioBlob: Blob | null;
  audioUrl: string | null;
  analyserNode: AnalyserNode | null;
  errorMessage: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;
}