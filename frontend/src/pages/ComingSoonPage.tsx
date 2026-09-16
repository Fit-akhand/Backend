import { EmptyState } from "@/components/ui/EmptyState";

export const ComingSoonPage = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <EmptyState title={title} description={description} />
);
