import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";

type StatusType = "success" | "pending" | "error" | "warning" | "info";

interface StatusBadgeProps {
	status: StatusType;
	label: string;
	className?: string;
	showIcon?: boolean;
}

export function StatusBadge({
	status,
	label,
	className,
	showIcon = true,
}: StatusBadgeProps) {
	const getStatusStyle = () => {
		switch (status) {
			case "success":
				return "bg-green-500/10 text-green-600 dark:text-green-400";
			case "pending":
				return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
			case "error":
				return "bg-red-500/10 text-red-600 dark:text-red-400";
			case "warning":
				return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
			case "info":
				return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
		}
	};

	const getStatusIcon = () => {
		const iconClass = "w-3.5 h-3.5";
		switch (status) {
			case "success":
				return <CheckCircle2 className={iconClass} />;
			case "pending":
				return <Clock className={iconClass} />;
			case "error":
				return <XCircle className={iconClass} />;
			case "warning":
			case "info":
				return <AlertCircle className={iconClass} />;
		}
	};

	return (
		<div
			className={cn(
				"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
				getStatusStyle(),
				className
			)}
		>
			{showIcon && getStatusIcon()}
			<span>{label}</span>
		</div>
	);
}



