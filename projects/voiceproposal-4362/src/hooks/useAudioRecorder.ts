'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { RecorderStatus, UseAudioRecorderReturn } from '@/types/audio';

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const formatSeconds = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAnalyserNode(null);
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setErrorMessage(null);
      setStatus('permission-requested');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      setAnalyserNode(analyser);

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      // Determine supported mime type
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
      const mimeType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) || '';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunksRef.current, {
          type: mimeType || 'audio/webm',
        });
        setAudioBlob(finalBlob);
        const url = URL.createObjectURL(finalBlob);
        setAudioUrl(url);
        cleanupStream();
      };

      recorder.start(100);
      setStatus('recording');
      setRecordingTime(0);

      clearTimer();
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      cleanupStream();
      clearTimer();
      setStatus('error');
      const errObj = err as Error;
      if (errObj.name === 'NotAllowedError') {
        setErrorMessage('دسترسی به میکروفون توسط کاربر مسدود شد.');
      } else {
        setErrorMessage('خطایی در اتصال به ورودی صوتی رخ داده است.');
      }
    }
  }, [cleanupStream, clearTimer]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setStatus('stopped');
      clearTimer();
    }
  }, [clearTimer]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setStatus('paused');
      clearTimer();
    }
  }, [clearTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setStatus('recording');
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  }, []);

  const resetRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    clearTimer();
    cleanupStream();
    setStatus('idle');
    setRecordingTime(0);
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setErrorMessage(null);
  }, [clearTimer, cleanupStream, audioUrl]);

  useEffect(() => {
    return () => {
      clearTimer();
      cleanupStream();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [clearTimer, cleanupStream, audioUrl]);

  return {
    status,
    isRecording: status === 'recording',
    recordingTime,
    formattedTime: formatSeconds(recordingTime),
    audioBlob,
    audioUrl,
    analyserNode,
    errorMessage,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
  };
}