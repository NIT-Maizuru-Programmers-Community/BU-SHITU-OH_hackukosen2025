import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
	title: string;
	description?: string;
	action?: React.ReactNode;
	onBack?: () => void;
	className?: string;
}

export function PageHeader({
	title,
	description,
	action,
	onBack,
	className,
}: PageHeaderProps) {
	return (
		<div className={cn("border-b bg-background", className)}>
			<div className='px-4 py-4 max-w-screen-lg mx-auto'>
				<div className='flex items-center justify-between gap-4'>
					<div className='flex items-center gap-3 flex-1 min-w-0'>
						{onBack && (
							<Button
								variant='ghost'
								size='icon'
								onClick={onBack}
								className='flex-shrink-0'
							>
								<ArrowLeft className='w-5 h-5' />
							</Button>
						)}
						<div className='flex-1 min-w-0'>
							<h1 className='text-xl font-bold truncate'>{title}</h1>
							{description && (
								<p className='text-sm text-muted-foreground mt-0.5 truncate'>
									{description}
								</p>
							)}
						</div>
					</div>
					{action && <div className='flex-shrink-0'>{action}</div>}
				</div>
			</div>
		</div>
	);
}




