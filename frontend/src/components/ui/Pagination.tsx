import { Button } from "./Button";

type Props = {
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onPage: (page: number) => void;
};

export const Pagination = ({ page, totalPages, hasNextPage, hasPreviousPage, onPage }: Props) => (
  <nav className="flex items-center justify-center gap-3 py-6" aria-label="Pagination">
    <Button variant="secondary" disabled={!hasPreviousPage} onClick={() => onPage(page - 1)}>
      Previous
    </Button>
    <span className="text-sm text-muted">
      Page {page} of {Math.max(totalPages, 1)}
    </span>
    <Button variant="secondary" disabled={!hasNextPage} onClick={() => onPage(page + 1)}>
      Next
    </Button>
  </nav>
);
