import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DetailItemProps {
    label: string;
    value: string;
    onCopy?: () => void;
    copied?: boolean;
    icon?: React.ReactNode;
    className?: string;
    mobile?: boolean;
    compact?: boolean;
}

export default function DetailItem({
    label,
    value,
    onCopy,
    copied,
    icon,
    className = "",
    mobile = false,
    compact = false
}: DetailItemProps) {
    return (
        <div className={`flex flex-col ${compact ? 'sm:flex-row' : 'sm:flex-row'} sm:justify-between sm:items-center py-2 border-b border-gray-100 last:border-b-0 gap-1 sm:gap-2 ${className}`}>
            <span className={`font-bold text-gray-700 flex items-center gap-1 ${compact ? 'text-xs sm:text-sm' : 'text-sm'} min-w-[80px] sm:min-w-[100px]`}>
                {icon}
                {label}
            </span>

            <div className="flex items-center gap-2 justify-between sm:justify-end w-full sm:w-auto">
                <div className={`w-full font-mono text-gray-800 break-all ${compact ? 'text-xs sm:text-sm' : 'text-sm'} ${mobile ? 'max-w-[200px]' : 'max-w-[280px] sm:max-w-[280px]'}`}>
                    {value}
                </div>
                {onCopy && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 sm:h-6 sm:w-6 p-0 hover:bg-gray-100 flex-shrink-0"
                        onClick={onCopy}
                    >
                        {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </Button>
                )}
            </div>
        </div>
    );
}