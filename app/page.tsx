"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PointBadge } from "@/components/ui/point-badge";
import { RankBadge } from "@/components/ui/rank-badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/useAuth";
import { useUserPoints } from "@/hooks/useUserPoints";
import { useRanking, useMyRank } from "@/hooks/useRanking";
import { useCurrentAttendance } from "@/hooks/useAttendance";
import { useTodayRace } from "@/hooks/useRace";
import { Trophy, Flag, Users, TrendingUp, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
	const { user, loading } = useAuth();
	const router = useRouter();
	
	// Firestoreからデータを取得
	const { points } = useUserPoints(user?.id);
	const { ranking } = useRanking(3); // トップ3のみ取得
	const myRank = useMyRank(user?.id);
	const { attendees } = useCurrentAttendance();
	const { race } = useTodayRace();

	useEffect(() => {
		if (!loading && !user) {
			router.push("/login");
		}
	}, [user, loading, router]);

	if (loading) {
		return <LoadingScreen />;
	}

	if (!user) {
		return <LoadingScreen label='リダイレクト中...' />;
	}

	return (
		<>
			<PageContainer>
				{/* ポイント表示エリア */}
				<Card className='mb-6 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20'>
					<CardContent className='pt-6'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='text-sm text-muted-foreground mb-1'>
									あなたのポイント
								</p>
								<div className='flex items-center gap-3'>
									<p className='text-4xl font-bold'>
										{points.toLocaleString()}
									</p>
									<span className='text-2xl text-muted-foreground'>pt</span>
								</div>
								{myRank && (
									<div className='flex items-center gap-2 mt-2'>
										<RankBadge rank={myRank} size='sm' />
										<span className='text-sm text-muted-foreground'>
											現在 {myRank} 位
										</span>
									</div>
								)}
							</div>
							<div className='text-right'>
								<TrendingUp className='w-12 h-12 text-primary/40 mb-2' />
							</div>
						</div>
					</CardContent>
				</Card>

				{/* 在室者サマリー */}
				<Section
					title='現在の在室者'
					icon={Users}
					action={
						<Link href='/attendance'>
							<Button variant='ghost' size='sm'>
								詳細 <ChevronRight className='w-4 h-4 ml-1' />
							</Button>
						</Link>
					}
					className='mb-6'
				>
					<Card>
						<CardContent className='pt-6'>
							<div className='flex items-center gap-3 mb-4'>
								<div className='flex items-center gap-2'>
									<div className='w-2 h-2 bg-green-500 rounded-full animate-pulse' />
									<span className='text-sm font-medium'>
										{attendees.length} 人在室中
									</span>
								</div>
							</div>
							<div className='flex items-center gap-3 overflow-x-auto pb-2'>
								{attendees.length === 0 ? (
									<p className='text-sm text-muted-foreground py-4'>
										現在誰もいません
									</p>
								) : (
									attendees.slice(0, 5).map((attendee) => (
										<div
											key={attendee.uid}
											className='flex flex-col items-center gap-1 flex-shrink-0'
										>
											<UserAvatar
												name={attendee.displayName}
												size='md'
												showOnlineIndicator
												isOnline={attendee.isOnline}
											/>
											<span className='text-xs text-muted-foreground truncate max-w-[60px]'>
												{attendee.displayName}
											</span>
										</div>
									))
								)}
							</div>
						</CardContent>
					</Card>
				</Section>

				{/* ランキングサマリー */}
				<Section
					title='ランキング'
					icon={Trophy}
					action={
						<Link href='/ranking'>
							<Button variant='ghost' size='sm'>
								詳細 <ChevronRight className='w-4 h-4 ml-1' />
							</Button>
						</Link>
					}
					className='mb-6'
				>
					<Card>
						<CardContent className='pt-6'>
							<div className='space-y-3'>
								{ranking.length === 0 ? (
									<p className='text-sm text-muted-foreground text-center py-4'>
										データがありません
									</p>
								) : (
									ranking.map((rankUser) => (
										<div
											key={rankUser.uid}
											className='flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors'
										>
											<div className='flex items-center gap-3'>
												<RankBadge rank={rankUser.rank} />
												<UserAvatar name={rankUser.displayName} size='sm' />
												<span className='font-medium'>{rankUser.displayName}</span>
											</div>
											<PointBadge points={rankUser.points} size='sm' />
										</div>
									))
								)}
							</div>
						</CardContent>
					</Card>
				</Section>

				{/* 本日のレース */}
				<Section
					title='本日のレース'
					icon={Flag}
					action={
						<Link href='/race'>
							<Button variant='ghost' size='sm'>
								詳細 <ChevronRight className='w-4 h-4 ml-1' />
							</Button>
						</Link>
					}
				>
					<Card>
						<CardContent className='pt-6'>
							<div className='text-center py-4'>
								<Flag className='w-12 h-12 text-primary mx-auto mb-3' />
								{race ? (
									<>
										<h3 className='text-lg font-semibold mb-2'>
											{race.startTime.toLocaleTimeString('ja-JP', { 
												hour: '2-digit', 
												minute: '2-digit' 
											})} 開始予定
										</h3>
										<p className='text-sm text-muted-foreground mb-1'>
											参加者: {race.participants.length} 人
										</p>
										<p className='text-xs text-muted-foreground mb-4'>
											{race.status === 'open' && 'エントリー受付中'}
											{race.status === 'closed' && 'レース進行中'}
											{race.status === 'finished' && 'レース終了'}
										</p>
									</>
								) : (
									<>
										<h3 className='text-lg font-semibold mb-2'>
											本日のレース
										</h3>
										<p className='text-sm text-muted-foreground mb-4'>
											レース情報を読み込み中...
										</p>
									</>
								)}
								<Link href='/race'>
									<Button className='w-full' size='lg'>
										詳細を見る
									</Button>
								</Link>
							</div>
						</CardContent>
					</Card>
				</Section>
			</PageContainer>
		</>
	);
}
