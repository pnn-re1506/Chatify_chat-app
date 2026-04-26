import { useEffect, useState } from "react";
import { Image, FileText } from "lucide-react";
import { chatService } from "@/services/chatService";
import type { Conversation, MediaItem } from "@/types/chat";
import { Button } from "../ui/button";

interface MediaFilesSectionProps {
  chat: Conversation;
}

type Tab = "images" | "files";

const MediaFilesSection = ({ chat }: MediaFilesSectionProps) => {
  const [tab, setTab] = useState<Tab>("images");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMedia = async (cursor?: string) => {
    setLoading(true);
    try {
      const res = await chatService.getMedia(chat._id, tab, 20, cursor);
      setMedia((prev) => (cursor ? [...prev, ...res.media] : res.media));
      setNextCursor(res.nextCursor);
    } catch (error) {
      console.error("Error fetching media", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMedia([]);
    setNextCursor(null);
    fetchMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat._id, tab]);

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-lg bg-muted/40 p-1">
        <TabButton
          active={tab === "images"}
          onClick={() => setTab("images")}
          icon={<Image size={14} />}
          label="Media"
        />
        <TabButton
          active={tab === "files"}
          onClick={() => setTab("files")}
          icon={<FileText size={14} />}
          label="Files"
        />
      </div>

      {loading && media.length === 0 ? (
        <div className="py-4 text-center text-xs text-muted-foreground">
          Loading...
        </div>
      ) : media.length === 0 ? (
        <div className="py-4 text-center text-xs text-muted-foreground">
          No {tab === "images" ? "media" : "files"} shared yet
        </div>
      ) : tab === "images" ? (
        <div className="grid grid-cols-3 gap-1">
          {media.map((item) => (
            <a
              key={item._id}
              href={item.imgUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="aspect-square rounded-md overflow-hidden hover:opacity-80 transition-opacity"
            >
              <img
                src={item.imgUrl}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </a>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {media.map((item) => (
            <a
              key={item._id}
              href={item.imgUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted/60 transition-colors"
            >
              <FileText size={16} className="text-muted-foreground shrink-0" />
              <span className="truncate text-foreground">
                {item.imgUrl.split("/").pop() ?? "File"}
              </span>
            </a>
          ))}
        </div>
      )}

      {nextCursor && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={() => fetchMedia(nextCursor)}
          disabled={loading}
        >
          {loading ? "Loading..." : "Load more"}
        </Button>
      )}
    </div>
  );
};

const TabButton = ({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 flex-1 justify-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
      active
        ? "bg-background shadow-sm text-foreground"
        : "text-muted-foreground hover:text-foreground"
    }`}
  >
    {icon}
    {label}
  </button>
);

export default MediaFilesSection;
