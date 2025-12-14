"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, RefreshCw, LogIn } from "lucide-react";

export default function DevToolsPage() {
	const { firebaseUser, signIn, user } = useAuth();
	const [token, setToken] = useState<string>("");
	const [copied, setCopied] = useState(false);
	const [loading, setLoading] = useState(false);

	const fetchToken = async () => {
		if (!firebaseUser) return;

		setLoading(true);
		try {
			const idToken = await firebaseUser.getIdToken(true); // force refresh
			setToken(idToken);
		} catch (error) {
			console.error("トークン取得エラー:", error);
			alert("トークンの取得に失敗しました");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (firebaseUser) {
			fetchToken();
		}
	}, [firebaseUser]);

	const copyToClipboard = async () => {
		try {
			await navigator.clipboard.writeText(token);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error("コピーエラー:", error);
			alert("コピーに失敗しました");
		}
	};

	const copyAsCurl = async () => {
		const curlCommand = `curl -X GET http://localhost:3000/api/points/balance?userId=${user?.id} \\
  -H "Authorization: Bearer ${token}"`;

		try {
			await navigator.clipboard.writeText(curlCommand);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error("コピーエラー:", error);
		}
	};

	if (!firebaseUser) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-gray-50'>
				<Card className='w-full max-w-md'>
					<CardHeader>
						<CardTitle>開発ツール - トークン取得</CardTitle>
					</CardHeader>
					<CardContent>
						<p className='text-gray-600 mb-4'>
							Firebase Auth Tokenを取得するには、まずログインしてください。
						</p>
						<Button onClick={signIn} className='w-full'>
							<LogIn className='w-4 h-4 mr-2' />
							Google でログイン
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-gray-50 py-8 px-4'>
			<div className='max-w-4xl mx-auto space-y-6'>
				<Card>
					<CardHeader>
						<CardTitle>開発ツール - Firebase Auth Token</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div>
							<h3 className='font-semibold mb-2'>ユーザー情報</h3>
							<div className='bg-gray-100 p-4 rounded-lg space-y-1 text-sm'>
								<p>
									<span className='font-medium'>UID:</span> {firebaseUser.uid}
								</p>
								<p>
									<span className='font-medium'>Email:</span>{" "}
									{firebaseUser.email}
								</p>
								<p>
									<span className='font-medium'>表示名:</span>{" "}
									{user?.displayName}
								</p>
								<p>
									<span className='font-medium'>ポイント:</span>{" "}
									{user?.points || 0}pt
								</p>
							</div>
						</div>

						<div>
							<div className='flex items-center justify-between mb-2'>
								<h3 className='font-semibold'>Firebase ID Token</h3>
								<Button
									onClick={fetchToken}
									variant='outline'
									size='sm'
									disabled={loading}
								>
									<RefreshCw
										className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
									/>
									更新
								</Button>
							</div>

							{token ? (
								<div className='space-y-2'>
									<div className='bg-gray-100 p-4 rounded-lg font-mono text-xs break-all max-h-40 overflow-y-auto'>
										{token}
									</div>

									<div className='flex gap-2'>
										<Button
											onClick={copyToClipboard}
											variant='outline'
											className='flex-1'
										>
											<Copy className='w-4 h-4 mr-2' />
											{copied ? "コピーしました！" : "トークンをコピー"}
										</Button>
										<Button
											onClick={copyAsCurl}
											variant='outline'
											className='flex-1'
										>
											<Copy className='w-4 h-4 mr-2' />
											curl コマンドをコピー
										</Button>
									</div>

									<div className='text-xs text-gray-500 mt-2'>
										※
										トークンは1時間で期限切れになります。期限切れの場合は「更新」ボタンをクリックしてください。
									</div>
								</div>
							) : (
								<div className='bg-gray-100 p-4 rounded-lg text-center text-gray-500'>
									トークンを読み込んでいます...
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>API テスト例</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div>
							<h4 className='font-medium mb-2'>bash / curl</h4>
							<pre className='bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto'>
								{`# 環境変数にセット
export FIREBASE_TOKEN="${token.substring(0, 20)}..."

# ポイント残高取得
curl -X GET http://localhost:3000/api/points/balance?userId=${
									firebaseUser.uid
								} \\
  -H "Authorization: Bearer $FIREBASE_TOKEN"

# ログインボーナス取得
curl -X POST http://localhost:3000/api/auth/daily-bonus \\
  -H "Authorization: Bearer $FIREBASE_TOKEN"

# ポイント送金
curl -X POST http://localhost:3000/api/transfer/send \\
  -H "Authorization: Bearer $FIREBASE_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "receiverId": "受信者のUID",
    "amount": 10,
    "message": "テスト送金"
  }'`}
							</pre>
						</div>

						<div>
							<h4 className='font-medium mb-2'>JavaScript</h4>
							<pre className='bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto'>
								{`// ブラウザのコンソールで実行
const token = "${token.substring(0, 20)}...";

fetch('http://localhost:3000/api/points/balance?userId=${firebaseUser.uid}', {
  headers: {
    'Authorization': \`Bearer \${token}\`
  }
})
.then(res => res.json())
.then(data => console.log(data));`}
							</pre>
						</div>

						<div>
							<h4 className='font-medium mb-2'>Python</h4>
							<pre className='bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto'>
								{`import requests

token = "${token.substring(0, 20)}..."
user_id = "${firebaseUser.uid}"

# ポイント残高取得
response = requests.get(
    f'http://localhost:3000/api/points/balance?userId={user_id}',
    headers={'Authorization': f'Bearer {token}'}
)
print(response.json())`}
							</pre>
						</div>
					</CardContent>
				</Card>

				<div className='text-center text-sm text-red-600 font-medium'>
					⚠️ 本番環境では必ずこのページを削除してください
				</div>
			</div>
		</div>
	);
}
