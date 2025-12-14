"use client";

import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/ui/loading-spinner";
import { ThemeToggle } from "@/components/theme-toggle";
import {
	Settings,
	User,
	CreditCard,
	Bell,
	HelpCircle,
	LogOut,
	ChevronRight,
	Palette,
} from "lucide-react";

export default function SettingsPage() {
	const { user, loading, signOut } = useAuth();
	const router = useRouter();

	if (loading) {
		return <LoadingScreen />;
	}

	if (!user) {
		router.push("/login");
		return <LoadingScreen label='リダイレクト中...' />;
	}

	const handleSignOut = async () => {
		await signOut();
		router.push("/login");
	};

	return (
		<PageContainer>
			{/* プロフィール */}
			<Section icon={User} title='プロフィール' className='mb-6'>
				<Card>
					<CardContent className='pt-6'>
						<div className='flex items-center gap-4 mb-6'>
							<UserAvatar name={user.displayName} size='xl' />
							<div className='flex-1'>
								<h2 className='text-xl font-bold'>{user.displayName}</h2>
								<p className='text-sm text-muted-foreground'>
									ID: {user.id.substring(0, 8)}...
								</p>
							</div>
							<Button
								variant='outline'
								onClick={() => router.push("/register")}
							>
								編集
							</Button>
						</div>
						<div className='space-y-4'>
							<div>
								<label className='text-sm font-medium mb-1.5 block'>
									表示名
								</label>
								<Input defaultValue={user.displayName} disabled />
							</div>
						</div>
					</CardContent>
				</Card>
			</Section>

			{/* NFC カード設定 */}
			<Section icon={CreditCard} title='NFC カード' className='mb-6'>
				<Card>
					<CardContent className='pt-6'>
						<div className='flex items-center justify-between mb-4'>
							<div>
								<p className='font-medium'>登録済みカード</p>
								<p className='text-sm text-muted-foreground'>
									{user.nfcId || "未登録"}
								</p>
							</div>
							<Button
								variant='outline'
								onClick={() => router.push("/settings/nfc")}
							>
								{user.nfcId ? "変更" : "登録"}
							</Button>
						</div>
						<p className='text-xs text-muted-foreground'>
							※ NFCカードは入退室記録に使用されます
						</p>
					</CardContent>
				</Card>
			</Section>

			{/* テーマ設定 */}
			<Section icon={Palette} title='テーマ' className='mb-6'>
				<Card>
					<CardContent className='pt-6'>
						<div className='mb-4'>
							<p className='text-sm text-muted-foreground mb-4'>
								アプリの表示テーマを選択してください
							</p>
							<ThemeToggle />
						</div>
					</CardContent>
				</Card>
			</Section>

			{/* 設定メニュー */}
			<Section icon={Settings} title='設定'>
				<Card>
					<CardContent className='pt-6'>
						<div className='space-y-1'>
							<button className='flex items-center justify-between w-full p-4 rounded-lg hover:bg-muted transition-colors text-left'>
								<div className='flex items-center gap-3'>
									<Bell className='w-5 h-5 text-muted-foreground' />
									<span className='font-medium'>通知設定</span>
								</div>
								<ChevronRight className='w-5 h-5 text-muted-foreground' />
							</button>
							<button className='flex items-center justify-between w-full p-4 rounded-lg hover:bg-muted transition-colors text-left'>
								<div className='flex items-center gap-3'>
									<HelpCircle className='w-5 h-5 text-muted-foreground' />
									<span className='font-medium'>ヘルプ</span>
								</div>
								<ChevronRight className='w-5 h-5 text-muted-foreground' />
							</button>
						</div>
					</CardContent>
				</Card>
			</Section>

			{/* ログアウト */}
			<div className='mt-6'>
				<Button
					variant='outline'
					className='w-full'
					size='lg'
					onClick={handleSignOut}
				>
					<LogOut className='w-4 h-4 mr-2' />
					ログアウト
				</Button>
			</div>
		</PageContainer>
	);
}
