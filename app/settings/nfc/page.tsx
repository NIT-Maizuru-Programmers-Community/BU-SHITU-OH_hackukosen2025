"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CreditCard, Check, AlertCircle } from "lucide-react";
import { LoadingScreen } from "@/components/ui/loading-spinner";

export default function NFCRegistrationPage() {
	const { user, loading, refreshUser } = useAuth();
	const router = useRouter();
	const [nfcId, setNfcId] = useState("");
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);

	useEffect(() => {
		if (!loading && !user) {
			router.push("/login");
		}
		if (user?.nfcId) {
			setNfcId(user.nfcId);
		}
	}, [user, loading, router]);

	const handleRegister = async () => {
		if (!user || !nfcId.trim()) {
			setMessage({ type: "error", text: "カードIDを入力してください" });
			return;
		}

		setSaving(true);
		setMessage(null);

		try {
			await updateDoc(doc(db, "users", user.id), {
				nfcId: nfcId.trim(),
				updatedAt: Timestamp.now(),
			});
			await refreshUser();
			setMessage({
				type: "success",
				text: "NFCカードを登録しました",
			});
		} catch (error) {
			console.error("NFC登録エラー:", error);
			setMessage({
				type: "error",
				text: "登録に失敗しました。もう一度お試しください",
			});
		} finally {
			setSaving(false);
		}
	};

	const handleRemove = async () => {
		if (!user) return;

		setSaving(true);
		setMessage(null);

		try {
			await updateDoc(doc(db, "users", user.id), {
				nfcId: null,
				updatedAt: Timestamp.now(),
			});
			await refreshUser();
			setNfcId("");
			setMessage({
				type: "success",
				text: "NFCカードの登録を解除しました",
			});
		} catch (error) {
			console.error("NFC解除エラー:", error);
			setMessage({
				type: "error",
				text: "解除に失敗しました。もう一度お試しください",
			});
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
		<>
			<PageHeader
				title='NFC カード登録'
				description='入退室記録に使用するカードを登録'
				onBack={() => router.back()}
			/>
			<PageContainer>
				<Card>
					<CardHeader>
						<div className='flex items-center gap-3'>
							<div className='p-3 bg-primary/10 rounded-full'>
								<CreditCard className='w-6 h-6 text-primary' />
							</div>
							<div>
								<CardTitle>NFC カード登録</CardTitle>
								<p className='text-sm text-muted-foreground mt-1'>
									入退室記録に使用するカードIDを設定
								</p>
							</div>
						</div>
					</CardHeader>
					<CardContent className='space-y-6'>
						<div className='space-y-4'>
							<div>
								<label className='text-sm font-medium mb-2 block'>
									カード ID
								</label>
								<Input
									value={nfcId}
									onChange={(e) => setNfcId(e.target.value)}
									placeholder='NFCカードIDを入力'
									disabled={saving}
								/>
								<p className='text-xs text-muted-foreground mt-2'>
									※ カードをリーダーにかざして取得したIDを入力してください
								</p>
							</div>

							{message && (
								<div
									className={`flex items-center gap-2 p-3 rounded-lg ${
										message.type === "success"
											? "bg-green-500/10 text-green-600"
											: "bg-red-500/10 text-red-600"
									}`}
								>
									{message.type === "success" ? (
										<Check className='w-4 h-4' />
									) : (
										<AlertCircle className='w-4 h-4' />
									)}
									<p className='text-sm font-medium'>{message.text}</p>
								</div>
							)}
						</div>

						<div className='flex gap-2'>
							<Button
								onClick={handleRegister}
								disabled={!nfcId.trim() || saving}
								className='flex-1'
								size='lg'
							>
								{saving ? "処理中..." : user.nfcId ? "更新" : "登録"}
							</Button>
							{user.nfcId && (
								<Button
									onClick={handleRemove}
									disabled={saving}
									variant='outline'
									size='lg'
								>
									解除
								</Button>
							)}
						</div>

						<div className='border-t pt-4'>
							<h3 className='font-medium mb-2'>NFCカードについて</h3>
							<ul className='text-sm text-muted-foreground space-y-1'>
								<li>• 入退室時にカードをかざすことでポイントが貯まります</li>
								<li>• 1つのカードは1人のユーザーにのみ登録できます</li>
								<li>• カードを紛失した場合は設定画面から解除してください</li>
							</ul>
						</div>
					</CardContent>
				</Card>
			</PageContainer>
		</>
	);
}



