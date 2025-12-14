import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageContainerProps {
	children: ReactNode;
	className?: string;
	maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
}

export function PageContainer({
	children,
	className,
	maxWidth = "lg",
}: PageContainerProps) {
	const maxWidthClasses = {
		sm: "max-w-screen-sm",
		md: "max-w-screen-md",
		lg: "max-w-screen-lg",
		xl: "max-w-screen-xl",
		full: "max-w-full",
	};

	return (
		<div
			className={cn(
				"mx-auto w-full px-4 py-6",
				maxWidthClasses[maxWidth],
				className
			)}
		>
			{children}
		</div>
	);
}



