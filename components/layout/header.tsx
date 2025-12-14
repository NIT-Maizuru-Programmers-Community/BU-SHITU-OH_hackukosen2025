"use client";

import { Crown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggleButton } from "@/components/theme-toggle-button";

interface HeaderProps {
	userName?: string;
	userAvatar?: string;
	userPoints?: number;
}

export function Header({ userName, userAvatar, userPoints = 0 }: HeaderProps) {
	return (
		<header className='sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b'>
			<div className='flex items-center justify-between h-14 px-4 max-w-screen-lg mx-auto'>
				<div className='flex items-center gap-2'>
					<Crown className='w-6 h-6 text-primary' />
					<h1 className='text-lg font-bold'>部室王</h1>
				</div>

				<div className='flex items-center gap-2'>
					{userName && (
						<>
							<Badge variant='secondary' className='text-sm font-semibold'>
								{userPoints.toLocaleString()} pt
							</Badge>
							<ThemeToggleButton />
							<Avatar className='w-8 h-8'>
								<AvatarImage src={userAvatar} alt={userName} />
								<AvatarFallback>{userName.charAt(0)}</AvatarFallback>
							</Avatar>
						</>
					)}
					{!userName && <ThemeToggleButton />}
				</div>
			</div>
		</header>
	);
}
