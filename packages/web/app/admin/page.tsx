'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/app/lib/stores/authStore';
import { useShallow } from 'zustand/react/shallow';
import { adminService } from '@/app/lib/services';
import type { AdminUserData, PendingApplication, AdminStats } from '@/app/lib/services';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Users,
  Shield,
  GraduationCap,
  UserCheck,
  ClipboardList,
  Search,
  Check,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const {
    user,
    isLoading: authLoading,
    isInitialized,
  } = useAuthStore(
    useShallow(state => ({
      user: state.user,
      isLoading: state.isLoading,
      isInitialized: state.isInitialized,
    })),
  );

  // Data state
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [applications, setApplications] = useState<PendingApplication[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Action state
  const [processingUid, setProcessingUid] = useState<string | null>(null);

  // Check authorization
  const isAdmin = user?.roles?.administrator === true;

  // Redirect non-admins
  useEffect(() => {
    if (isInitialized && !authLoading && !isAdmin) {
      router.push('/');
    }
  }, [isInitialized, authLoading, isAdmin, router]);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!isAdmin) return;

    setIsLoadingData(true);
    try {
      const [statsData, usersData, applicationsData] = await Promise.all([
        adminService.getStats(),
        adminService.fetchAllUsers(),
        adminService.fetchPendingApplications(),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setApplications(applicationsData);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setIsLoadingData(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, fetchData]);

  // Filter users by search
  const filteredUsers = users.filter(
    u =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Handle approve application
  const handleApprove = async (application: PendingApplication) => {
    if (!user?.uid || !user?.name) return;

    setProcessingUid(application.uid);
    try {
      await adminService.approveApplication(application.uid, user.uid, user.name);
      toast.success(`Approved ${application.name} as instructor`);
      await fetchData();
    } catch (error) {
      console.error('Error approving application:', error);
      toast.error('Failed to approve application');
    } finally {
      setProcessingUid(null);
    }
  };

  // Handle reject application
  const handleReject = async (application: PendingApplication) => {
    if (!user?.uid) return;

    setProcessingUid(application.uid);
    try {
      await adminService.rejectApplication(application.uid, user.uid, 'Rejected by admin');
      toast.success(`Rejected application from ${application.name}`);
      await fetchData();
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast.error('Failed to reject application');
    } finally {
      setProcessingUid(null);
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  // Loading state
  if (!isInitialized || authLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='flex items-center gap-2 text-gray-600'>
          <Loader2 className='h-5 w-5 animate-spin' />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Not authorized
  if (!isAdmin) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle className='text-center text-red-600'>Access Denied</CardTitle>
            <CardDescription className='text-center'>
              You must be an administrator to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8 flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Admin Dashboard</h1>
            <p className='mt-1 text-sm text-gray-500'>
              Manage users, applications, and system settings
            </p>
          </div>
          <Button variant='outline' size='sm' onClick={fetchData} disabled={isLoadingData}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingData ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className='mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <StatsCard
            title='Total Users'
            value={stats?.totalUsers ?? 0}
            icon={Users}
            loading={isLoadingData}
          />
          <StatsCard
            title='Administrators'
            value={stats?.totalAdmins ?? 0}
            icon={Shield}
            loading={isLoadingData}
          />
          <StatsCard
            title='Instructors'
            value={stats?.totalInstructors ?? 0}
            icon={GraduationCap}
            loading={isLoadingData}
          />
          <StatsCard
            title='Pending Applications'
            value={stats?.pendingApplications ?? 0}
            icon={ClipboardList}
            loading={isLoadingData}
            highlight={stats?.pendingApplications ? stats.pendingApplications > 0 : false}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue='applications' className='space-y-4'>
          <TabsList className='grid w-full max-w-md grid-cols-2'>
            <TabsTrigger value='applications' className='gap-2'>
              <ClipboardList className='h-4 w-4' />
              Applications
              {applications.length > 0 && (
                <Badge variant='secondary' className='ml-1'>
                  {applications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value='users' className='gap-2'>
              <Users className='h-4 w-4' />
              Users
            </TabsTrigger>
          </TabsList>

          {/* Applications Tab */}
          <TabsContent value='applications'>
            <Card>
              <CardHeader>
                <CardTitle>Instructor Applications</CardTitle>
                <CardDescription>
                  Review and process pending instructor applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingData ?
                  <div className='space-y-3'>
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className='h-24 w-full' />
                    ))}
                  </div>
                : applications.length === 0 ?
                  <div className='flex flex-col items-center justify-center py-12 text-center'>
                    <UserCheck className='mb-4 h-12 w-12 text-gray-300' />
                    <h3 className='text-lg font-medium text-gray-900'>No pending applications</h3>
                    <p className='mt-1 text-sm text-gray-500'>
                      All instructor applications have been processed.
                    </p>
                  </div>
                : <div className='space-y-4'>
                    {applications.map(app => (
                      <Card key={app.uid} className='border-l-4 border-l-blue-500'>
                        <CardContent className='pt-4'>
                          <div className='flex items-start justify-between gap-4'>
                            <div className='flex-1'>
                              <div className='flex items-center gap-2'>
                                <h4 className='font-semibold text-gray-900'>{app.name}</h4>
                                <Badge variant='outline' className='text-xs'>
                                  Pending
                                </Badge>
                              </div>
                              <p className='text-sm text-gray-500'>{app.email}</p>
                              <p className='mt-2 text-sm text-gray-700'>{app.description}</p>
                              <p className='mt-2 text-xs text-gray-400'>
                                Applied: {formatDate(app.createdAt)}
                              </p>
                            </div>
                            <div className='flex gap-2'>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size='sm'
                                    variant='outline'
                                    className='border-red-200 text-red-600 hover:bg-red-50'
                                    disabled={processingUid === app.uid}
                                  >
                                    {processingUid === app.uid ?
                                      <Loader2 className='h-4 w-4 animate-spin' />
                                    : <X className='h-4 w-4' />}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Reject Application?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will reject the instructor application from {app.name}.
                                      They can reapply in the future.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleReject(app)}
                                      className='bg-red-600 hover:bg-red-700'
                                    >
                                      Reject
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size='sm'
                                    className='bg-green-600 hover:bg-green-700'
                                    disabled={processingUid === app.uid}
                                  >
                                    {processingUid === app.uid ?
                                      <Loader2 className='h-4 w-4 animate-spin' />
                                    : <Check className='h-4 w-4' />}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Approve Application?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will approve {app.name} as an instructor. They will be
                                      able to manage students and review notes.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleApprove(app)}
                                      className='bg-green-600 hover:bg-green-700'
                                    >
                                      Approve
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                }
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value='users'>
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and search all registered users</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className='relative mb-4'>
                  <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
                  <Input
                    placeholder='Search by name or email...'
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className='pl-10'
                  />
                </div>

                {/* Users Table */}
                {isLoadingData ?
                  <div className='space-y-3'>
                    {[1, 2, 3, 4, 5].map(i => (
                      <Skeleton key={i} className='h-12 w-full' />
                    ))}
                  </div>
                : <div className='rounded-md border'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Roles</TableHead>
                          <TableHead>Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length === 0 ?
                          <TableRow>
                            <TableCell colSpan={4} className='py-8 text-center text-gray-500'>
                              No users found
                            </TableCell>
                          </TableRow>
                        : filteredUsers.map(u => (
                            <TableRow key={u.uid}>
                              <TableCell className='font-medium'>{u.name}</TableCell>
                              <TableCell className='text-gray-500'>{u.email}</TableCell>
                              <TableCell>
                                <div className='flex flex-wrap gap-1'>
                                  {u.roles?.administrator && (
                                    <Badge variant='default' className='bg-purple-600 text-xs'>
                                      Admin
                                    </Badge>
                                  )}
                                  {u.isInstructor && (
                                    <Badge variant='default' className='bg-blue-600 text-xs'>
                                      Instructor
                                    </Badge>
                                  )}
                                  {u.roles?.contributor && !u.roles?.administrator && (
                                    <Badge variant='secondary' className='text-xs'>
                                      Contributor
                                    </Badge>
                                  )}
                                  {u.pendingInstructorDescription && (
                                    <Badge variant='outline' className='text-xs text-orange-600'>
                                      Pending
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className='text-gray-500'>
                                {formatDate(u.createdAt)}
                              </TableCell>
                            </TableRow>
                          ))
                        }
                      </TableBody>
                    </Table>
                  </div>
                }

                {/* Results count */}
                {!isLoadingData && (
                  <p className='mt-4 text-sm text-gray-500'>
                    Showing {filteredUsers.length} of {users.length} users
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Stats Card Component
function StatsCard({
  title,
  value,
  icon: Icon,
  loading,
  highlight = false,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? 'border-orange-200 bg-orange-50' : ''}>
      <CardContent className='pt-6'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-gray-500'>{title}</p>
            {loading ?
              <Skeleton className='mt-1 h-8 w-16' />
            : <p
                className={`text-2xl font-bold ${highlight ? 'text-orange-600' : 'text-gray-900'}`}
              >
                {value}
              </p>
            }
          </div>
          <div className={`rounded-full p-3 ${highlight ? 'bg-orange-100' : 'bg-gray-100'}`}>
            <Icon className={`h-5 w-5 ${highlight ? 'text-orange-600' : 'text-gray-600'}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
