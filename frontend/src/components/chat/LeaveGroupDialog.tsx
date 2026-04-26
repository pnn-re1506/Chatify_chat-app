import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";

interface LeaveGroupDialogProps {
  open: boolean;
  onClose: () => void;
  groupName: string;
  onConfirm: () => void;
}

const LeaveGroupDialog = ({ open, onClose, groupName, onConfirm }: LeaveGroupDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Leave group?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to leave <strong>{groupName}</strong>? You won&apos;t
          be able to see messages or participate anymore.
        </p>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Leave
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LeaveGroupDialog;
