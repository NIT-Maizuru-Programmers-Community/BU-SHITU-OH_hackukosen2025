import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
	size?: "sm" | "md" | "lg";
	className?: string;
	label?: string;
}

export function LoadingSpinner({
	size = "md",
	className,
	label,
}: LoadingSpinnerProps) {
	const sizeClasses = {
		sm: "w-4 h-4",
		md: "w-6 h-6",
		lg: "w-8 h-8",
	};

	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-2",
				className
			)}
		>
			<Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
			{label && <p className='text-sm text-muted-foreground'>{label}</p>}
		</div>
	);
}

export function LoadingScreen({ label }: { label?: string }) {
	return (
		<div className='flex items-center justify-center min-h-[50vh]'>
			<LoadingSpinner size='lg' label={label} />
		</div>
	);
}




