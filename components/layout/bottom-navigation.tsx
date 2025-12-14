"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, Flag, History, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
	{
		href: "/",
		label: "ホーム",
		icon: Home,
	},
	{
		href: "/ranking",
		label: "ランキング",
		icon: Trophy,
	},
	{
		href: "/race",
		label: "レース",
		icon: Flag,
	},
	{
		href: "/history",
		label: "履歴",
		icon: History,
	},
	{
		href: "/settings",
		label: "設定",
		icon: Settings,
	},
];

export function BottomNavigation() {
	const pathname = usePathname();

	return (
		<nav className='fixed bottom-0 left-0 right-0 z-50 bg-background border-t'>
			<div className='flex items-center justify-around h-16 max-w-screen-lg mx-auto'>
				{navItems.map((item) => {
					const isActive = pathname === item.href;
					const Icon = item.icon;

					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								"flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
								isActive
									? "text-primary"
									: "text-muted-foreground hover:text-foreground"
							)}
						>
							<Icon className='w-5 h-5' />
							<span className='text-xs font-medium'>{item.label}</span>
						</Link>
					);
				})}
			</div>
		</nav>
	);
}



