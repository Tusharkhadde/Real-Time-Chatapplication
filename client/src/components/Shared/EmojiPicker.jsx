import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';

const EMOJI_DATA = {
  recent: ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉'],
  smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐'],
  gestures: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄'],
  hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🪲', '🪳', '🦟', '🦗', '🕷️'],
  food: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕'],
  activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂'],
  objects: ['⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌'],
  symbols: ['❤️', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '✨', '⭐', '🌟', '💫', '⚡', '🔥', '💥', '❄️', '☀️', '🌈', '☁️', '🌙', '✅', '❌', '❓', '❗', '➕', '➖', '➗', '✖️', '♾️', '💲', '💱']
};

const CATEGORIES = [
  { id: 'recent', emoji: '🕐', name: 'Recent' },
  { id: 'smileys', emoji: '😀', name: 'Smileys' },
  { id: 'gestures', emoji: '👋', name: 'Gestures' },
  { id: 'hearts', emoji: '❤️', name: 'Hearts' },
  { id: 'animals', emoji: '🐶', name: 'Animals' },
  { id: 'food', emoji: '🍎', name: 'Food' },
  { id: 'activities', emoji: '⚽', name: 'Activities' },
  { id: 'objects', emoji: '💡', name: 'Objects' },
  { id: 'symbols', emoji: '❤️', name: 'Symbols' }
];

const EmojiPicker = ({ onSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('smileys');
  const [searchQuery, setSearchQuery] = useState('');
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const getDisplayEmojis = () => {
    if (searchQuery) {
      return Object.values(EMOJI_DATA).flat();
    }
    return EMOJI_DATA[activeCategory] || [];
  };

  return (
    <div
      ref={pickerRef}
      className="w-80 bg-popover border rounded-xl shadow-xl overflow-hidden"
    >
      {/* Search */}
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search emojis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Categories */}
      {!searchQuery && (
        <div className="flex border-b overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`
                flex-shrink-0 p-2.5 text-lg transition-colors
                ${activeCategory === cat.id 
                  ? 'bg-primary/10 border-b-2 border-primary' 
                  : 'hover:bg-muted'
                }
              `}
              title={cat.name}
            >
              {cat.emoji}
            </button>
          ))}
        </div>
      )}

      {/* Emojis Grid */}
      <div className="p-2 h-52 overflow-y-auto">
        <div className="grid grid-cols-8 gap-0.5">
          {getDisplayEmojis().map((emoji, index) => (
            <button
              key={`${emoji}-${index}`}
              onClick={() => onSelect(emoji)}
              className="p-1.5 text-xl hover:bg-muted rounded transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmojiPicker;