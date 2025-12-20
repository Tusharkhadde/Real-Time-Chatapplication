import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

const VoiceMessage = ({ url, duration: initialDuration, isOwn }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

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

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    if (audioRef.current) {
      audioRef.current.currentTime = percent * duration;
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Generate waveform bars (visual only)
  const bars = Array.from({ length: 30 }, (_, i) => {
    const height = Math.sin(i * 0.5) * 0.5 + Math.random() * 0.5;
    return Math.max(0.2, Math.min(1, height));
  });

  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <audio ref={audioRef} src={url} preload="metadata" />

      {/* Play button */}
      <button
        onClick={togglePlay}
        className={`
          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
          transition-colors
          ${isOwn 
            ? 'bg-primary-foreground/20 hover:bg-primary-foreground/30' 
            : 'bg-primary/10 hover:bg-primary/20'
          }
        `}
      >
        {isPlaying ? (
          <Pause className={`h-5 w-5 ${isOwn ? 'text-primary-foreground' : 'text-primary'}`} />
        ) : (
          <Play className={`h-5 w-5 ml-0.5 ${isOwn ? 'text-primary-foreground' : 'text-primary'}`} />
        )}
      </button>

      <div className="flex-1 space-y-1">
        {/* Waveform */}
        <div 
          className="flex items-center gap-0.5 h-6 cursor-pointer"
          onClick={handleProgressClick}
        >
          {bars.map((height, i) => {
            const isActive = (i / bars.length) * 100 <= progress;
            return (
              <div
                key={i}
                className={`
                  w-1 rounded-full transition-all
                  ${isActive 
                    ? isOwn ? 'bg-primary-foreground' : 'bg-primary'
                    : isOwn ? 'bg-primary-foreground/40' : 'bg-primary/40'
                  }
                `}
                style={{ height: `${height * 100}%` }}
              />
            );
          })}
        </div>

        {/* Time */}
        <div className={`flex justify-between text-xs ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default VoiceMessage;