"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Crown, Save } from "lucide-react";
import { LoadingScreen } from "@/components/ui/loading-spinner";

export default function RegisterPage() {
	const { user, loading, refreshUser } = useAuth();
	const router = useRouter();
	const [displayName, setDisplayName] = useState("");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!loading && !user) {
			router.push("/login");
		}
		if (user) {
			setDisplayName(user.displayName);
		}
	}, [user, loading, router]);

	const handleSave = async () => {
		if (!user || !displayName.trim()) return;

		setSaving(true);
		try {
			await updateDoc(doc(db, "users", user.id), {
				displayName: displayName.trim(),
			});
			await refreshUser();
			router.push("/");
		} catch (error) {
			console.error("プロフィール更新エラー:", error);
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return <LoadingScreen />;
	}

	if (!user) {
		return <LoadingScreen label='リダイレクト中...' />;
	}

	return (
		<div className='min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5'>
			<Card className='w-full max-w-md'>
				<CardHeader className='text-center space-y-4'>
					<div className='flex justify-center'>
						<div className='p-4 bg-primary/10 rounded-full'>
							<Crown className='w-12 h-12 text-primary' />
						</div>
					</div>
					<CardTitle className='text-2xl font-bold'>プロフィール設定</CardTitle>
					<p className='text-muted-foreground'>表示名を設定してください</p>
				</CardHeader>
				<CardContent className='space-y-6'>
					<div className='space-y-2'>
						<label className='text-sm font-medium'>表示名</label>
						<Input
							value={displayName}
							onChange={(e) => setDisplayName(e.target.value)}
							placeholder='例: 山田太郎'
							maxLength={20}
						/>
						<p className='text-xs text-muted-foreground'>
							他のユーザーに表示される名前です
						</p>
					</div>
					<Button
						onClick={handleSave}
						disabled={!displayName.trim() || saving}
						className='w-full'
						size='lg'
					>
						<Save className='w-4 h-4 mr-2' />
						{saving ? "保存中..." : "保存して始める"}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}




