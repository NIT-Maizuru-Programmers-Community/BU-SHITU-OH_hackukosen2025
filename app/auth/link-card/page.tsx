"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/useAuth";
import { CreditCard, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type LinkStatus = "loading" | "ready" | "linking" | "success" | "error";

export default function LinkCardPage() {
	const { user, loading: authLoading, getToken } = useAuth();
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	const [status, setStatus] = useState<LinkStatus>("loading");
	const [cardInfo, setCardInfo] = useState<{
		nfcCardId: string;
		expiresAt: string;
	} | null>(null);
	const [error, setError] = useState<string>("");

	// トークン情報を取得
	useEffect(() => {
		if (!token) {
			setStatus("error");
			setError("無効なリンクです");
			return;
		}

		const fetchTokenInfo = async () => {
			try {
				const response = await fetch(
					`/api/auth/link-card?token=${encodeURIComponent(token)}`
				);
				const data = await response.json();

				if (!response.ok) {
					setStatus("error");
					setError(data.error || "トークン情報の取得に失敗しました");
					return;
				}

				setCardInfo(data.data);
				setStatus("ready");
			} catch (err) {
				console.error("Token fetch error:", err);
				setStatus("error");
				setError("トークン情報の取得に失敗しました");
			}
		};

		fetchTokenInfo();
	}, [token]);

	// 認証チェック
	useEffect(() => {
		if (!authLoading && !user) {
			// ログインページにリダイレクト（連携ページに戻ってくるように）
			router.push(`/login?redirect=/auth/link-card?token=${token}`);
		}
	}, [user, authLoading, router, token]);

	// カード連携処理
	const handleLinkCard = async () => {
		if (!user || !token) return;

		setStatus("linking");
		setError("");

		try {
			const idToken = await getToken();
			if (!idToken) {
				setStatus("error");
				setError("認証トークンの取得に失敗しました");
				return;
			}

			const response = await fetch("/api/auth/link-card", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${idToken}`,
				},
				body: JSON.stringify({ linkToken: token }),
			});

			const data = await response.json();

			if (!response.ok) {
				setStatus("error");
				setError(data.error || "連携に失敗しました");
				return;
			}

			setStatus("success");

			// 3秒後にホームに戻る
			setTimeout(() => {
				router.push("/");
			}, 3000);
		} catch (err) {
			console.error("Link card error:", err);
			setStatus("error");
			setError("連携中にエラーが発生しました");
		}
	};

	if (authLoading || status === "loading") {
		return <LoadingScreen label='読み込み中...' />;
	}

	if (!user) {
		return <LoadingScreen label='リダイレクト中...' />;
	}

	return (
		<PageContainer>
			<div className='max-w-md mx-auto mt-8'>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<CreditCard className='w-6 h-6' />
							ICカード連携
						</CardTitle>
					</CardHeader>
					<CardContent>
						{status === "error" && (
							<Alert variant='destructive' className='mb-4'>
								<XCircle className='h-4 w-4' />
								<AlertTitle>エラー</AlertTitle>
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						{status === "ready" && cardInfo && (
							<>
								<div className='mb-6'>
									<p className='text-sm text-muted-foreground mb-2'>カードID</p>
									<p className='font-mono text-sm bg-muted p-2 rounded'>
										{cardInfo.nfcCardId}
									</p>
								</div>

								<div className='mb-6'>
									<Alert>
										<AlertCircle className='h-4 w-4' />
										<AlertTitle>確認</AlertTitle>
										<AlertDescription>
											このICカードをあなたのアカウントに連携しますか？
											<br />
											連携後、このカードでログインできるようになります。
										</AlertDescription>
									</Alert>
								</div>

								<Button onClick={handleLinkCard} className='w-full' size='lg'>
									連携する
								</Button>

								<p className='text-xs text-muted-foreground text-center mt-4'>
									有効期限:{" "}
									{new Date(cardInfo.expiresAt).toLocaleString("ja-JP")}
								</p>
							</>
						)}

						{status === "linking" && (
							<div className='text-center py-8'>
								<LoadingScreen label='連携中...' />
							</div>
						)}

						{status === "success" && (
							<>
								<Alert className='mb-4 border-green-500'>
									<CheckCircle className='h-4 w-4 text-green-500' />
									<AlertTitle>連携完了</AlertTitle>
									<AlertDescription>
										ICカードが正常に連携されました。
										<br />
										次回からこのカードでログインできます。
									</AlertDescription>
								</Alert>

								<p className='text-sm text-muted-foreground text-center'>
									自動的にホームに戻ります...
								</p>
							</>
						)}

						{status === "error" && (
							<Button
								onClick={() => router.push("/")}
								variant='outline'
								className='w-full mt-4'
							>
								ホームに戻る
							</Button>
						)}
					</CardContent>
				</Card>
			</div>
		</PageContainer>
	);
}
