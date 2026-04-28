import { FaturaStatus, STATUS_LABELS, STATUS_COLORS } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function StatusBadge({ status }: { status: FaturaStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        STATUS_COLORS[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
