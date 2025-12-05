export default function CheckoutSkeleton() {
    return (
        <div className="max-w-7xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="space-y-2">
                            <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    </div>
                    <div className="h-8 w-32 bg-gray-200 rounded-full animate-pulse"></div>
                </div>

                {/* Body Skeleton */}
                <div className="flex gap-6 flex-col lg:flex-row">
                    {/* Payment Methods Skeleton */}
                    <div className="flex-1">
                        <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col lg:flex-row bg-neutral-50">
                            {/* Tabs Skeleton */}
                            <div className="flex lg:flex-col lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-200">
                                {[1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className="flex-1 border-b border-gray-200 last:border-b-0 py-4 px-4 bg-gray-50"
                                    >
                                        <div className="flex gap-3 items-center">
                                            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                                            <div className="space-y-2 flex-1">
                                                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                                                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Payment Form Skeleton */}
                            <div className="lg:w-2/3 p-4 bg-white space-y-4">
                                <div className="space-y-2">
                                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                                    <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                                    <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                                    </div>
                                </div>
                                <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Skeleton */}
                    <div className="lg:w-80 space-y-4">
                        {/* Price Breakdown Skeleton */}
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 space-y-3">
                            <div className="h-5 w-32 bg-blue-200 rounded animate-pulse"></div>
                            <div className="space-y-2.5">
                                {[1, 2].map((i) => (
                                    <div key={i} className="flex justify-between items-center">
                                        <div className="h-4 w-24 bg-blue-200 rounded animate-pulse"></div>
                                        <div className="h-4 w-16 bg-blue-200 rounded animate-pulse"></div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-dashed border-blue-200 my-3"></div>
                            <div className="flex justify-between items-center">
                                <div className="h-4 w-28 bg-blue-300 rounded animate-pulse"></div>
                                <div className="h-6 w-20 bg-blue-300 rounded animate-pulse"></div>
                            </div>
                        </div>

                        {/* Items Skeleton */}
                        <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
                            <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
                            <div className="space-y-2">
                                {[1, 2].map((i) => (
                                    <div key={i} className="flex justify-between items-start">
                                        <div className="flex-1 space-y-1.5">
                                            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                                            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                                        </div>
                                        <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Offers Skeleton */}
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 w-36 bg-green-200 rounded animate-pulse"></div>
                                    <div className="h-3 w-48 bg-green-200 rounded animate-pulse"></div>
                                </div>
                                <div className="flex gap-1">
                                    <div className="w-8 h-8 bg-green-200 rounded-full animate-pulse"></div>
                                    <div className="w-8 h-8 bg-green-200 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
