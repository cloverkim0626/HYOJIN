import './globals.css';

export const metadata = {
  title: 'KIM HYOJIN ENGLISH',
  description: '필연적 정답을 설계하는 고해상도 영어',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {children}
      </body>
    </html>
  );
}
