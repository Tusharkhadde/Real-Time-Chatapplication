import { useState, useEffect } from 'react';
import { ExternalLink, Globe } from 'lucide-react';

export const extractUrls = (text) => {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

const LinkPreview = ({ url }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        setLoading(true);
        setError(false);
        
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace('www.', '');
        
        setPreview({
          url,
          domain,
          favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
          title: domain.charAt(0).toUpperCase() + domain.slice(1)
        });
      } catch (err) {
        console.error('Link preview error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (url) {
      fetchPreview();
    }
  }, [url]);

  if (loading) {
    return (
      <div className="mt-2 p-3 bg-muted/50 rounded-xl animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted rounded-lg" />
          <div className="flex-1">
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !preview) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex items-center gap-3 p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors group"
    >
      <div className="flex-shrink-0 w-10 h-10 bg-background rounded-lg flex items-center justify-center overflow-hidden">
        <img
          src={preview.favicon}
          alt=""
          className="w-6 h-6 object-contain"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div className="hidden w-6 h-6 items-center justify-center">
          <Globe className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{preview.title}</p>
        <p className="text-xs text-muted-foreground truncate">{preview.domain}</p>
      </div>

      <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </a>
  );
};

export default LinkPreview;