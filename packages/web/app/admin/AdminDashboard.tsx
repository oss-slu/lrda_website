import { useState, useCallback, useMemo } from 'react';
import {
  fetchAllUsers,
  fetchPendingApplications,
  getAdminStats,
  approveApplication,
  rejectApplication,
  setUserRole,
  banUser,
  unbanUser,
  removeUser,
} from '@/app/lib/services';
import type { AdminUserData, PendingApplication, AdminStats } from '@/app/lib/services';
import { isAdminUser, isInstructorUser } from '@/app/lib/stores/authHelpers';
import { toast } from 'sonner';
import { formatDateShort } from '@/app/lib/utils/data_conversion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsCard } from './StatsCard';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  Shield,
  ShieldOff,
  GraduationCap,
  UserCheck,
  ClipboardList,
  Search,
  Check,
  X,
  Loader2,
  RefreshCw,
  MoreHorizontal,
  Ban,
  UserX,
  ShieldCheck,
} from 'lucide-react';

interface AdminDashboardProps {
  initialStats: AdminStats | null;
  initialUsers: AdminUserData[];
  initialApplications: PendingApplication[];
}

export default function AdminDashboard({
  initialStats,
  initialUsers,
  initialApplications,
}: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats | null>(initialStats);
  const [users, setUsers] = useState<AdminUserData[]>(initialUsers);
  const [applications, setApplications] = useState<PendingApplication[]>(initialApplications);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [statsData, usersData, applicationsData] = await Promise.all([
        getAdminStats(),
        fetchAllUsers(),
        fetchPendingApplications(),
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
  }, []);

  const filteredUsers = useMemo(
    () =>
      users.filter(
        u =>
          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [users, searchQuery],
  );

  const handleApprove = async (application: PendingApplication) => {
    setProcessingId(application.id);
    try {
      await approveApplication(application.id);
      toast.success(`Approved ${application.name} as instructor`);
      await fetchData();
    } catch (error) {
      console.error('Error approving application:', error);
      toast.error('Failed to approve application');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (application: PendingApplication) => {
    setProcessingId(application.id);
    try {
      await rejectApplication(application.id, 'Rejected by admin');
      toast.success(`Rejected application from ${application.name}`);
      await fetchData();
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast.error('Failed to reject application');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSetRole = async (user: AdminUserData, role: 'admin' | 'user') => {
    setProcessingId(user.id);
    try {
      await setUserRole(user.id, role);
      toast.success(`Set ${user.name} role to ${role}`);
      await fetchData();
    } catch (error) {
      console.error('Error setting role:', error);
      toast.error('Failed to update role');
    } finally {
      setProcessingId(null);
    }
  };

  const handleBan = async (user: AdminUserData) => {
    setProcessingId(user.id);
    try {
      await banUser(user.id);
      toast.success(`Banned ${user.name}`);
      await fetchData();
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Failed to ban user');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUnban = async (user: AdminUserData) => {
    setProcessingId(user.id);
    try {
      await unbanUser(user.id);
      toast.success(`Unbanned ${user.name}`);
      await fetchData();
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast.error('Failed to unban user');
    } finally {
      setProcessingId(null);
    }
  };

  const [userToRemove, setUserToRemove] = useState<AdminUserData | null>(null);

  const handleRemove = async () => {
    if (!userToRemove) return;
    setProcessingId(userToRemove.id);
    try {
      await removeUser(userToRemove.id);
      toast.success(`Removed ${userToRemove.name}`);
      setUserToRemove(null);
      await fetchData();
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error('Failed to remove user');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = formatDateShort;

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
                      <Card key={app.id} className='border-l-4 border-l-blue-500'>
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
                                    disabled={processingId === app.id}
                                  >
                                    {processingId === app.id ?
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
                                    disabled={processingId === app.id}
                                  >
                                    {processingId === app.id ?
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
                  <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400' />
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
                          <TableHead className='w-12'>
                            <span className='sr-only'>Actions</span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length === 0 ?
                          <TableRow>
                            <TableCell colSpan={5} className='py-8 text-center text-gray-500'>
                              No users found
                            </TableCell>
                          </TableRow>
                        : filteredUsers.map(u => (
                            <TableRow key={u.id} className={u.banned ? 'opacity-60' : ''}>
                              <TableCell className='font-medium'>{u.name}</TableCell>
                              <TableCell className='text-gray-500'>{u.email}</TableCell>
                              <TableCell>
                                <div className='flex flex-wrap gap-1'>
                                  {isAdminUser(u) && (
                                    <Badge variant='default' className='bg-purple-600 text-xs'>
                                      Admin
                                    </Badge>
                                  )}
                                  {isInstructorUser(u) && (
                                    <Badge variant='default' className='bg-blue-600 text-xs'>
                                      Instructor
                                    </Badge>
                                  )}
                                  {!isAdminUser(u) && !isInstructorUser(u) && (
                                    <Badge variant='secondary' className='text-xs'>
                                      User
                                    </Badge>
                                  )}
                                  {u.banned && (
                                    <Badge variant='destructive' className='text-xs'>
                                      Banned
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
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant='ghost'
                                      size='sm'
                                      className='h-8 w-8 p-0'
                                      disabled={processingId === u.id}
                                    >
                                      {processingId === u.id ?
                                        <Loader2 className='h-4 w-4 animate-spin' />
                                      : <MoreHorizontal className='h-4 w-4' />}
                                      <span className='sr-only'>Open menu</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align='end'>
                                    {isAdminUser(u) ?
                                      <DropdownMenuItem onClick={() => handleSetRole(u, 'user')}>
                                        <ShieldOff className='mr-2 h-4 w-4' />
                                        Remove admin
                                      </DropdownMenuItem>
                                    : <DropdownMenuItem onClick={() => handleSetRole(u, 'admin')}>
                                        <ShieldCheck className='mr-2 h-4 w-4' />
                                        Make admin
                                      </DropdownMenuItem>
                                    }
                                    <DropdownMenuSeparator />
                                    {u.banned ?
                                      <DropdownMenuItem onClick={() => handleUnban(u)}>
                                        <UserCheck className='mr-2 h-4 w-4' />
                                        Unban user
                                      </DropdownMenuItem>
                                    : <DropdownMenuItem
                                        onClick={() => handleBan(u)}
                                        className='text-orange-600 focus:text-orange-600'
                                      >
                                        <Ban className='mr-2 h-4 w-4' />
                                        Ban user
                                      </DropdownMenuItem>
                                    }
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => setUserToRemove(u)}
                                      className='text-red-600 focus:text-red-600'
                                    >
                                      <UserX className='mr-2 h-4 w-4' />
                                      Remove user
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
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

        {/* Remove user confirmation dialog */}
        <AlertDialog open={!!userToRemove} onOpenChange={open => !open && setUserToRemove(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove User?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {userToRemove?.name} ({userToRemove?.email}) and all
                their data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRemove} className='bg-red-600 hover:bg-red-700'>
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
