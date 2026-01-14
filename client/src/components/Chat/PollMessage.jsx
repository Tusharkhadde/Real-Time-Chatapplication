import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const PollMessage = ({ message, onVote }) => {
  const { user } = useAuth();
  const poll = message.poll;

  const totalVotes = poll.options.reduce(
    (sum, o) => sum + o.votes.length,
    0
  );

  const hasVoted = (option) =>
    option.votes.includes(user._id);

  return (
    <div className="space-y-2">
      <p className="font-semibold">{message.content}</p>

      {poll.options.map((option) => {
        const percentage = totalVotes
          ? Math.round((option.votes.length / totalVotes) * 100)
          : 0;

        return (
          <div key={option.id} className="border rounded-lg p-2">
            <div className="flex justify-between text-sm">
              <span>{option.text}</span>
              <span>{percentage}%</span>
            </div>

            <div className="h-2 bg-muted rounded mt-1">
              <div
                className="h-full bg-primary rounded"
                style={{ width: `${percentage}%` }}
              />
            </div>

            <Button
              size="sm"
              variant={hasVoted(option) ? "secondary" : "outline"}
              className="mt-2 w-full"
              onClick={() => onVote(option.id)}
            >
              {hasVoted(option) ? "Voted" : "Vote"}
            </Button>
          </div>
        );
      })}

      <p className="text-xs text-muted-foreground">
        {totalVotes} votes
      </p>
    </div>
  );
};

export default PollMessage;
