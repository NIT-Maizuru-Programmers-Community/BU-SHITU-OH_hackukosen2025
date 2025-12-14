"use client";

import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/ui/user-avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Flag, Clock, Info } from "lucide-react";

export default function RacePage() {
	// TODO: 実際のデータはFirestoreから取得
	const mockTodayRace = {
		id: "race-1",
		status: "upcoming",
		startTime: "17:00",
		participants: [
			{ id: "1", name: "佐藤花子", odds: 2.5, totalBets: 500 },
			{ id: "2", name: "鈴木一郎", odds: 3.2, totalBets: 350 },
			{ id: "3", name: "山田太郎", odds: 4.0, totalBets: 280 },
			{ id: "4", name: "田中次郎", odds: 5.5, totalBets: 150 },
		],
	};

	const mockPastRaces = [
		{
			id: "race-0",
			date: "2025-12-10",
			winner: "佐藤花子",
			payout: 250,
		},
	];

	return (
		<ProtectedRoute>
			<PageContainer>
				{/* 本日のレース */}
				<Section icon={Flag} title='本日のレース' className='mb-6'>
					<Card>
						<CardHeader>
							<div className='flex items-center justify-between'>
								<CardTitle className='text-lg'>今日のレース</CardTitle>
								<StatusBadge status='pending' label='開催前' />
							</div>
							<div className='flex items-center gap-2 text-sm text-muted-foreground'>
								<Clock className='w-4 h-4' />
								<span>{mockTodayRace.startTime} 開始予定</span>
							</div>
						</CardHeader>
						<CardContent>
							<div className='space-y-3'>
								{mockTodayRace.participants.map((participant) => (
									<div
										key={participant.id}
										className='flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors'
									>
										<div className='flex items-center gap-3 flex-1'>
											<UserAvatar name={participant.name} size='md' />
											<div>
												<p className='font-medium'>{participant.name}</p>
												<p className='text-xs text-muted-foreground'>
													総ベット: {participant.totalBets} pt
												</p>
											</div>
										</div>
										<div className='text-right'>
											<p className='text-lg font-bold text-primary'>
												×{participant.odds}
											</p>
											<p className='text-xs text-muted-foreground'>オッズ</p>
										</div>
									</div>
								))}
							</div>

							<div className='mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'>
								<div className='flex items-start gap-3'>
									<Info className='w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5' />
									<div className='flex-1'>
										<p className='text-sm font-medium text-blue-900 dark:text-blue-100 mb-1'>
											ベットについて
										</p>
										<p className='text-xs text-blue-800 dark:text-blue-200'>
											レースへのベットは部室の端末でNFCをかざす際に行えます。アプリからはベットできません。
										</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</Section>

				{/* レース履歴 */}
				<Section title='レース履歴'>
					<Tabs defaultValue='results' className='w-full'>
						<TabsList className='grid w-full grid-cols-2'>
							<TabsTrigger value='results'>結果</TabsTrigger>
							<TabsTrigger value='mybets'>自分のベット</TabsTrigger>
						</TabsList>
						<TabsContent value='results' className='mt-4'>
							<Card>
								<CardContent className='pt-6'>
									<div className='space-y-3'>
										{mockPastRaces.map((race) => (
											<div
												key={race.id}
												className='p-4 rounded-lg border bg-card'
											>
												<div className='flex items-center justify-between mb-2'>
													<p className='text-sm text-muted-foreground'>
														{race.date}
													</p>
													<StatusBadge status='success' label='終了' />
												</div>
												<div className='flex items-center justify-between'>
													<div>
														<p className='font-medium'>{race.winner} が優勝</p>
													</div>
													<p className='text-sm'>
														払戻:{" "}
														<span className='font-bold text-primary'>
															{race.payout} pt
														</span>
													</p>
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						</TabsContent>
						<TabsContent value='mybets' className='mt-4'>
							<Card>
								<CardContent className='pt-6'>
									<p className='text-center text-muted-foreground py-8'>
										ベット履歴がありません
									</p>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</Section>
			</PageContainer>
		</ProtectedRoute>
	);
}
