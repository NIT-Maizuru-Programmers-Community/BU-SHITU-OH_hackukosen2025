"use client";

import { useState, useEffect } from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/user-avatar";
import { X, Send, Coins, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface TransferModalProps {
	isOpen: boolean;
	onClose: () => void;
	recipient: {
		uid: string;
		displayName: string;
		photoURL?: string;
	} | null;
}

export function TransferModal({
	isOpen,
	onClose,
	recipient,
}: TransferModalProps) {
	const { user: currentUser, refreshUser, getToken } = useAuth();
	const [show, setShow] = useState(false);
	const [amount, setAmount] = useState<string>("");
	const [message, setMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setShow(true);
			setAmount("");
			setMessage("");
			setError(null);
			setSuccess(false);
		} else {
			setShow(false);
		}
	}, [isOpen]);

	if (!show || !recipient) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		const points = parseInt(amount, 10);
		if (isNaN(points) || points <= 0) {
			setError("有効なポイント数を入力してください");
			return;
		}

		if (currentUser && points > currentUser.points) {
			setError("ポイントが不足しています");
			return;
		}

		setIsSubmitting(true);

		try {
			const token = await getToken();
			if (!token) {
				throw new Error("認証トークンの取得に失敗しました");
			}

			const res = await fetch("/api/transfer/send", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					receiverId: recipient.uid,
					amount: points,
					message: message.trim(),
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.message || "送金に失敗しました");
			}

			setSuccess(true);
			await refreshUser(); // Update current user's balance
			
            setTimeout(() => {
                onClose();
            }, 2000);

		} catch (err: any) {
			setError(err.message || "予期せぬエラーが発生しました");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200'>
			<Card className='w-full max-w-md relative animate-in zoom-in-95 duration-200'>
				<button
					onClick={onClose}
					className='absolute top-4 right-4 p-1 hover:bg-muted rounded-full transition-colors'
					disabled={isSubmitting}
				>
					<X className='w-5 h-5' />
				</button>

				{success ? (
					<div className="py-12 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4">
						<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
							<CheckCircle2 className="w-10 h-10" />
						</div>
						<h3 className="text-2xl font-bold mb-2">送金完了！</h3>
						<p className="text-muted-foreground mb-6">
							{recipient.displayName}さんに<br />
							<span className="font-bold text-primary">{amount}ポイント</span>を送りました
						</p>
					</div>
				) : (
					<form onSubmit={handleSubmit}>
						<CardHeader className='text-center pb-2'>
							<CardTitle className='text-xl flex items-center justify-center gap-2'>
								<Coins className='w-5 h-5 text-primary' />
								ポイントを送る
							</CardTitle>
						</CardHeader>

						<CardContent className='space-y-6 pt-4'>
							<div className='flex flex-col items-center p-4 bg-muted/50 rounded-lg'>
								<UserAvatar
									name={recipient.displayName}
									imageUrl={recipient.photoURL}
									size='lg'
									className='mb-2'
								/>
								<p className='font-bold text-lg'>{recipient.displayName}</p>
								<p className='text-xs text-muted-foreground'>へポイントを送る</p>
							</div>

							<div className='space-y-4'>
								<div className='space-y-2'>
									<label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
										ポイント数
									</label>
									<div className="relative">
										<Input
											type='number'
											placeholder='0'
											min='1'
											max={currentUser?.points}
											value={amount}
											onChange={(e) => setAmount(e.target.value)}
											className='pl-4 pr-12 text-lg font-bold'
											disabled={isSubmitting}
										/>
										<div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
											pt
										</div>
									</div>
									{currentUser && (
										<p className='text-xs text-right text-muted-foreground'>
											保有ポイント: {currentUser.points.toLocaleString()} pt
										</p>
									)}
								</div>

								<div className='space-y-2'>
									<label className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
										メッセージ (任意)
									</label>
									<Input
										placeholder='応援してます！'
										value={message}
										onChange={(e) => setMessage(e.target.value)}
										disabled={isSubmitting}
                                        maxLength={100}
									/>
									<p className="text-xs text-muted-foreground text-right">{message.length}/100</p>
								</div>
							</div>

							{error && (
								<div className='p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md'>
									{error}
								</div>
							)}
						</CardContent>

						<CardFooter className='pt-2 pb-6'>
							<Button
								type='submit'
								className='w-full'
								size='lg'
								disabled={isSubmitting || !amount || parseInt(amount) <= 0}
							>
								{isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
								) : (
									<Send className='w-4 h-4 mr-2' />
								)}
								送る
							</Button>
						</CardFooter>
					</form>
				)}
			</Card>
		</div>
	);
}
