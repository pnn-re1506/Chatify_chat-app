import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { chatService } from "@/services/chatService";
import UserAvatar from "./UserAvatar";

interface UserBioDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  displayName: string;
}

interface ProfileData {
  _id: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
}

const UserBioDialog = ({ open, onClose, userId, displayName }: UserBioDialogProps) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    chatService
      .getUserProfile(userId)
      .then((data) => setProfile(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open, userId]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>View Profile</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 flex justify-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4">
            <UserAvatar
              type="profile"
              name={profile?.displayName ?? displayName}
              avatarUrl={profile?.avatarUrl ?? undefined}
            />
            <p className="font-semibold text-lg">{profile?.displayName ?? displayName}</p>
            <div className="w-full space-y-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Bio</p>
              <p className="text-sm text-foreground whitespace-pre-wrap break-words min-h-[40px]">
                {profile?.bio ?? "No bio available."}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserBioDialog;
