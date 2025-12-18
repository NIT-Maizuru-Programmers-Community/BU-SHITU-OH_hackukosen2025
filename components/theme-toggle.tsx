"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	// マウント後にのみレンダリング（ハイドレーションエラー回避）
	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<div className='flex gap-2'>
				<button className='flex-1 p-4 rounded-lg bg-card border border-border'>
					<div className='flex items-center gap-3'>
						<div className='w-5 h-5' />
						<span className='text-sm font-medium'>読み込み中...</span>
					</div>
				</button>
			</div>
		);
	}

	const themes = [
		{ value: "light", label: "ライト", icon: Sun },
		{ value: "dark", label: "ダーク", icon: Moon },
		{ value: "system", label: "システム", icon: Monitor },
	];

	return (
		<div className='flex gap-2'>
			{themes.map(({ value, label, icon: Icon }) => (
				<button
					key={value}
					onClick={() => setTheme(value)}
					className={`flex-1 p-4 rounded-lg border transition-all ${
						theme === value
							? "bg-primary text-primary-foreground border-primary"
							: "bg-card border-border hover:border-primary/50"
					}`}
				>
					<div className='flex flex-col items-center gap-2'>
						<Icon className='w-5 h-5' />
						<span className='text-sm font-medium'>{label}</span>
					</div>
				</button>
			))}
		</div>
	);
}


