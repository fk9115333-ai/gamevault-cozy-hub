import { useState } from 'react';
import { Tag, ShoppingBag, Sparkles } from 'lucide-react';
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

const STEAM_DEALS: Deal[] = [
  {
    id: '1',
    title: 'Red Dead Redemption 2',
    platform: 'Steam',
    discount: '-67%',
    oldPrice: '$59.99',
    newPrice: '$19.79',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=60',
    url: 'https://store.steampowered.com/app/1174180/Red_Dead_Redemption_2/'
  },
  {
    id: '2',
    title: 'Cyberpunk 2077',
    platform: 'Steam',
    discount: '-50%',
    oldPrice: '$59.99',
    newPrice: '$29.99',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=500&auto=format&fit=crop&q=60',
    url: 'https://store.steampowered.com/app/1091500/Cyberpunk_2077/'
  },
  {
    id: '3',
    title: 'Grand Theft Auto V',
    platform: 'Steam',
    discount: '-63%',
    oldPrice: '$39.99',
    newPrice: '$14.89',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop&q=60',
    url: 'https://store.steampowered.com/app/271590/Grand_Theft_Auto_V/'
  },
  {
    id: '4',
    title: 'God of War',
    platform: 'Steam',
    discount: '-40%',
    oldPrice: '$49.99',
    newPrice: '$29.99',
    image: 'https://images.unsplash.com/photo-1612287233202-b51b366f1c8a?w=500&auto=format&fit=crop&q=60',
    url: 'https://store.steampowered.com/app/1593500/God_of_War/'
  },
  {
    id: '5',
    title: 'Hades II',
    platform: 'Steam',
    discount: '-20%',
    oldPrice: '$29.99',
    newPrice: '$23.99',
    image: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=500&auto=format&fit=crop&q=60',
    url: 'https://store.steampowered.com/app/1145350/Hades_II/'
  }
];

export default function Deals() {
  const [deals] = useState<Deal[]>(STEAM_DEALS);

  return (
    <div className="pb-24 pt-6 px-4 max-w-md mx-auto text-white">
      <div className="flex items-center gap-3 mb-6 bg-neutral-900/80 p-4 rounded-2xl border border-blue-500/20 shadow-xl">
        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
          <Tag className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold">عروض ستيم الحية</h1>
          <p className="text-xs text-neutral-400">تخفيضات ألعاب PC المباشرة</p>
        </div>
      </div>

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
    </div>
  );
}
