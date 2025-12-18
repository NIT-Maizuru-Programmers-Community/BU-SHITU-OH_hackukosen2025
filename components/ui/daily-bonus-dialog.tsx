"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, X } from "lucide-react";

interface DailyBonusDialogProps {
	isOpen: boolean;
	bonusPoints: number;
	onClose: () => void;
}

export function DailyBonusDialog({
	isOpen,
	bonusPoints,
	onClose,
}: DailyBonusDialogProps) {
	const [show, setShow] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setShow(true);
		}
	}, [isOpen]);

	if (!show) return null;

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-slide-up'>
			<Card className='w-full max-w-sm relative'>
				<button
					onClick={onClose}
					className='absolute top-4 right-4 p-1 hover:bg-muted rounded-full transition-colors'
				>
					<X className='w-5 h-5' />
				</button>
				<CardHeader className='text-center space-y-4 pt-8'>
					<div className='flex justify-center'>
						<div className='p-4 bg-primary/10 rounded-full animate-pulse-soft'>
							<Gift className='w-12 h-12 text-primary' />
						</div>
					</div>
					<CardTitle className='text-2xl'>ログインボーナス！</CardTitle>
				</CardHeader>
				<CardContent className='text-center space-y-6 pb-8'>
					<div>
						<p className='text-5xl font-bold text-primary mb-2'>
							+{bonusPoints}
						</p>
						<p className='text-xl font-semibold'>ポイント</p>
					</div>
					<p className='text-sm text-muted-foreground'>
						毎日ログインしてポイントを貯めよう！
					</p>
					<Button onClick={onClose} className='w-full' size='lg'>
						閉じる
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}




