"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ITEM_PER_PAGE } from "@/lib/constants";

const DOTS = "...";

const range = (start: number, end: number) => {
  let length = end - start + 1;
  return Array.from({ length }, (_, idx) => idx + start);
};

const Pagination = ({ page, count }: { page: number; count: number }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(count / ITEM_PER_PAGE);
  const siblingCount = 1;

  const paginationRange = useMemo(() => {
    const totalPageCount = totalPages;
    const totalPageNumbers = siblingCount + 5;

    if (totalPageNumbers >= totalPageCount) {
      return range(1, totalPageCount);
    }

    const leftSiblingIndex = Math.max(page - siblingCount, 1);
    const rightSiblingIndex = Math.min(page + siblingCount, totalPageCount);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPageCount - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPageCount;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      let leftItemCount = 3 + 2 * siblingCount;
      let leftRange = range(1, leftItemCount);
      return [...leftRange, DOTS, totalPageCount];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      let rightItemCount = 3 + 2 * siblingCount;
      let rightRange = range(
        totalPageCount - rightItemCount + 1,
        totalPageCount
      );
      return [firstPageIndex, DOTS, ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      let middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
    }
  }, [totalPages, page, siblingCount]);

  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="p-4 flex items-center justify-between text-muted-foreground">
      <Button
        variant="outline"
        size="sm"
        disabled={page === 1}
        onClick={() => changePage(page - 1)}
      >
        Précédent
      </Button>

      <div className="flex items-center gap-1">
        {paginationRange?.map((pageNumber, index) => {
          if (pageNumber === DOTS) {
            return (
              <span key={`${DOTS}-${index}`} className="px-2 py-1">
                &#8230;
              </span>
            );
          }
          return (
            <Button
              key={pageNumber}
              variant={page === pageNumber ? "default" : "outline"}
              size="sm"
              onClick={() => changePage(pageNumber as number)}
              className="w-9 h-9 p-0"
            >
              {pageNumber}
            </Button>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        disabled={page === totalPages}
        onClick={() => changePage(page + 1)}
      >
        Suivant
      </Button>
    </div>
  );
};

export default Pagination;
