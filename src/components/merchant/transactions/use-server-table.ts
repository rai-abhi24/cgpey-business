"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

interface ServerTableOptions<TFilters extends Record<string, any>> {
    endpoint: string;
    params: TFilters;
    limit?: number;
    enabled?: boolean;
}

interface ServerResponse<T> {
    success: boolean;
    data: T[];
    nextCursor: string | null;
    metrics?: {
        totalCount: number;
        totalAmount: number;
        successRate: number;
    };
}

export function useServerTable<TData, TFilters extends Record<string, any>>(options: ServerTableOptions<TFilters>) {
    const { endpoint, params, limit = 25, enabled = true } = options;

    const query = useInfiniteQuery<ServerResponse<TData>>({
        queryKey: [endpoint, params, limit],
        queryFn: async ({ pageParam }) => {
            const searchParams = new URLSearchParams();
            Object.entries(params || {}).forEach(([key, value]) => {
                if (value !== undefined && value !== "" && value !== null) {
                    searchParams.set(key, String(value));
                }
            });
            searchParams.set("limit", String(limit));
            if (pageParam) {
                searchParams.set("cursor", String(pageParam));
            }
            const url = `${endpoint}?${searchParams.toString()}`;
            const res = await fetch(url, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to load data");
            return res.json();
        },
        enabled,
        getNextPageParam: (lastPage) => lastPage?.nextCursor || undefined,
        initialPageParam: null,
    });

    const rows = query.data?.pages.flatMap((page) => page?.data || []) ?? [];
    const metrics = query.data?.pages[0]?.metrics;

    return {
        rows,
        metrics,
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        fetchNextPage: query.fetchNextPage,
        hasNextPage: query.hasNextPage,
        isFetchingNextPage: query.isFetchingNextPage,
        refetch: query.refetch,
    };
}
