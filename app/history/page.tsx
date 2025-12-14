"use client";

import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
	History,
	TrendingUp,
	TrendingDown,
	ArrowRightLeft,
	Trophy,
} from "lucide-react";

export default function HistoryPage() {
	// TODO: 実際のデータはFirestoreから取得
	const mockHistory = [
		{
			id: "1",
			type: "daily_bonus",
			amount: 10,
			description: "ログインボーナス",
			date: "2025-12-11 09:00",
		},
		{
			id: "2",
			type: "attendance",
			amount: 50,
			description: "在室ポイント（2時間）",
			date: "2025-12-11 11:00",
		},
		{
			id: "3",
			type: "race_win",
			amount: 200,
			description: "レース勝利",
			date: "2025-12-10 17:30",
		},
		{
			id: "4",
			type: "transfer_received",
			amount: 30,
			description: "鈴木一郎さんから受信",
			date: "2025-12-10 15:20",
		},
		{
			id: "5",
			type: "race_bet",
			amount: -50,
			description: "レースベット",
			date: "2025-12-10 16:45",
		},
	];

	const getTransactionIcon = (type: string) => {
		switch (type) {
			case "daily_bonus":
			case "attendance":
				return TrendingUp;
			case "race_win":
				return Trophy;
			case "transfer_received":
			case "transfer_sent":
				return ArrowRightLeft;
			case "race_bet":
				return TrendingDown;
			default:
				return History;
		}
	};

	const getTransactionColor = (amount: number) => {
		return amount > 0 ? "text-green-600" : "text-red-600";
	};

	return (
		<ProtectedRoute>
			<PageContainer>
				<Section icon={History} title='ポイント履歴'>
					<Tabs defaultValue='all' className='w-full'>
						<TabsList className='grid w-full grid-cols-3'>
							<TabsTrigger value='all'>すべて</TabsTrigger>
							<TabsTrigger value='earned'>獲得</TabsTrigger>
							<TabsTrigger value='spent'>使用</TabsTrigger>
						</TabsList>
						<TabsContent value='all' className='mt-4'>
							<Card>
								<CardContent className='pt-6'>
									<div className='space-y-1'>
										{mockHistory.map((transaction) => {
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
																isPositive ? "bg-green-500/10" : "bg-red-500/10"
															}`}
														>
															<Icon
																className={`w-4 h-4 ${
																	isPositive ? "text-green-600" : "text-red-600"
																}`}
															/>
														</div>
														<div className='flex-1 min-w-0'>
															<p className='font-medium truncate'>
																{transaction.description}
															</p>
															<p className='text-xs text-muted-foreground'>
																{transaction.date}
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
								</CardContent>
							</Card>
						</TabsContent>
						<TabsContent value='earned' className='mt-4'>
							<Card>
								<CardContent className='pt-6'>
									<div className='space-y-1'>
										{mockHistory
											.filter((t) => t.amount > 0)
											.map((transaction) => {
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
																	{transaction.date}
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
								</CardContent>
							</Card>
						</TabsContent>
						<TabsContent value='spent' className='mt-4'>
							<Card>
								<CardContent className='pt-6'>
									{mockHistory.filter((t) => t.amount < 0).length === 0 ? (
										<EmptyState
											icon={TrendingDown}
											title='使用履歴なし'
											description='まだポイントを使用していません'
										/>
									) : (
										<div className='space-y-1'>
											{mockHistory
												.filter((t) => t.amount < 0)
												.map((transaction) => {
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
																		{transaction.date}
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



