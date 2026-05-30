import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';

export const metadata: Metadata = {
  title: '哄哄模拟器',
  description: 'AI扮演你正在生气的对象，通过选择题学习如何哄好Ta！',
  keywords: ['哄哄模拟器', 'AI游戏', '恋爱', '哄对象'],
  openGraph: {
    title: '哄哄模拟器',
    description: 'AI扮演你正在生气的对象，通过选择题学习如何哄好Ta！',
    locale: 'zh_CN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="zh-CN">
      <body className={`antialiased`}>
        {isDev && <Inspector />}
        {children}
      </body>
    </html>
  );
}
