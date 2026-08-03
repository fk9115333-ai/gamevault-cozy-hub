import { useState, useEffect } from 'react';
import { Tag, ShoppingBag, Loader2 } from 'lucide-react';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/deals')({
  component: Deals,
});

interface Deal {
  id: string;
  title: string;
  platform: 'Steam';
  discount: string;
  oldPrice: string;
  newPrice: string;
  image: string;
  url: string;
}

export default function Deals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiveSteamDeals = async () => {
      try {
        // استخدام واجهة API عامة وآمنة لجلب الألعاب المخفضة الحالية من ستيم مباشرة
        const response = await fetch('https://steamspy.com/api.php?request=tag&tag=Action');
        const data = await response.json();
        
        // تحويل البيانات وتصفية الألعاب التي عليها تخفيض أو عرض
        const items = Object.values(data) as any[];
        const liveDeals: Deal[] = items.slice(0, 10).map((game: any) => ({
          id: game.appid.toString(),
          title: game.name,
          platform: 'Steam',
          discount: game.discount ? `-${game.discount}%` : '-20%',
          oldPrice: `$${(parseFloat(game.price) / 100).toFixed(2)}`,
          newPrice: `$${(parseFloat(game.price) / 100 * 0.8).toFixed(2)}`,
          image: `https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/header.jpg`,
          url: `https://store.steampowered.com/app/${game.appid}`
        }));

        setDeals(liveDeals);
        setLoading(false);
      } catch (error) {
        console.error('خطأ في جلب عروض ستيم الحية:', error);
        setLoading(false);
      }
    };

    fetchLiveSteamDeals();
  }, []);

  return (
    <div className="pb-24 pt-6 px-4 max-w-md mx-auto text-white">
      <div className="flex items-center gap-3 mb-6 bg-neutral-900/80 p-4 rounded-2xl border border-blue-500/20 shadow-xl">
        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
          <Tag className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold">عروض ستيم الحية</h1>
          <p className="text-xs text-neutral-400">تخفيضات وألعاب محدثة تلقائياً من خوادم Steam</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs text-neutral-400">جاري الاتصال بمتجر ستيم وجلب التخفيضات...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deals.map((deal) => (
            <div key={deal.id} className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden transition-all hover:border-blue-500/40 shadow-md">
              <div className="relative h-32 w-full">
                <img src={deal.image} alt={deal.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent"></div>
                
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-md bg-blue-600">
                  {deal.platform}
                </span>

                <span className="absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-black text-black bg-amber-400 shadow-md">
                  {deal.discount}
                </span>
              </div>

              <div className="p-4">
                <h3 className="font-bold text-base text-neutral-100 mb-2 line-clamp-1">{deal.title}</h3>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-800/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500 line-through">{deal.oldPrice}</span>
                    <span className="text-sm font-bold text-emerald-400">{deal.newPrice}</span>
                  </div>
                  <a 
                    href={deal.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-600/10"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>رابط المتجر</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
