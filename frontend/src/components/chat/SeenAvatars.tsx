import { cn } from "@/lib/utils";
import type { Participant } from "@/types/chat";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface SeenAvatarsProps {
  seenUsers: Participant[];
}

const SeenAvatars = ({ seenUsers }: SeenAvatarsProps) => {
  if (!seenUsers || seenUsers.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center justify-end -space-x-1.5 mt-0.5">
        {seenUsers.slice(0, 5).map((u) => (
          <Tooltip key={u._id}>
            <TooltipTrigger asChild>
              <Avatar
                className={cn(
                  "size-4 border border-background ring-0 cursor-default"
                )}
              >
                {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt={u.displayName} />}
                <AvatarFallback className="text-[8px] bg-primary/20 text-primary">
                  {u.displayName?.charAt(0)?.toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {u.displayName}
            </TooltipContent>
          </Tooltip>
        ))}
        {seenUsers.length > 5 && (
          <span className="text-[9px] text-muted-foreground ml-1">
            +{seenUsers.length - 5}
          </span>
        )}
      </div>
    </TooltipProvider>
  );
};

export default SeenAvatars;
