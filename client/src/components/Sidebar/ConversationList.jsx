import ConversationItem from './ConversationItem';

const ConversationList = ({ conversations, activeId, onSelect }) => {
  return (
    <div className="py-2 space-y-1">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation._id}
          conversation={conversation}
          isActive={activeId === conversation._id}
          onClick={() => onSelect(conversation)}
        />
      ))}
    </div>
  );
};

export default ConversationList;