import React from 'react';
import { render, screen } from '@testing-library/react';
import { AudioRecorder } from '../src/components/AudioRecorder';

describe('AudioRecorder Component', () => {
  beforeAll(() => {
    // Mock navigator.mediaDevices
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [{ stop: jest.fn() }],
        }),
      },
      writable: true,
    });

    // Mock AudioContext
    window.AudioContext = jest.fn().mockImplementation(() => ({
      createAnalyser: () => ({
        fftSize: 512,
        smoothingTimeConstant: 0.8,
        frequencyBinCount: 256,
        getByteTimeDomainData: jest.fn(),
      }),
      createMediaStreamSource: () => ({
        connect: jest.fn(),
      }),
      close: jest.fn().mockResolvedValue(undefined),
      state: 'running',
    })) as unknown as typeof AudioContext;
  });

  it('renders initial microphone trigger button and status', () => {
    render(<AudioRecorder />);
    expect(screen.getByText(/ضبط صوتی صورت‌جلسه و پیش‌فاکتور/i)).toBeInTheDocument();
    expect(screen.getByText('00:00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /شروع ضبط/i })).toBeInTheDocument();
  });
});