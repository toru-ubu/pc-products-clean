import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { getAnalytics, logEvent } from 'firebase/analytics'; // ← Analytics機能を追加

// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyCj5RQo5C-r0pUsZFYT6X-jhvg5R6lfsNk",
  authDomain: "pc-price-db.firebaseapp.com",
  projectId: "pc-price-db",
  storageBucket: "pc-price-db.appspot.com",
  messagingSenderId: "871225073845",
  appId: "1:871225073845:web:17f515c55848dfdb2b5efc", // ← 正しいappIdに修正
  measurementId: "G-97K6QY9QW9"
};

// Firebase初期化
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Analytics初期化（クライアントサイドのみ）
let analytics: any = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
    console.log('Firebase Analytics initialized successfully');
  } catch (error) {
    console.error('Firebase Analytics initialization error:', error);
  }
}

// カスタムイベント送信関数
export const logCustomEvent = (eventName: string, parameters: any) => {
  try {
    console.log('=== Analytics Event Debug ===');
    console.log('Event name:', eventName);
    console.log('Parameters:', parameters);
    console.log('Analytics object exists:', !!analytics);
    console.log('Window object exists:', typeof window !== 'undefined');
    console.log('Current URL:', typeof window !== 'undefined' ? window.location.href : 'N/A');
    
    if (analytics) {
      logEvent(analytics, eventName, parameters);
      console.log('✅ Analytics event sent successfully:', eventName, parameters);
    } else {
      console.warn('❌ Analytics not initialized, event not sent:', eventName);
      console.warn('Analytics object:', analytics);
    }
    console.log('=== End Analytics Event Debug ===');
  } catch (error) {
    console.error('❌ Analytics event error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
  }
};

// Firebase Analytics設定テスト関数
export const testAnalytics = () => {
  console.log('=== Firebase Analytics Test ===');
  console.log('Firebase config:', firebaseConfig);
  console.log('Analytics object:', analytics);
  console.log('Is client side:', typeof window !== 'undefined');
  
  if (analytics) {
    // テストイベントを送信
    logCustomEvent('test_event', {
      test_parameter: 'test_value',
      timestamp: new Date().toISOString()
    });
    console.log('✅ Test event sent');
  } else {
    console.log('❌ Analytics not available for testing');
  }
  console.log('=== End Analytics Test ===');
};

// 商品データの型定義
export interface Product {
  id: string;
  name: string;
  maker: string;
  type: string; // PC形状（デスクトップ・ノートブック）
  price: number;
  effectiveprice: number;
  cpu: string;
  gpu: string;
  memory: string;
  storage: string;
  imageUrl: string;
  productUrl: string;
  isActive: boolean;
  campaigns: Array<{
    type: string;
    amount: number;
  }>;
  campaignIds: string[];
  discountrate: number;
  shippingFee: number;
  regularPoint: number;
  category: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}



// 商品データを取得する関数（シンプル版）
export async function getProducts(): Promise<Product[]> {
  try {
    console.log('Firebaseから商品データを取得中...');
    const productsRef = collection(db, 'products');
    
    const q = query(
      productsRef, 
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`取得した商品数: ${querySnapshot.size}件`);
    
    const products: Product[] = [];
    
    querySnapshot.docs.forEach((doc) => {
      const data = doc.data();
      
      const product: Product = {
        id: doc.id,
        name: data.name || '',
        maker: data.maker || '',
        type: (() => {
          const typeValue = data.type || data.category || 'デスクトップ';
          console.log('Product type debug:', data.name, 'type:', data.type, 'category:', data.category, 'final:', typeValue);
          return typeValue;
        })(),
        price: data.price || 0,
        effectiveprice: data.effectivePrice || data.price || 0,
        cpu: data.cpu || '',
        gpu: data.gpu || '',
        memory: data.memory || '',
        storage: data.storage || '',
        imageUrl: data.imageUrl || data.image_url || '',
        productUrl: data.productUrl || '',
        isActive: data.isActive !== false,
        campaigns: data.campaigns || [],
        campaignIds: data.campaignIds || [],
        discountrate: data.discountRate || 0,
        shippingFee: data.shippingFee || 0,
        regularPoint: data.regularPoint || 0,
        category: data.category || '',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
      
      products.push(product);
    });
    
    console.log('商品データの処理が完了しました');
    return products;
  } catch (error) {
    console.error('Firebaseからのデータ取得エラー:', error);
    throw error;
  }
}



// キャンペーン情報を取得する関数
export async function getCampaignInfo(campaignIds: string[]): Promise<{[key: string]: string}> {
  try {
    if (!campaignIds || campaignIds.length === 0) {
      return {};
    }

    console.log('キャンペーン情報を取得中...', campaignIds);
    
    const campaignTypes: {[key: string]: string} = {};
    
    // 各キャンペーンIDの情報を取得
    for (const campaignId of campaignIds) {
      try {
        const campaignDocRef = doc(db, 'campaigns', campaignId);
        const campaignDoc = await getDoc(campaignDocRef);
        if (campaignDoc.exists()) {
          const campaignData = campaignDoc.data();
          const campaignType = campaignData?.campaignType || '';
          
          // キャンペーンタイプをUI表示用に変換（対応済みタイプのみ）
          switch (campaignType) {
            case 'coupon':
              campaignTypes[campaignId] = 'クーポン';
              break;
            case 'sale':
            case 'frontier_sale':
            case 'pckoubou_sale':
            case 'tsukumo_sale':
              campaignTypes[campaignId] = 'セール';
              break;
            case 'point':
            case 'point_cashback':
              campaignTypes[campaignId] = 'ポイント';
              break;
            default:
              // 未知のキャンペーンタイプは無視（スキップ）
              continue;
          }
        }
      } catch (error) {
        console.error(`キャンペーン取得エラー (${campaignId}):`, error);
      }
    }
    
    return campaignTypes;
  } catch (error) {
    console.error('キャンペーン情報取得エラー:', error);
    return {};
  }
}

export default app;
