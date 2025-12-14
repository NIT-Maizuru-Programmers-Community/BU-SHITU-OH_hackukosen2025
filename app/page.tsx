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
import { Trophy, Flag, Users, TrendingUp, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
	const { user, loading } = useAuth();
	const router = useRouter();

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

	const mockAttendees = [
		{ id: "1", name: "佐藤花子", isOnline: true },
		{ id: "2", name: "鈴木一郎", isOnline: true },
		{ id: "3", name: "田中次郎", isOnline: true },
	];

	const mockRanking = [
		{ id: "1", name: "佐藤花子", points: 2500, rank: 1 },
		{ id: "2", name: "鈴木一郎", points: 1800, rank: 2 },
		{ id: "3", name: "山田太郎", points: 1250, rank: 3 },
	];

	const mockTodayRace = {
		status: "upcoming",
		startTime: "17:00",
		participants: 8,
	};

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
										{user.points.toLocaleString()}
									</p>
									<span className='text-2xl text-muted-foreground'>pt</span>
								</div>
								<div className='flex items-center gap-2 mt-2'>
									<RankBadge rank={3} size='sm' />
									<span className='text-sm text-muted-foreground'>
										現在 3 位
									</span>
								</div>
							</div>
							<div className='text-right'>
								<TrendingUp className='w-12 h-12 text-primary/40 mb-2' />
								<PointBadge points={120} showTrend trend='up' size='sm' />
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
										{mockAttendees.length} 人在室中
									</span>
								</div>
							</div>
							<div className='flex items-center gap-3 overflow-x-auto pb-2'>
								{mockAttendees.map((attendee) => (
									<div
										key={attendee.id}
										className='flex flex-col items-center gap-1 flex-shrink-0'
									>
										<UserAvatar
											name={attendee.name}
											size='md'
											showOnlineIndicator
											isOnline={attendee.isOnline}
										/>
										<span className='text-xs text-muted-foreground truncate max-w-[60px]'>
											{attendee.name}
										</span>
									</div>
								))}
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
								{mockRanking.map((user) => (
									<div
										key={user.id}
										className='flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors'
									>
										<div className='flex items-center gap-3'>
											<RankBadge rank={user.rank} />
											<UserAvatar name={user.name} size='sm' />
											<span className='font-medium'>{user.name}</span>
										</div>
										<PointBadge points={user.points} size='sm' />
									</div>
								))}
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
								<h3 className='text-lg font-semibold mb-2'>
									{mockTodayRace.startTime} 開始予定
								</h3>
								<p className='text-sm text-muted-foreground mb-4'>
									参加者: {mockTodayRace.participants} 人
								</p>
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
