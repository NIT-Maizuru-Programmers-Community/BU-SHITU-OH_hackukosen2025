import { cn } from "@/lib/utils";
import { Crown, Medal, Award } from "lucide-react";

interface RankBadgeProps {
	rank: number;
	className?: string;
	showIcon?: boolean;
	size?: "sm" | "md" | "lg";
}

export function RankBadge({
	rank,
	className,
	showIcon = true,
	size = "md",
}: RankBadgeProps) {
	const getRankStyle = () => {
		switch (rank) {
			case 1:
				return "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-500/50";
			case 2:
				return "bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-lg shadow-gray-400/50";
			case 3:
				return "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/50";
			default:
				return "bg-muted text-muted-foreground";
		}
	};

	const getRankIcon = () => {
		switch (rank) {
			case 1:
				return <Crown className={iconSize} />;
			case 2:
				return <Medal className={iconSize} />;
			case 3:
				return <Award className={iconSize} />;
			default:
				return null;
		}
	};

	const sizeClasses = {
		sm: "w-6 h-6 text-xs",
		md: "w-8 h-8 text-sm",
		lg: "w-10 h-10 text-base",
	};

	const iconSize =
		size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5";

	return (
		<div
			className={cn(
				"inline-flex items-center justify-center rounded-full font-bold",
				getRankStyle(),
				sizeClasses[size],
				className
			)}
		>
			{showIcon && rank <= 3 ? getRankIcon() : `${rank}`}
		</div>
	);
}



