import type { Metadata } from 'next';
import ClientRedirect from './ClientRedirect';

export const revalidate = 86400; // 24h ISR（ハイブリッド運用）

export const metadata: Metadata = {
  title: 'RTX 5070 (12GB)搭載PC 最安値・安い順 | イヤバズnavi',
  description: 'RTX 5070 (12GB) 搭載デスクトップPCの最安値をメーカー横断で検索。価格・スペックで絞り込み、セールやクーポン適用後の実質価格も確認できます。',
  robots: {
    index: false,
    follow: false
  }
};

export default function Rtx5070Page() {
  return <ClientRedirect />;
}
