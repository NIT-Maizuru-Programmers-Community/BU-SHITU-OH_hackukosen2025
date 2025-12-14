"use client";

import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Users, Clock, Calendar, Info } from "lucide-react";

export default function AttendancePage() {
	// NOTE: 在室情報は部室の端末でNFCをかざすことで記録されます
	// TODO: 実際のデータはFirestoreから取得
	const mockCurrentAttendees = [
		{
			id: "1",
			name: "佐藤花子",
			checkInTime: "09:00",
			duration: 180,
			isOnline: true,
		},
		{
			id: "2",
			name: "鈴木一郎",
			checkInTime: "10:30",
			duration: 90,
			isOnline: true,
		},
		{
			id: "3",
			name: "田中次郎",
			checkInTime: "11:15",
			duration: 45,
			isOnline: true,
		},
	];

	const mockAttendanceHistory = [
		{ date: "2025-12-11", duration: 180, members: 5 },
		{ date: "2025-12-10", duration: 240, members: 8 },
		{ date: "2025-12-09", duration: 120, members: 4 },
	];

	const formatDuration = (minutes: number) => {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return hours > 0 ? `${hours}時間${mins}分` : `${mins}分`;
	};

	return (
		<ProtectedRoute>
			<PageContainer>
				{/* 説明 */}
				<div className='mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'>
					<div className='flex items-start gap-3'>
						<Info className='w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5' />
						<div className='flex-1'>
							<p className='text-sm font-medium text-blue-900 dark:text-blue-100 mb-1'>
								ログインボーナスについて
							</p>
							<p className='text-xs text-blue-800 dark:text-blue-200'>
								部室の端末にNFCをかざすことで入室が記録され、ログインボーナス（10pt）が付与されます。
							</p>
						</div>
					</div>
				</div>

				{/* 現在の在室者 */}
				<Section icon={Users} title='現在の在室者' className='mb-6'>
					<Card>
						<CardHeader>
							<div className='flex items-center justify-between'>
								<CardTitle className='text-lg'>
									{mockCurrentAttendees.length} 人在室中
								</CardTitle>
								<div className='flex items-center gap-2'>
									<div className='w-2 h-2 bg-green-500 rounded-full animate-pulse' />
									<span className='text-sm text-muted-foreground'>
										リアルタイム
									</span>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							{mockCurrentAttendees.length === 0 ? (
								<EmptyState
									icon={Users}
									title='誰もいません'
									description='現在部室に誰もいません'
								/>
							) : (
								<div className='space-y-3'>
									{mockCurrentAttendees.map((attendee) => (
										<div
											key={attendee.id}
											className='flex items-center justify-between p-4 rounded-lg bg-muted/50'
										>
											<div className='flex items-center gap-3'>
												<UserAvatar
													name={attendee.name}
													size='md'
													showOnlineIndicator
													isOnline={attendee.isOnline}
												/>
												<div>
													<p className='font-medium'>{attendee.name}</p>
													<div className='flex items-center gap-1 text-xs text-muted-foreground'>
														<Clock className='w-3 h-3' />
														<span>{attendee.checkInTime} 入室</span>
													</div>
												</div>
											</div>
											<div className='text-right'>
												<p className='text-sm font-semibold'>
													{formatDuration(attendee.duration)}
												</p>
												<p className='text-xs text-muted-foreground'>
													在室時間
												</p>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</Section>

				{/* 在室履歴 */}
				<Section icon={Calendar} title='在室履歴'>
					<Card>
						<CardContent className='pt-6'>
							<div className='space-y-2'>
								{mockAttendanceHistory.map((record, index) => (
									<div
										key={index}
										className='flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors'
									>
										<div>
											<p className='font-medium'>{record.date}</p>
											<p className='text-sm text-muted-foreground'>
												{record.members} 人参加
											</p>
										</div>
										<div className='text-right'>
											<p className='text-sm font-semibold'>
												{formatDuration(record.duration)}
											</p>
											<p className='text-xs text-muted-foreground'>在室時間</p>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</Section>
			</PageContainer>
		</ProtectedRoute>
	);
}
