"use client";

import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingScreen } from "@/components/ui/loading-spinner";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useCurrentAttendance, formatDuration } from "@/hooks/useAttendance";
import { Users, Clock, Calendar, Info } from "lucide-react";

export default function AttendancePage() {
	// NOTE: 在室情報は部室の端末でNFCをかざすことで記録されます
	const { attendees, loading, count } = useCurrentAttendance();

	if (loading) {
		return (
			<ProtectedRoute>
				<LoadingScreen />
			</ProtectedRoute>
		);
	}

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
								<CardTitle className='text-lg'>{count} 人在室中</CardTitle>
								<div className='flex items-center gap-2'>
									<div className='w-2 h-2 bg-green-500 rounded-full animate-pulse' />
									<span className='text-sm text-muted-foreground'>
										リアルタイム
									</span>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							{attendees.length === 0 ? (
								<EmptyState
									icon={Users}
									title='誰もいません'
									description='現在部室に誰もいません'
								/>
							) : (
								<div className='space-y-3'>
									{attendees.map((attendee) => (
										<div
											key={attendee.uid}
											className='flex items-center justify-between p-4 rounded-lg bg-muted/50'
										>
											<div className='flex items-center gap-3'>
												<UserAvatar
													name={attendee.displayName}
													size='md'
													showOnlineIndicator
													isOnline={attendee.isOnline}
												/>
												<div>
													<p className='font-medium'>{attendee.displayName}</p>
													<div className='flex items-center gap-1 text-xs text-muted-foreground'>
														<Clock className='w-3 h-3' />
														<span>
															{attendee.checkInTime.toLocaleTimeString(
																"ja-JP",
																{
																	hour: "2-digit",
																	minute: "2-digit",
																}
															)}{" "}
															入室
														</span>
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
							<p className='text-center text-muted-foreground py-8'>
								在室履歴機能は近日実装予定です
							</p>
						</CardContent>
					</Card>
				</Section>
			</PageContainer>
		</ProtectedRoute>
	);
}
