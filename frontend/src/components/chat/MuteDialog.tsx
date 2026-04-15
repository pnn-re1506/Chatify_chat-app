import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";

interface MuteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (durationMs: number | null) => void;
}

const MUTE_OPTIONS: { label: string; value: number | null }[] = [
  { label: "For 15 minutes", value: 15 * 60 * 1000 },
  { label: "For 1 hour", value: 60 * 60 * 1000 },
  { label: "For 8 hours", value: 8 * 60 * 60 * 1000 },
  { label: "For 24 hours", value: 24 * 60 * 60 * 1000 },
  { label: "Until I turn it back on", value: null },
];

const MuteDialog = ({ open, onClose, onConfirm }: MuteDialogProps) => {
  const [selected, setSelected] = useState<number | null>(MUTE_OPTIONS[0].value);

  const handleConfirm = () => {
    onConfirm(selected);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Mute Notifications</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {MUTE_OPTIONS.map((opt) => (
            <label
              key={String(opt.value)}
              className="flex items-center gap-3 cursor-pointer rounded-md px-3 py-2 hover:bg-muted/50 transition-colors"
            >
              <input
                type="radio"
                name="mute-duration"
                checked={selected === opt.value}
                onChange={() => setSelected(opt.value)}
                className="accent-primary"
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Mute Notifications</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MuteDialog;
