import { cn } from "@/lib/utils";

const StatusBadge = ({
  status,
  className,
}: {
  status: "online" | "offline";
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "absolute -bottom-0.5 -right-0.5 size-4 rounded-full border-2 border-card",
        status === "online" && "status-online",
        status === "offline" && "status-offline",
        className
      )}
    ></div>
  );
};

export default StatusBadge;