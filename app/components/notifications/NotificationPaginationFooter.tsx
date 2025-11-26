// app/components/notifications/NotificationPaginationFooter.tsx
"use client";

import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;       // 1-based
  pageSize: number;
  total: number;
  onPageChange: (nextPage: number) => void;
  className?: string;
};

export default function NotificationPaginationFooter({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: Props) {
  if (total === 0) return null;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, total);

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  const goPrev = () => {
    if (!canPrev) return;
    onPageChange(currentPage - 1);
  };

  const goNext = () => {
    if (!canNext) return;
    onPageChange(currentPage + 1);
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between border-t bg-background px-4 py-2 text-xs text-muted-foreground",
        className,
      )}
    >
      <span>
        Mostrando{" "}
        <span className="font-medium text-foreground">
          {from}–{to}
        </span>{" "}
        de{" "}
        <span className="font-medium text-foreground">
          {total}
        </span>
      </span>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={goPrev}
          disabled={!canPrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="mx-1 text-[11px]">
          Página {currentPage} / {totalPages}
        </span>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={goNext}
          disabled={!canNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
