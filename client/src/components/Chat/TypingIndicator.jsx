const TypingIndicator = ({ usernames }) => {
  if (!usernames || usernames.length === 0) return null;

  let text;
  if (usernames.length === 1) {
    text = `${usernames[0]} is typing`;
  } else if (usernames.length === 2) {
    text = `${usernames[0]} and ${usernames[1]} are typing`;
  } else {
    text = `${usernames.length} people are typing`;
  }

  return (
    <div className="px-4 py-2 bg-background/80 backdrop-blur border-t">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-primary rounded-full typing-dot" />
          <span className="w-2 h-2 bg-primary rounded-full typing-dot" />
          <span className="w-2 h-2 bg-primary rounded-full typing-dot" />
        </div>
        <span>{text}</span>
      </div>
    </div>
  );
};

export default TypingIndicator;