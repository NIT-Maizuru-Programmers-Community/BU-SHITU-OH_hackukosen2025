"use client";

import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PointBadge } from "@/components/ui/point-badge";
import { RankBadge } from "@/components/ui/rank-badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Crown, Trophy } from "lucide-react";

export default function RankingPage() {
	// TODO: 実際のデータはFirestoreから取得
	const mockRanking = [
		{ id: "1", name: "佐藤花子", points: 2500, rank: 1, avatar: "" },
		{ id: "2", name: "鈴木一郎", points: 1800, rank: 2, avatar: "" },
		{ id: "3", name: "山田太郎", points: 1250, rank: 3, avatar: "" },
		{ id: "4", name: "田中次郎", points: 980, rank: 4, avatar: "" },
		{ id: "5", name: "伊藤三郎", points: 850, rank: 5, avatar: "" },
		{ id: "6", name: "渡辺四郎", points: 720, rank: 6, avatar: "" },
	];

	const currentKing = mockRanking[0];

	return (
		<ProtectedRoute>
			<PageContainer>
				{/* 社長席（1位） */}
				<Section icon={Crown} title='社長席' className='mb-6'>
					<Card className='bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30'>
						<CardContent className='pt-6'>
							<div className='flex flex-col items-center text-center py-4'>
								<Crown className='w-12 h-12 text-primary mb-4 animate-pulse-soft' />
								<UserAvatar
									name={currentKing.name}
									size='xl'
									className='mb-3'
								/>
								<h2 className='text-2xl font-bold mb-1'>{currentKing.name}</h2>
								<PointBadge points={currentKing.points} size='lg' />
								<p className='text-sm text-muted-foreground mt-3'>
									現在の部室王
								</p>
							</div>
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
									<div className='space-y-2'>
										{mockRanking.map((user) => (
											<div
												key={user.id}
												className='flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors'
											>
												<div className='flex items-center gap-3 flex-1 min-w-0'>
													<RankBadge rank={user.rank} />
													<UserAvatar name={user.name} size='md' />
													<div className='flex-1 min-w-0'>
														<p className='font-medium truncate'>{user.name}</p>
													</div>
												</div>
												<PointBadge points={user.points} />
											</div>
										))}
									</div>
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



