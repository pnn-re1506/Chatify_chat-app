import { useState } from "react";
import { Pin, Palette, Users, ImageIcon, ShieldAlert } from "lucide-react";
import type { Conversation } from "@/types/chat";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSocketStore } from "@/stores/useSocketStore";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

import ConversationHero from "./ConversationHero";
import QuickActionBar from "./QuickActionBar";
import ChatInfoSection from "./ChatInfoSection";
import CustomizeChatSection from "./CustomizeChatSection";
import ChatMembersSection from "./ChatMembersSection";
import MediaFilesSection from "./MediaFilesSection";
import PrivacySupportSection from "./PrivacySupportSection";
import ConversationSearch from "./ConversationSearch";

interface ConversationDetailsProps {
  chat: Conversation;
  isOpen: boolean;
}

const ConversationDetails = ({ chat, isOpen }: ConversationDetailsProps) => {
  const { user } = useAuthStore();
  const { onlineUsers } = useSocketStore();
  const [searchOpen, setSearchOpen] = useState(false);

  const isDirect = chat.type === "direct";
  const otherUser = isDirect
    ? chat.participants.find((p) => p._id !== user?._id) ?? null
    : null;

  const isOtherOnline = otherUser ? onlineUsers.includes(otherUser._id) : false;

  const onlineCount = isDirect
    ? 0
    : chat.participants.filter(
      (p) => p._id !== user?._id && onlineUsers.includes(p._id)
    ).length;

  return (
    <aside
      className={cn(
        "h-full w-80 shrink-0 flex flex-col bg-background border border-border rounded-sm shadow-md",
        "transition-all duration-300 ease-in-out overflow-hidden",
        isOpen ? "opacity-100" : "w-0 opacity-0 border-0 pointer-events-none"
      )}
    >
      {searchOpen ? (
        <ConversationSearch
          conversationId={chat._id}
          onClose={() => setSearchOpen(false)}
        />
      ) : (
        <div className="flex-1 overflow-y-auto beautiful-scrollbar">
          <ConversationHero
            chat={chat}
            isDirect={isDirect}
            otherUser={otherUser}
            isOtherOnline={isOtherOnline}
            onlineCount={onlineCount}
          />

          <QuickActionBar
            chat={chat}
            isDirect={isDirect}
            otherUser={otherUser}
            onSearchOpen={() => setSearchOpen(true)}
          />

          <Separator />

          <Accordion type="multiple" className="px-3">
            <AccordionItem value="chat-info">
              <AccordionTrigger className="text-sm gap-2">
                <div className="flex items-center gap-2">
                  <Pin size={15} className="text-muted-foreground" />
                  Chat info
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ChatInfoSection chat={chat} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="customize">
              <AccordionTrigger className="text-sm gap-2">
                <div className="flex items-center gap-2">
                  <Palette size={15} className="text-muted-foreground" />
                  Customize chat
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <CustomizeChatSection chat={chat} isDirect={isDirect} />
              </AccordionContent>
            </AccordionItem>

            {!isDirect && (
              <AccordionItem value="members">
                <AccordionTrigger className="text-sm gap-2">
                  <div className="flex items-center gap-2">
                    <Users size={15} className="text-muted-foreground" />
                    Chat members
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ChatMembersSection chat={chat} />
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="media">
              <AccordionTrigger className="text-sm gap-2">
                <div className="flex items-center gap-2">
                  <ImageIcon size={15} className="text-muted-foreground" />
                  Media &amp; files
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <MediaFilesSection chat={chat} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="privacy">
              <AccordionTrigger className="text-sm gap-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={15} className="text-muted-foreground" />
                  Privacy &amp; support
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <PrivacySupportSection chat={chat} isDirect={isDirect} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </aside>
  );
};

export default ConversationDetails;
