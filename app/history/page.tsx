"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingScreen } from "@/components/ui/loading-spinner";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/hooks/useAuth";
import {
	useFilteredPointHistory,
	PointHistoryType,
} from "@/hooks/usePointHistory";
import {
	History,
	TrendingUp,
	TrendingDown,
	ArrowRightLeft,
	Trophy,
} from "lucide-react";

export default function HistoryPage() {
	const { user } = useAuth();
	const [filter, setFilter] = useState<"all" | "earned" | "spent">("all");
	const { history, loading } = useFilteredPointHistory(user?.id, filter);

	if (loading) {
		return (
			<ProtectedRoute>
				<LoadingScreen />
			</ProtectedRoute>
		);
	}

	const getTransactionIcon = (type: PointHistoryType) => {
		switch (type) {
			case "daily_bonus":
			case "attendance":
			case "award":
				return TrendingUp;
			case "race_win":
				return Trophy;
			case "transfer_receive":
			case "transfer_send":
				return ArrowRightLeft;
			case "race_bet":
			case "deduct":
				return TrendingDown;
			default:
				return History;
		}
	};

	const getTransactionColor = (amount: number) => {
		return amount > 0 ? "text-green-600" : "text-red-600";
	};

	const formatDate = (date: Date) => {
		return date.toLocaleString("ja-JP", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<ProtectedRoute>
			<PageContainer>
				<Section icon={History} title='ポイント履歴'>
					<Tabs
						defaultValue='all'
						className='w-full'
						onValueChange={(value) =>
							setFilter(value as "all" | "earned" | "spent")
						}
					>
						<TabsList className='grid w-full grid-cols-3'>
							<TabsTrigger value='all'>すべて</TabsTrigger>
							<TabsTrigger value='earned'>獲得</TabsTrigger>
							<TabsTrigger value='spent'>使用</TabsTrigger>
						</TabsList>
						<TabsContent value='all' className='mt-4'>
							<Card>
								<CardContent className='pt-6'>
									{history.length === 0 ? (
										<EmptyState
											icon={History}
											title='履歴がありません'
											description='まだポイント履歴がありません'
										/>
									) : (
										<div className='space-y-1'>
											{history.map((transaction) => {
												const Icon = getTransactionIcon(transaction.type);
												const isPositive = transaction.amount > 0;
												return (
													<div
														key={transaction.id}
														className='flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors'
													>
														<div className='flex items-center gap-3 flex-1 min-w-0'>
															<div
																className={`p-2 rounded-full ${
																	isPositive
																		? "bg-green-500/10"
																		: "bg-red-500/10"
																}`}
															>
																<Icon
																	className={`w-4 h-4 ${
																		isPositive
																			? "text-green-600"
																			: "text-red-600"
																	}`}
																/>
															</div>
															<div className='flex-1 min-w-0'>
																<p className='font-medium truncate'>
																	{transaction.description}
																</p>
																<p className='text-xs text-muted-foreground'>
																	{formatDate(transaction.createdAt)}
																</p>
															</div>
														</div>
														<p
															className={`text-lg font-bold ${getTransactionColor(
																transaction.amount
															)}`}
														>
															{transaction.amount > 0 && "+"}
															{transaction.amount} pt
														</p>
													</div>
												);
											})}
										</div>
									)}
								</CardContent>
							</Card>
						</TabsContent>
						<TabsContent value='earned' className='mt-4'>
							<Card>
								<CardContent className='pt-6'>
									{history.length === 0 ? (
										<EmptyState
											icon={TrendingUp}
											title='獲得履歴なし'
											description='まだポイントを獲得していません'
										/>
									) : (
										<div className='space-y-1'>
											{history.map((transaction) => {
												const Icon = getTransactionIcon(transaction.type);
												return (
													<div
														key={transaction.id}
														className='flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors'
													>
														<div className='flex items-center gap-3 flex-1 min-w-0'>
															<div className='p-2 rounded-full bg-green-500/10'>
																<Icon className='w-4 h-4 text-green-600' />
															</div>
															<div className='flex-1 min-w-0'>
																<p className='font-medium truncate'>
																	{transaction.description}
																</p>
																<p className='text-xs text-muted-foreground'>
																	{formatDate(transaction.createdAt)}
																</p>
															</div>
														</div>
														<p className='text-lg font-bold text-green-600'>
															+{transaction.amount} pt
														</p>
													</div>
												);
											})}
										</div>
									)}
								</CardContent>
							</Card>
						</TabsContent>
						<TabsContent value='spent' className='mt-4'>
							<Card>
								<CardContent className='pt-6'>
									{history.length === 0 ? (
										<EmptyState
											icon={TrendingDown}
											title='使用履歴なし'
											description='まだポイントを使用していません'
										/>
									) : (
										<div className='space-y-1'>
											{history.map((transaction) => {
												const Icon = getTransactionIcon(transaction.type);
												return (
													<div
														key={transaction.id}
														className='flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors'
													>
														<div className='flex items-center gap-3 flex-1 min-w-0'>
															<div className='p-2 rounded-full bg-red-500/10'>
																<Icon className='w-4 h-4 text-red-600' />
															</div>
															<div className='flex-1 min-w-0'>
																<p className='font-medium truncate'>
																	{transaction.description}
																</p>
																<p className='text-xs text-muted-foreground'>
																	{formatDate(transaction.createdAt)}
																</p>
															</div>
														</div>
														<p className='text-lg font-bold text-red-600'>
															{transaction.amount} pt
														</p>
													</div>
												);
											})}
										</div>
									)}
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</Section>
			</PageContainer>
		</ProtectedRoute>
	);
}
