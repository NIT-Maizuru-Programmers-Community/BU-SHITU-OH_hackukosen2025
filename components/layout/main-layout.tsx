"use client";

import { ReactNode } from "react";
import { Header } from "./header";
import { BottomNavigation } from "./bottom-navigation";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/ui/loading-spinner";

interface MainLayoutProps {
	children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
	const { user, loading } = useAuth();

	if (loading) {
		return <LoadingScreen label='読み込み中...' />;
	}

	return (
		<div className='flex flex-col min-h-screen'>
			<Header
				userName={user?.displayName}
				userAvatar={user?.photoURL}
				userPoints={user?.points}
			/>

			<main className='flex-1 pb-16 max-w-screen-lg mx-auto w-full'>
				{children}
			</main>

			<BottomNavigation />
		</div>
	);
}




