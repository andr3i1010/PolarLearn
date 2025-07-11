import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Button1 from "@/components/button/Button1";

interface BetaDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BetaDialog = ({ isOpen, onClose }: BetaDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leren [BETA]</DialogTitle>
          <DialogDescription>
            Leren is nog in beta. Er kunnen nog bugs en onvolkomenheden zijn.
            We werken er hard aan om de ervaring te verbeteren!
            Maar probeer ook zelf te melden als je een bug ziet, Bedankt!
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button1
            text="Begrepen!"
            onClick={onClose}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
