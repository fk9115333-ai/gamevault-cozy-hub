import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2 } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { startCloudSync } from "@/lib/store";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "GameHub — لوحة الألعاب الشخصية" },
      {
        name: "description",
        content: "لوحة تحكم فاخرة لإدارة مكتبة الألعاب والإحصائيات والإنجازات لفيصل ومشعل.",
      },
      { property: "og:title", content: "GameHub — لوحة الألعاب الشخصية" },
      {
        property: "og:description",
        content: "إدارة مكتبة الألعاب والإحصائيات والإنجازات في مكان واحد.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800;900&family=Tajawal:wght@300;400;500;700;800&display=swap",
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

/** مكون شريط البحث الفوري المدمج بالترويسة لستيم */
function SteamGlobalSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["global-steam-search", searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.trim().length < 2) return [];
      const res = await fetch(`https://www.cheapshark.com/api/1.0/deals?storeID=1&title=${encodeURIComponent(searchTerm)}&pageSize=5`);
      const data = await res.json();
      return data.map((item: any) => ({
        id: item.dealID,
        name: item.title,
        thumb: item.thumb,
        price: `$${item.salePrice}`,
        url: `https://store.steampowered.com/app/${item.steamAppID || '1174180'}`
      }));
    },
    enabled: searchTerm.trim().length >= 2,
  });

  return (
    <div className="relative w-full max-w-sm mx-auto my-2 px-4">
      <div className="flex items-center gap-2 rounded-2xl bg-neutral-900/90 border border-neutral-800 px-4 py-2.5 shadow-xl">
        <Search className="size-4 shrink-0 text-blue-400" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ابحث عن أي لعبة في ستيم..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-500 text-white"
        />
        {isFetching && <Loader2 className="size-4 animate-spin text-blue-500" />}
      </div>

      {searchTerm.trim().length >= 2 && (
        <div className="absolute left-4 right-4 mt-2 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-50">
          {isFetching ? (
            <div className="p-3 text-center text-xs text-neutral-400">جاري البحث في ستيم...</div>
          ) : results.length === 0 ? (
            <div className="p-3 text-center text-xs text-neutral-400">لا توجد نتائج مطابقة</div>
          ) : (
            results.map((game: any) => (
              <a
                key={game.id}
                href={game.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 hover:bg-neutral-800/60 border-b border-neutral-800/50 last:border-none transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <img src={game.thumb} alt={game.name} className="w-10 h-7 object-cover rounded-md" />
                  <span className="text-xs font-bold text-white line-clamp-1">{game.name}</span>
                </div>
                <span className="text-xs font-bold text-emerald-400">{game.price}</span>
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => startCloudSync(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>
        <SteamGlobalSearch />
        <Outlet />
      </AppShell>
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
