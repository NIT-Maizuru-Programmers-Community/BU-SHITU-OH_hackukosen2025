"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggleButton() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	// マウント後にのみレンダリング（ハイドレーションエラー回避）
	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<Button variant='ghost' size='icon' className='w-9 h-9'>
				<div className='w-5 h-5' />
			</Button>
		);
	}

	const toggleTheme = () => {
		setTheme(theme === "dark" ? "light" : "dark");
	};

	return (
		<Button
			variant='ghost'
			size='icon'
			className='w-9 h-9'
			onClick={toggleTheme}
			aria-label='テーマを切り替え'
		>
			{theme === "dark" ? (
				<Sun className='w-5 h-5' />
			) : (
				<Moon className='w-5 h-5' />
			)}
		</Button>
	);
}


