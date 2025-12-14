"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/main-layout";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider attribute='class' defaultTheme='system' enableSystem>
			<AuthProvider>
				<MainLayout>{children}</MainLayout>
			</AuthProvider>
		</ThemeProvider>
	);
}
