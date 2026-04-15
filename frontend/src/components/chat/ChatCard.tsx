import { Card } from "@/components/ui/card";
import { formatOnlineTime, cn } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export interface ChatCardMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive";
}

interface ChatCardProps {
  convoId: string;
  name: string;
  timestamp?: Date;
  isActive: boolean;
  onSelect: (id: string) => void;
  unreadCount?: number;
  leftSection: React.ReactNode;
  subtitle: React.ReactNode;
  menuItems?: ChatCardMenuItem[];
  mutedIcon?: React.ReactNode;
}

const ChatCard = ({
  convoId,
  name,
  timestamp,
  isActive,
  onSelect,
  unreadCount,
  leftSection,
  subtitle,
  menuItems,
  mutedIcon,
}: ChatCardProps) => {
  return (
    <Card
      key={convoId}
      className={cn(
        "group border-none p-3 cursor-pointer transition-smooth glass hover:bg-muted/30",
        isActive &&
        "ring-2 ring-primary/50 bg-gradient-to-tr from-primary-glow/10 to-primary-foreground"
      )}
      onClick={() => onSelect(convoId)}
    >
      <div className="flex items-center gap-3">
        <div className="relative">{leftSection}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3
              className={cn(
                "font-semibold text-sm truncate",
                unreadCount && unreadCount > 0 && "text-foreground"
              )}
            >
              {name}
            </h3>

            <span className="text-xs text-muted-foreground">
              {timestamp ? formatOnlineTime(timestamp) : ""}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 flex-1 min-w-0">{subtitle}</div>

            <div className="flex items-center gap-1 shrink-0">
              {mutedIcon && (
                <span className="text-muted-foreground opacity-70">{mutedIcon}</span>
              )}
              {menuItems && menuItems.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="opacity-0 group-hover:opacity-100 transition-smooth rounded p-0.5 hover:bg-muted/60"
                    >
                      <MoreHorizontal className="size-5 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[200px]" onClick={(e) => e.stopPropagation()}>
                    {menuItems.map((item) => (
                      <DropdownMenuItem
                        key={item.label}
                        onClick={item.onClick}
                        className={cn(
                          "flex items-center gap-2 cursor-pointer whitespace-nowrap",
                          item.variant === "destructive" && "text-destructive focus:text-destructive"
                        )}
                      >
                        {item.icon}
                        {item.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <MoreHorizontal className="size-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-smooth" />
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ChatCard;