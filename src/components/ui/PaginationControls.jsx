import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PaginationControls({ page, setPage, hasMore, isLoading }) {
    return (
        <div className="flex items-center justify-end gap-2 mt-4">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
            >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Назад
            </Button>

            <span className="text-sm font-medium min-w-[3rem] text-center">
                Стр. {page}
            </span>

            <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={!hasMore || isLoading}
            >
                Вперед
                <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
        </div>
    );
}
