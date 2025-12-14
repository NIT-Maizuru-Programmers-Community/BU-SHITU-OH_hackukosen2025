"use client";

import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PointBadge } from "@/components/ui/point-badge";
import { RankBadge } from "@/components/ui/rank-badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { LoadingScreen } from "@/components/ui/loading-spinner";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useRanking } from "@/hooks/useRanking";
import { Crown, Trophy } from "lucide-react";

export default function RankingPage() {
	const { ranking, loading } = useRanking();

	if (loading) {
		return (
			<ProtectedRoute>
				<LoadingScreen />
			</ProtectedRoute>
		);
	}

	const currentKing = ranking[0];

	return (
		<ProtectedRoute>
			<PageContainer>
				{/* 社長席（1位） */}
				<Section icon={Crown} title='社長席' className='mb-6'>
					<Card className='bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30'>
						<CardContent className='pt-6'>
							{currentKing ? (
								<div className='flex flex-col items-center text-center py-4'>
									<Crown className='w-12 h-12 text-primary mb-4 animate-pulse-soft' />
									<UserAvatar
										name={currentKing.displayName}
										size='xl'
										className='mb-3'
									/>
									<h2 className='text-2xl font-bold mb-1'>{currentKing.displayName}</h2>
									<PointBadge points={currentKing.points} size='lg' />
									<p className='text-sm text-muted-foreground mt-3'>
										現在の部室王
									</p>
								</div>
							) : (
								<div className='flex flex-col items-center text-center py-8'>
									<Crown className='w-12 h-12 text-muted-foreground mb-4' />
									<p className='text-muted-foreground'>まだランキングがありません</p>
								</div>
							)}
						</CardContent>
					</Card>
				</Section>

				{/* ランキング一覧 */}
				<Section icon={Trophy} title='ランキング'>
					<Tabs defaultValue='all' className='w-full'>
						<TabsList className='grid w-full grid-cols-3'>
							<TabsTrigger value='all'>全体</TabsTrigger>
							<TabsTrigger value='week'>今週</TabsTrigger>
							<TabsTrigger value='month'>今月</TabsTrigger>
						</TabsList>
						<TabsContent value='all' className='mt-4'>
							<Card>
								<CardContent className='pt-6'>
									{ranking.length === 0 ? (
										<p className='text-center text-muted-foreground py-8'>
											まだランキングがありません
										</p>
									) : (
										<div className='space-y-2'>
											{ranking.map((user) => (
												<div
													key={user.uid}
													className='flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors'
												>
													<div className='flex items-center gap-3 flex-1 min-w-0'>
														<RankBadge rank={user.rank} />
														<UserAvatar name={user.displayName} size='md' />
														<div className='flex-1 min-w-0'>
															<p className='font-medium truncate'>{user.displayName}</p>
														</div>
													</div>
													<PointBadge points={user.points} />
												</div>
											))}
										</div>
									)}
								</CardContent>
							</Card>
						</TabsContent>
						<TabsContent value='week' className='mt-4'>
							<Card>
								<CardContent className='pt-6'>
									<p className='text-center text-muted-foreground py-8'>
										今週のランキングデータを読み込み中...
									</p>
								</CardContent>
							</Card>
						</TabsContent>
						<TabsContent value='month' className='mt-4'>
							<Card>
								<CardContent className='pt-6'>
									<p className='text-center text-muted-foreground py-8'>
										今月のランキングデータを読み込み中...
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



