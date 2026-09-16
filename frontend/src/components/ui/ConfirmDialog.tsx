import { Modal } from "./Modal";
import { Button } from "./Button";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
};

export const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onClose,
}: Props) => (
  <Modal open={open} title={title} onClose={onClose}>
    <p className="mb-5 text-muted">{message}</p>
    <div className="flex justify-end gap-2">
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button
        variant="danger"
        onClick={() => {
          onConfirm();
          onClose();
        }}
      >
        {confirmLabel}
      </Button>
    </div>
  </Modal>
);
