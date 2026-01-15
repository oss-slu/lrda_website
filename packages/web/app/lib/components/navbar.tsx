'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNotesStore } from '../stores/notesStore';
import { useAuthStore } from '../stores/authStore';
import { useShallow } from 'zustand/react/shallow';
import { usersService } from '../services';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Navbar() {
  // Use auth store for reactive auth state
  const { user, isLoggedIn, logout } = useAuthStore(
    useShallow(state => ({
      user: state.user,
      isLoggedIn: state.isLoggedIn,
      logout: state.logout,
    })),
  );
  const name = user?.name ?? null;

  const [isInstructor, setIsInstructor] = useState<boolean>(false);
  const [selectOpen, setSelectOpen] = useState<boolean>(false);
  const pathname = usePathname();
  const router = useRouter();
  const { viewMode, setViewMode } = useNotesStore(
    useShallow(state => ({
      viewMode: state.viewMode,
      setViewMode: state.setViewMode,
    })),
  );

  const handleLogout = async () => {
    try {
      await logout();
      if (typeof window !== 'undefined') window.location.href = '/';
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  // Check if user is instructor
  useEffect(() => {
    const checkInstructorStatus = async () => {
      if (!user?.uid) return;
      try {
        const roles = user.roles;
        const userId = user.uid;

        if (userId) {
          const userData = await usersService.fetchById(userId);
          // Check if user is an instructor (has administrator role OR isInstructor flag)
          const isInstr = !!roles?.administrator || !!userData?.isInstructor;
          setIsInstructor(isInstr);
        }
      } catch (error) {
        console.error('Error checking instructor status:', error);
      }
    };
    checkInstructorStatus();
  }, [user]);

  // Define nav items
  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/notes', label: 'Notes', authRequired: true },
    { href: '/map', label: 'Map' },
    { href: '/stories', label: 'Stories' },
    { href: '/resources', label: 'Resources' },
  ];

  // Active link styling
  const linkClass = (href: string) =>
    cn(
      'text-xl font-bold transition duration-300 ease-in-out mr-6',

      href === '/' ?
        (
          pathname === '/' // Home should only match exactly
        ) ?
          'text-blue-500'
        : 'text-blue-300 hover:text-blue-500'
      : (
        pathname.startsWith(href) // Others can use startsWith
      ) ?
        'text-blue-500'
      : 'text-blue-300 hover:text-blue-500',
    );

  return (
    <nav className='flex w-full items-center justify-between bg-gray-900 px-6 py-4 text-white'>
      {/* Left side links */}
      <div className='flex items-center'>
        {navItems.map(
          item =>
            (!item.authRequired || name) &&
            (item.href === '/notes' && isInstructor ?
              <div key={item.href} className='mr-6'>
                <Select
                  value={viewMode}
                  open={selectOpen}
                  onOpenChange={open => {
                    // If trying to open from another page, navigate first without opening dropdown
                    if (open && !pathname.startsWith('/notes')) {
                      // Navigate directly - viewMode is already persisted in localStorage
                      router.push('/notes');
                      setSelectOpen(false); // Don't open the dropdown
                      return;
                    }
                    setSelectOpen(open);
                  }}
                  onValueChange={value => {
                    setViewMode(value as 'my' | 'review');
                    setSelectOpen(false);
                    // Navigate to notes page if not already there
                    if (!pathname.startsWith('/notes')) {
                      router.push('/notes');
                    }
                  }}
                >
                  <SelectTrigger
                    className={cn(
                      'h-auto w-auto cursor-pointer border-none bg-transparent px-0 py-0 text-xl font-bold text-blue-300 shadow-none transition duration-300 ease-in-out hover:text-blue-500 focus:ring-0 focus:ring-offset-0',
                      pathname.startsWith(item.href) ? 'text-blue-500' : '',
                    )}
                  >
                    <SelectValue>
                      <span
                        className={cn(
                          pathname.startsWith(item.href) ? 'text-blue-500' : (
                            'text-blue-300 hover:text-blue-500'
                          ),
                        )}
                      >
                        {item.label}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='my'>My Notes</SelectItem>
                    <SelectItem value='review'>Students Notes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            : <Link
                key={item.href}
                href={item.href}
                className={linkClass(item.href)}
                aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
              >
                {item.label}
              </Link>),
        )}
      </div>

      {/* Right side buttons */}
      <div>
        {name ?
          <div className='flex items-center gap-6'>
            <span className='min-w-max max-w-[150px] truncate text-lg font-semibold' title={name}>
              Hi, {name}!
            </span>
            <Button
              id='navbar-logout'
              className='rounded border border-blue-700 bg-blue-600 px-4 py-2 font-semibold text-white shadow hover:bg-blue-700'
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        : <div className='flex items-center gap-2'>
            <Button
              variant='default'
              onClick={() => (window.location.href = '/login')}
              className='whitespace-nowrap'
            >
              Login
            </Button>
            <Button
              variant='outline'
              onClick={() => (window.location.href = '/signup')}
              className='whitespace-nowrap'
            >
              Sign Up
            </Button>
          </div>
        }
      </div>
    </nav>
  );
}
