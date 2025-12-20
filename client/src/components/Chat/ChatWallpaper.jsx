import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Label } from '@components/ui/label';
import storage from '@services/storage';

const WALLPAPERS = [
  { id: 'none', name: 'None', value: null },
  { id: 'gradient1', name: 'Gradient 1', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'gradient2', name: 'Gradient 2', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 'gradient3', name: 'Gradient 3', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: 'gradient4', name: 'Gradient 4', value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { id: 'gradient5', name: 'Gradient 5', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { id: 'pattern1', name: 'Dots', value: 'radial-gradient(circle, #00000010 1px, transparent 1px)', size: '20px 20px' },
  { id: 'pattern2', name: 'Grid', value: 'linear-gradient(#00000008 1px, transparent 1px), linear-gradient(90deg, #00000008 1px, transparent 1px)', size: '20px 20px' },
];

const COLORS = [
  '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1',
  '#fef2f2', '#fee2e2', '#fecaca', '#fca5a5',
  '#fffbeb', '#fef3c7', '#fde68a', '#fcd34d',
  '#ecfdf5', '#d1fae5', '#a7f3d0', '#6ee7b7',
  '#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd',
  '#f5f3ff', '#ede9fe', '#ddd6fe', '#c4b5fd',
  '#fdf4ff', '#fae8ff', '#f5d0fe', '#e879f9',
];

const ChatWallpaper = ({ onSelect, currentWallpaper }) => {
  const [selected, setSelected] = useState(currentWallpaper || 'none');
  const [selectedColor, setSelectedColor] = useState(null);

  const handleSelect = (wallpaper) => {
    setSelected(wallpaper.id);
    setSelectedColor(null);
    onSelect?.(wallpaper);
    storage.set('chatWallpaper', wallpaper);
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    setSelected(null);
    const wallpaper = { id: 'color', name: 'Color', value: color };
    onSelect?.(wallpaper);
    storage.set('chatWallpaper', wallpaper);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Wallpapers</Label>
        <div className="grid grid-cols-4 gap-2 mt-2">
          {WALLPAPERS.map((wallpaper) => (
            <button
              key={wallpaper.id}
              onClick={() => handleSelect(wallpaper)}
              className={`relative h-16 rounded-lg border-2 transition-all overflow-hidden ${
                selected === wallpaper.id
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-muted hover:border-muted-foreground/50'
              }`}
              style={{
                background: wallpaper.value || '#f1f5f9',
                backgroundSize: wallpaper.size
              }}
            >
              {selected === wallpaper.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                  <Check className="h-4 w-4 text-primary" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium">Solid Colors</Label>
        <div className="grid grid-cols-8 gap-2 mt-2">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => handleColorSelect(color)}
              className={`h-8 w-8 rounded-full border-2 transition-all ${
                selectedColor === color
                  ? 'border-primary ring-2 ring-primary/20 scale-110'
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ background: color }}
            >
              {selectedColor === color && (
                <Check className="h-4 w-4 text-primary mx-auto" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatWallpaper;