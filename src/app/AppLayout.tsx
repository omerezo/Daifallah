'use client';

import { useMemo, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Wallet,
  Users,
  BarChart3,
  Settings,
  ChevronDown,
  User,
  LogOut,
  Landmark,
} from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from '@/hooks/use-translation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useData } from '@/context/data-provider';
import { LanguageToggle } from '@/components/language-toggle';
import { ThemeToggle } from '@/components/theme-toggle';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { t, lang, dir } = useTranslation();
  const { currentUser, logout } = useData();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.replace('/login');
    }
  }, [currentUser, router]);

  const menuItems = useMemo(
    () => [
      {
        href: '/dashboard',
        label: t('dashboard'),
        icon: LayoutDashboard,
      },
      {
        label: t('reports'),
        icon: BarChart3,
        subItems: [
          { href: '/reports/monthly', label: t('monthly_reports') },
          { href: '/reports/yearly', label: t('yearly_reports') },
        ],
      },
      {
        href: '/payments',
        label: t('payments'),
        icon: Wallet,
      },
      {
        href: '/participants',
        label: t('participants'),
        icon: Users,
      },
      {
        href: '/expenses',
        label: t('expenses'),
        icon: Landmark,
      },
      {
        href: '/wallets',
        label: t('wallets'),
        icon: Wallet,
      },
    ],
    [t]
  );

  if (!currentUser) {
    return null; // Or a loading spinner
  }

  return (
    <SidebarProvider>
      <div className="flex">
        <Sidebar
          side={dir === 'rtl' ? 'right' : 'left'}
          collapsible="icon"
          className="border-border"
        >
          <SidebarHeader className="border-b border-border">
            <div className="flex items-center gap-2 p-1">
              <Logo className="w-8 h-8" />
              <h2 className="font-display text-lg font-semibold tracking-tight">
                {t('app_name')}
              </h2>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {menuItems.map((item) =>
                item.subItems ? (
                  <Collapsible
                    asChild
                    key={item.label}
                    defaultOpen={item.subItems.some((sub) =>
                      pathname.startsWith(sub.href)
                    )}
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          isActive={item.subItems.some((sub) =>
                            pathname.startsWith(sub.href)
                          )}
                          className="justify-between group"
                        >
                          <div className="flex items-center gap-2">
                            <item.icon />
                            <span>{item.label}</span>
                          </div>
                          <ChevronDown className="transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.subItems.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.href}>
                              <Link href={subItem.href} legacyBehavior passHref>
                                <SidebarMenuSubButton
                                  isActive={pathname.startsWith(subItem.href)}
                                >
                                  {subItem.label}
                                </SidebarMenuSubButton>
                              </Link>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.label}>
                    <Link href={item.href!} legacyBehavior passHref>
                      <SidebarMenuButton
                        isActive={pathname.startsWith(item.href!)}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                )
              )}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="flex-col !items-stretch gap-2 border-t border-border">
            <SidebarMenu>
              {currentUser.role === 'Admin' && (
                <SidebarMenuItem>
                  <Link href="/users">
                    <SidebarMenuButton isActive={pathname.startsWith('/users')}>
                      <Users />
                      <span>{t('user_management')}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <Link href="/settings">
                  <SidebarMenuButton
                    isActive={pathname.startsWith('/settings')}
                  >
                    <Settings />
                    <span>{t('settings')}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
            <div className="p-2 flex items-center justify-center gap-2 border-t border-border">
                <LanguageToggle />
                <ThemeToggle />
            </div>
            <div className="p-2 border-t border-border">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 overflow-hidden p-2 h-auto"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={PlaceHolderImages[0].imageUrl}
                        alt={currentUser.name}
                      />
                      <AvatarFallback>{currentUser.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start overflow-hidden">
                      <span className="truncate font-medium">{currentUser.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {currentUser.email}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {currentUser.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {currentUser.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                    <span>{t('profile')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                    <span>{t('log_out')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex h-12 items-center gap-4 border-b bg-background/50 px-4 backdrop-blur-sm md:h-14 md:px-6">
            <SidebarTrigger />
            <div className="flex-1">
              {/* Can add breadcrumbs or global search here */}
            </div>
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
