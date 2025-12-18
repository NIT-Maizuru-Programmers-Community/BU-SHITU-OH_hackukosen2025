import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
	name: string;
	imageUrl?: string;
	size?: "sm" | "md" | "lg" | "xl";
	className?: string;
	showOnlineIndicator?: boolean;
	isOnline?: boolean;
}

export function UserAvatar({
	name,
	imageUrl,
	size = "md",
	className,
	showOnlineIndicator = false,
	isOnline = false,
}: UserAvatarProps) {
	const sizeClasses = {
		sm: "w-8 h-8 text-xs",
		md: "w-10 h-10 text-sm",
		lg: "w-12 h-12 text-base",
		xl: "w-16 h-16 text-lg",
	};

	const indicatorSizeClasses = {
		sm: "w-2 h-2",
		md: "w-2.5 h-2.5",
		lg: "w-3 h-3",
		xl: "w-3.5 h-3.5",
	};

	return (
		<div className='relative inline-block'>
			<Avatar className={cn(sizeClasses[size], className)}>
				<AvatarImage src={imageUrl} alt={name} />
				<AvatarFallback className='bg-primary/10 text-primary font-semibold'>
					{name.charAt(0).toUpperCase()}
				</AvatarFallback>
			</Avatar>
			{showOnlineIndicator && (
				<span
					className={cn(
						"absolute bottom-0 right-0 rounded-full border-2 border-background",
						indicatorSizeClasses[size],
						isOnline ? "bg-green-500" : "bg-gray-400"
					)}
				/>
			)}
		</div>
	);
}




