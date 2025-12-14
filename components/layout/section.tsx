import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface SectionProps {
	title?: string;
	description?: string;
	icon?: LucideIcon;
	action?: ReactNode;
	children: ReactNode;
	className?: string;
}

export function Section({
	title,
	description,
	icon: Icon,
	action,
	children,
	className,
}: SectionProps) {
	return (
		<section className={cn("space-y-4", className)}>
			{(title || action) && (
				<div className='flex items-center justify-between gap-4'>
					<div className='flex items-center gap-2 flex-1 min-w-0'>
						{Icon && <Icon className='w-5 h-5 text-primary flex-shrink-0' />}
						<div className='flex-1 min-w-0'>
							{title && (
								<h2 className='text-lg font-semibold truncate'>{title}</h2>
							)}
							{description && (
								<p className='text-sm text-muted-foreground truncate'>
									{description}
								</p>
							)}
						</div>
					</div>
					{action && <div className='flex-shrink-0'>{action}</div>}
				</div>
			)}
			<div>{children}</div>
		</section>
	);
}



