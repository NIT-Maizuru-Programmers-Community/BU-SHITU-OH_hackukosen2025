"use client";

import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/ui/user-avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoadingScreen } from "@/components/ui/loading-spinner";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useTodayRace, useRaceHistory } from "@/hooks/useRace";
import { Flag, Clock, Info } from "lucide-react";

export default function RacePage() {
	const { race: todayRace, loading: raceLoading } = useTodayRace();
	const { races: pastRaces, loading: historyLoading } = useRaceHistory(10);

	if (raceLoading) {
		return (
			<ProtectedRoute>
				<LoadingScreen />
			</ProtectedRoute>
		);
	}

	return (
		<ProtectedRoute>
			<PageContainer>
				{/* 本日のレース */}
				<Section icon={Flag} title='本日のレース' className='mb-6'>
					<Card>
						<CardHeader>
							<div className='flex items-center justify-between'>
								<CardTitle className='text-lg'>今日のレース</CardTitle>
								{todayRace && (
									<StatusBadge
										status={
											todayRace.status === "open"
												? "pending"
												: todayRace.status === "finished"
												? "success"
												: "warning"
										}
										label={
											todayRace.status === "open"
												? "エントリー中"
												: todayRace.status === "closed"
												? "進行中"
												: "終了"
										}
									/>
								)}
							</div>
							{todayRace && (
								<div className='flex items-center gap-2 text-sm text-muted-foreground'>
									<Clock className='w-4 h-4' />
									<span>
										{todayRace.startTime.toLocaleTimeString("ja-JP", {
											hour: "2-digit",
											minute: "2-digit",
										})}{" "}
										開始予定
									</span>
								</div>
							)}
						</CardHeader>
						<CardContent>
							{todayRace ? (
								<>
									<div className='space-y-3'>
										{todayRace.participants.length === 0 ? (
											<p className='text-center text-muted-foreground py-8'>
												まだ参加者がいません
											</p>
										) : (
											todayRace.participants.map((participant, index) => (
												<div
													key={index}
													className='flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors'
												>
													<div className='flex items-center gap-3 flex-1'>
														<UserAvatar
															name={participant.displayName}
															size='md'
														/>
														<div>
															<p className='font-medium'>
																{participant.displayName}
															</p>
															<p className='text-xs text-muted-foreground'>
																総ベット: {participant.totalBets} pt
															</p>
														</div>
													</div>
													<div className='text-right'>
														<p className='text-lg font-bold text-primary'>
															×{participant.odds.toFixed(1)}
														</p>
														<p className='text-xs text-muted-foreground'>
															オッズ
														</p>
													</div>
												</div>
											))
										)}
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
								</>
							) : (
								<p className='text-center text-muted-foreground py-8'>
									本日のレース情報を読み込み中...
								</p>
							)}
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
									{historyLoading ? (
										<p className='text-center text-muted-foreground py-8'>
											読み込み中...
										</p>
									) : pastRaces.length === 0 ? (
										<p className='text-center text-muted-foreground py-8'>
											過去のレース履歴がありません
										</p>
									) : (
										<div className='space-y-3'>
											{pastRaces.map((race) => {
												const winner = race.participants.find(
													(p) => p.rank === 1
												);
												return (
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
																<p className='font-medium'>
																	{winner
																		? `${winner.displayName} が優勝`
																		: "結果集計中"}
																</p>
															</div>
														</div>
													</div>
												);
											})}
										</div>
									)}
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
