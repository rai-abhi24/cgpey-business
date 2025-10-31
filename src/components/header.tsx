import { useHeader } from "@/hooks/use-header";

export default function Header({ title, desc }: any) {
    const header = useHeader();
    const resolvedTitle = title ?? header.title;
    const resolvedDesc = desc ?? header.desc;
    return (
        <header className="flex items-center justify-between p-4 border-b bg-background" data-testid="app-header">
            <div className="flex items-center gap-2">
                <div className="ml-10">
                    <p className="text-lg font-semibold">{resolvedTitle}</p>
                    <p className="text-sm text-gray-600">{resolvedDesc}</p>
                </div>
            </div>
        </header>
    )
}