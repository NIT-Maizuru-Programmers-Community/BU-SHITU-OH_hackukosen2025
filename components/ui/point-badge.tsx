import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PointBadgeProps {
	points: number;
	showTrend?: boolean;
	trend?: "up" | "down" | "neutral";
	className?: string;
	size?: "sm" | "md" | "lg";
}

export function PointBadge({
	points,
	showTrend = false,
	trend = "neutral",
	className,
	size = "md",
}: PointBadgeProps) {
	const sizeClasses = {
		sm: "text-xs px-2 py-0.5",
		md: "text-sm px-3 py-1",
		lg: "text-base px-4 py-1.5",
	};

	return (
		<div
			className={cn(
				"inline-flex items-center gap-1.5 font-semibold rounded-full bg-primary/10 text-primary",
				sizeClasses[size],
				className
			)}
		>
			{showTrend && trend === "up" && <TrendingUp className='w-3 h-3' />}
			{showTrend && trend === "down" && <TrendingDown className='w-3 h-3' />}
			<span>{points.toLocaleString()} pt</span>
		</div>
	);
}



