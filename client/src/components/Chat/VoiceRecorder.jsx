import { useState, useRef, useEffect } from 'react';
import { Button } from '@components/ui/button';
import { Mic, Square, Send, X, Pause, Play, Loader2, Trash2 } from 'lucide-react';

const VoiceRecorder = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sending, setSending] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    // Auto-start recording when component mounts
    startRecording();
    
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(track => track.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const togglePause = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        timerRef.current = setInterval(() => {
          setDuration(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        clearInterval(timerRef.current);
      }
      setIsPaused(!isPaused);
    }
  };

  const handleCancel = () => {
    cleanup();
    onCancel();
  };

  const handleSend = async () => {
    if (!audioBlob) return;

    setSending(true);
    try {
      const file = new File([audioBlob], `voice-${Date.now()}.webm`, {
        type: 'audio/webm'
      });
      await onSend(file, duration);
    } catch (err) {
      console.error('Error sending voice message:', err);
    } finally {
      setSending(false);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => setIsPlaying(false);
    }
  }, [audioUrl]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate animated bars
  const bars = Array.from({ length: 40 }, (_, i) => ({
    height: Math.random() * 0.6 + 0.2,
    delay: i * 0.02
  }));

  return (
    <div className="flex items-center gap-4">
      {/* Cancel button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 rounded-full text-destructive hover:bg-destructive/10"
        onClick={handleCancel}
      >
        <Trash2 className="h-5 w-5" />
      </Button>

      {/* Recording info */}
      <div className="flex-1 flex items-center gap-3">
        {isRecording && (
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-red-500">
              {isPaused ? 'Paused' : 'Recording'}
            </span>
          </span>
        )}

        {/* Waveform visualization */}
        <div className="flex-1 flex items-center justify-center gap-0.5 h-10">
          {bars.map((bar, i) => (
            <div
              key={i}
              className={`
                w-1 rounded-full transition-all duration-150
                ${isRecording && !isPaused 
                  ? 'bg-primary animate-pulse' 
                  : 'bg-muted-foreground/30'
                }
              `}
              style={{
                height: isRecording && !isPaused 
                  ? `${bar.height * 100}%` 
                  : '20%',
                animationDelay: `${bar.delay}s`
              }}
            />
          ))}
        </div>

        {/* Duration */}
        <span className="text-sm font-mono font-medium min-w-[48px] text-center">
          {formatDuration(duration)}
        </span>
      </div>

      {/* Controls */}
      {isRecording ? (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={togglePause}
          >
            {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
          </Button>
          <Button
            size="icon"
            className="h-12 w-12 rounded-full bg-primary"
            onClick={stopRecording}
          >
            <Square className="h-5 w-5" />
          </Button>
        </>
      ) : audioUrl ? (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <audio ref={audioRef} src={audioUrl} />
          <Button
            size="icon"
            className="h-12 w-12 rounded-full bg-primary"
            onClick={handleSend}
            disabled={sending}
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </>
      ) : null}
    </div>
  );
};

export default VoiceRecorder;