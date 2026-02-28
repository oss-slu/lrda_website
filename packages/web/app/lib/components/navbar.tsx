'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuthStore } from '../stores/authStore';
import { hasInstructorAccess } from '../stores/authHelpers';
import { useShallow } from 'zustand/react/shallow';

export default function Navbar() {
  const { user, isLoggedIn, logout } = useAuthStore(
    useShallow(state => ({
      user: state.user,
      isLoggedIn: state.isLoggedIn,
      logout: state.logout,
    })),
  );
  const name = user?.name ?? null;

  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await logout();
      if (typeof window !== 'undefined') window.location.href = '/';
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const isInstructor = hasInstructorAccess(user);

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/notes', label: 'Notes', authRequired: true },
    ...(isInstructor
      ? [{ href: '/instructor-dashboard', label: 'Dashboard', authRequired: true }]
      : []),
    { href: '/map', label: 'Map' },
    { href: '/stories', label: 'Stories' },
    { href: '/resources', label: 'Resources' },
  ];

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const linkClass = (href: string) =>
    cn(
      'text-sm font-medium rounded-md px-3 py-1.5 transition-colors',
      isActive(href)
        ? 'bg-blue-50 text-blue-600'
        : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600',
    );

  // Mobile nav link (closes sheet on click)
  const renderMobileLink = (item: { href: string; label: string }) => (
    <Link
      key={item.href}
      href={item.href}
      onClick={() => setMobileOpen(false)}
      className={cn(
        'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
        isActive(item.href)
          ? 'bg-blue-50 text-blue-600'
          : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600',
      )}
    >
      {item.label}
    </Link>
  );

  return (
    <nav className='sticky top-0 z-50 flex w-full items-center justify-between bg-white border-b border-gray-200 px-6 py-3'>
      {/* Mobile hamburger */}
      <Button
        variant='ghost'
        size='icon'
        className='md:hidden text-gray-600 hover:bg-gray-100 hover:text-blue-600'
        onClick={() => setMobileOpen(true)}
        aria-label='Open menu'
      >
        <Menu className='h-5 w-5' />
      </Button>

      {/* Desktop links */}
      <div className='hidden md:flex items-center gap-1'>
        {navItems.map(item =>
          (!item.authRequired || name) && (
            <Link
              key={item.href}
              href={item.href}
              className={linkClass(item.href)}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ),
        )}
      </div>

      {/* Right side: auth */}
      <div className='flex items-center'>
        {name ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                className='text-gray-600 hover:bg-gray-100 hover:text-blue-600 gap-2'
              >
                <User className='h-4 w-4' />
                <span className='max-w-[120px] truncate text-sm'>{name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-48'>
              <DropdownMenuLabel className='font-normal'>
                <p className='text-sm font-medium truncate'>{name}</p>
                {user?.email && (
                  <p className='text-xs text-muted-foreground truncate'>{user.email}</p>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className='cursor-pointer'
              >
                <LogOut className='h-4 w-4 mr-2' />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className='flex items-center gap-2'>
            <Button variant='default' asChild className='whitespace-nowrap'>
              <Link href='/login'>Login</Link>
            </Button>
            <Button variant='outline' asChild className='whitespace-nowrap'>
              <Link href='/signup'>Sign Up</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Mobile sheet drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side='left' className='bg-white border-gray-200 w-64'>
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav className='flex flex-col gap-1 mt-4'>
            {navItems.map(item =>
              (!item.authRequired || name) && renderMobileLink(item),
            )}
          </nav>
          <div className='mt-auto pt-6 border-t border-gray-200'>
            {name ? (
              <div className='space-y-2'>
                <p className='text-sm font-medium text-gray-900 truncate px-3'>{name}</p>
                {user?.email && (
                  <p className='text-xs text-gray-500 truncate px-3'>{user.email}</p>
                )}
                <Button
                  variant='ghost'
                  className='w-full justify-start text-gray-600 hover:bg-gray-100 hover:text-blue-600'
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                >
                  <LogOut className='h-4 w-4 mr-2' />
                  Log out
                </Button>
              </div>
            ) : (
              <div className='flex flex-col gap-2 px-3'>
                <Button variant='default' asChild>
                  <Link href='/login' onClick={() => setMobileOpen(false)}>Login</Link>
                </Button>
                <Button variant='outline' asChild>
                  <Link href='/signup' onClick={() => setMobileOpen(false)}>Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
