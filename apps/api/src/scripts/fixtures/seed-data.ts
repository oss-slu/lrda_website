/**
 * Seed fixture data for local development.
 *
 * All IDs are deterministic so the script is idempotent.
 * Foreign key references are consistent across entities.
 */

import type { Tag } from '../../db/types';

// ============================================
// Users
// ============================================

export const users = [
  {
    id: 'seed-admin-001',
    name: 'Dev Admin',
    email: 'admin@test.lrda.dev',
    emailVerified: true,
    role: 'admin' as const,
    isInstructor: false,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: 'seed-instructor-001',
    name: 'Dr. Sarah Chen',
    email: 'schen@test.lrda.dev',
    emailVerified: true,
    role: 'user' as const,
    isInstructor: true,
    createdAt: new Date('2024-01-15T00:00:00Z'),
    updatedAt: new Date('2024-01-15T00:00:00Z'),
  },
  {
    id: 'seed-student-001',
    name: 'Alice Thompson',
    email: 'athompson@test.lrda.dev',
    emailVerified: true,
    role: 'user' as const,
    isInstructor: false,
    instructorId: 'seed-instructor-001',
    createdAt: new Date('2024-02-01T00:00:00Z'),
    updatedAt: new Date('2024-02-01T00:00:00Z'),
  },
  {
    id: 'seed-student-002',
    name: 'Bob Martinez',
    email: 'bmartinez@test.lrda.dev',
    emailVerified: true,
    role: 'user' as const,
    isInstructor: false,
    instructorId: 'seed-instructor-001',
    createdAt: new Date('2024-02-01T00:00:00Z'),
    updatedAt: new Date('2024-02-01T00:00:00Z'),
  },
  {
    id: 'seed-student-003',
    name: 'Charlie Okafor',
    email: 'cokafor@test.lrda.dev',
    emailVerified: true,
    role: 'user' as const,
    isInstructor: false,
    instructorId: 'seed-instructor-001',
    createdAt: new Date('2024-02-10T00:00:00Z'),
    updatedAt: new Date('2024-02-10T00:00:00Z'),
  },
];

// ============================================
// Notes
// ============================================

export const notes = [
  {
    id: 'seed-note-001',
    title: 'Sunday Service at Grace Cathedral',
    text: 'Observed the Sunday morning service at Grace Cathedral in San Francisco. The congregation was diverse, with approximately 200 attendees. The service included traditional hymns accompanied by a pipe organ, a sermon focused on community outreach, and a communal prayer segment. Several attendees mentioned this parish has been a cornerstone of the neighborhood since the 1920s.',
    creatorId: 'seed-student-001',
    latitude: '37.79120000',
    longitude: '-122.41310000',
    isPublished: true,
    approvalRequested: false,
    tags: [
      { label: 'Christian', origin: 'user' },
      { label: 'worship', origin: 'user' },
      { label: 'community', origin: 'ai' },
    ] as Tag[],
    time: new Date('2024-03-10T10:30:00Z'),
    createdAt: new Date('2024-03-10T12:00:00Z'),
    updatedAt: new Date('2024-03-10T12:00:00Z'),
  },
  {
    id: 'seed-note-002',
    title: 'Ramadan Iftar at Islamic Cultural Center',
    text: 'Attended the iftar meal at the Islamic Cultural Center of New York. The event brought together over 300 people from various backgrounds. The meal began with the breaking of the fast at sunset, followed by the Maghrib prayer. Community members shared personal stories about the significance of Ramadan in their daily lives. The center also provided meals for those in need through a food distribution program.',
    creatorId: 'seed-student-002',
    latitude: '40.77190000',
    longitude: '-73.95760000',
    isPublished: true,
    approvalRequested: false,
    tags: [
      { label: 'Islam', origin: 'user' },
      { label: 'Ramadan', origin: 'user' },
      { label: 'food', origin: 'ai' },
      { label: 'community', origin: 'ai' },
    ] as Tag[],
    time: new Date('2024-03-15T18:45:00Z'),
    createdAt: new Date('2024-03-15T20:00:00Z'),
    updatedAt: new Date('2024-03-15T20:00:00Z'),
  },
  {
    id: 'seed-note-003',
    title: 'Buddhist Meditation Session in Lincoln Park',
    text: 'Participated in an outdoor meditation session organized by a local Buddhist group in Lincoln Park, Chicago. About 25 people gathered on a Saturday morning. The session was led by a lay practitioner who guided the group through mindfulness breathing and walking meditation along the lakefront path. Several participants noted that practicing outdoors deepened their sense of connection to the natural world.',
    creatorId: 'seed-student-001',
    latitude: '41.92170000',
    longitude: '-87.63450000',
    isPublished: true,
    approvalRequested: false,
    tags: [
      { label: 'Buddhism', origin: 'user' },
      { label: 'meditation', origin: 'user' },
      { label: 'nature', origin: 'ai' },
    ] as Tag[],
    time: new Date('2024-03-20T09:00:00Z'),
    createdAt: new Date('2024-03-20T11:00:00Z'),
    updatedAt: new Date('2024-03-20T11:00:00Z'),
  },
  {
    id: 'seed-note-004',
    title: 'Hanukkah Celebration at Community Center',
    text: 'Documented the public Hanukkah celebration at the Jewish Community Center on the Upper West Side. A large menorah was lit in the courtyard while families gathered to sing traditional songs. Children played dreidel games and latkes were served. Organizers explained the historical significance of the holiday and its themes of perseverance and religious freedom.',
    creatorId: 'seed-student-003',
    latitude: '40.78480000',
    longitude: '-73.97810000',
    isPublished: false,
    approvalRequested: true,
    tags: [
      { label: 'Judaism', origin: 'user' },
      { label: 'festival', origin: 'user' },
      { label: 'family', origin: 'ai' },
    ] as Tag[],
    time: new Date('2024-12-10T17:00:00Z'),
    createdAt: new Date('2024-12-10T19:00:00Z'),
    updatedAt: new Date('2024-12-10T19:00:00Z'),
  },
  {
    id: 'seed-note-005',
    title: 'Gospel Choir Rehearsal',
    text: 'Attended a gospel choir rehearsal at a Baptist church in the South Side of Chicago. The choir of about 40 members rehearsed for an upcoming regional competition. The director emphasized the spiritual dimension of the music, asking singers to connect emotionally with each piece. Between songs, several choir members shared how music serves as a form of prayer and emotional expression in their faith.',
    creatorId: 'seed-student-002',
    latitude: '41.74870000',
    longitude: '-87.61560000',
    isPublished: true,
    approvalRequested: false,
    tags: [
      { label: 'Christian', origin: 'user' },
      { label: 'music', origin: 'user' },
      { label: 'performance', origin: 'ai' },
    ] as Tag[],
    time: new Date('2024-04-05T19:00:00Z'),
    createdAt: new Date('2024-04-05T21:00:00Z'),
    updatedAt: new Date('2024-04-05T21:00:00Z'),
  },
  {
    id: 'seed-note-006',
    title: 'Hindu Temple Architecture Study',
    text: 'Visited the Hindu Temple Society of North America in Flushing, Queens. The temple is one of the oldest Hindu temples in the United States, built in the South Indian style with an ornate gopuram (entrance tower). I documented the carved stone figures depicting various deities, the layout of the inner sanctum, and the rituals being performed during the afternoon puja. The priest explained the symbolism of the architectural elements.',
    creatorId: 'seed-student-003',
    latitude: '40.75580000',
    longitude: '-73.83000000',
    isPublished: true,
    approvalRequested: false,
    tags: [
      { label: 'Hinduism', origin: 'user' },
      { label: 'architecture', origin: 'user' },
      { label: 'ritual', origin: 'ai' },
    ] as Tag[],
    time: new Date('2024-04-12T14:00:00Z'),
    createdAt: new Date('2024-04-12T16:00:00Z'),
    updatedAt: new Date('2024-04-12T16:00:00Z'),
  },
  {
    id: 'seed-note-007',
    title: 'Interfaith Dialogue Event',
    text: 'Observed an interfaith dialogue session at a university campus in Chicago. Representatives from Christian, Muslim, Jewish, and Buddhist communities participated in a panel discussion on the role of faith in addressing social justice issues. The conversation covered homelessness, food insecurity, and environmental stewardship. Audience questions revealed both common ground and theological differences in how each tradition approaches these topics.',
    creatorId: 'seed-student-001',
    latitude: '41.78930000',
    longitude: '-87.59990000',
    isPublished: false,
    approvalRequested: false,
    tags: [
      { label: 'interfaith', origin: 'user' },
      { label: 'social justice', origin: 'user' },
      { label: 'dialogue', origin: 'ai' },
    ] as Tag[],
    time: new Date('2024-04-20T18:00:00Z'),
    createdAt: new Date('2024-04-20T20:00:00Z'),
    updatedAt: new Date('2024-04-20T20:00:00Z'),
  },
  {
    id: 'seed-note-008',
    title: 'Street Corner Prayer Group',
    text: 'Encountered a small prayer group of about 10 people gathered on a street corner in downtown San Francisco near Union Square. The group met for a weekly lunchtime prayer session, drawing participants from nearby offices. The informal setting attracted curious onlookers. One participant explained that the group formed organically when coworkers discovered they shared a desire for midday spiritual practice regardless of denomination.',
    creatorId: 'seed-student-002',
    latitude: '37.78790000',
    longitude: '-122.40740000',
    isPublished: true,
    approvalRequested: false,
    tags: [
      { label: 'prayer', origin: 'user' },
      { label: 'public space', origin: 'user' },
      { label: 'urban', origin: 'ai' },
    ] as Tag[],
    time: new Date('2024-05-01T12:15:00Z'),
    createdAt: new Date('2024-05-01T13:00:00Z'),
    updatedAt: new Date('2024-05-01T13:00:00Z'),
  },
];

// ============================================
// Media
// ============================================

export const media = [
  {
    id: 'seed-media-001',
    noteId: 'seed-note-001',
    type: 'image',
    uri: 'https://picsum.photos/seed/grace-cathedral/800/600',
    thumbnailUri: 'https://picsum.photos/seed/grace-cathedral/200/150',
  },
  {
    id: 'seed-media-002',
    noteId: 'seed-note-001',
    type: 'image',
    uri: 'https://picsum.photos/seed/church-interior/800/600',
    thumbnailUri: 'https://picsum.photos/seed/church-interior/200/150',
  },
  {
    id: 'seed-media-003',
    noteId: 'seed-note-002',
    type: 'image',
    uri: 'https://picsum.photos/seed/iftar-dinner/800/600',
    thumbnailUri: 'https://picsum.photos/seed/iftar-dinner/200/150',
  },
  {
    id: 'seed-media-004',
    noteId: 'seed-note-003',
    type: 'image',
    uri: 'https://picsum.photos/seed/lincoln-park-lake/800/600',
    thumbnailUri: 'https://picsum.photos/seed/lincoln-park-lake/200/150',
  },
  {
    id: 'seed-media-005',
    noteId: 'seed-note-004',
    type: 'image',
    uri: 'https://picsum.photos/seed/menorah-lighting/800/600',
    thumbnailUri: 'https://picsum.photos/seed/menorah-lighting/200/150',
  },
  {
    id: 'seed-media-006',
    noteId: 'seed-note-005',
    type: 'image',
    uri: 'https://picsum.photos/seed/gospel-choir/800/600',
    thumbnailUri: 'https://picsum.photos/seed/gospel-choir/200/150',
  },
  {
    id: 'seed-media-007',
    noteId: 'seed-note-006',
    type: 'image',
    uri: 'https://picsum.photos/seed/hindu-temple/800/600',
    thumbnailUri: 'https://picsum.photos/seed/hindu-temple/200/150',
  },
  {
    id: 'seed-media-008',
    noteId: 'seed-note-006',
    type: 'image',
    uri: 'https://picsum.photos/seed/temple-carvings/800/600',
    thumbnailUri: 'https://picsum.photos/seed/temple-carvings/200/150',
  },
  {
    id: 'seed-media-009',
    noteId: 'seed-note-008',
    type: 'image',
    uri: 'https://picsum.photos/seed/street-prayer/800/600',
    thumbnailUri: 'https://picsum.photos/seed/street-prayer/200/150',
  },
];

// ============================================
// Audio
// ============================================

export const audio = [
  {
    id: 'seed-audio-001',
    noteId: 'seed-note-005',
    uri: 'https://placehold.co/1x1?text=Gospel+Choir+Rehearsal.mp3',
    name: 'Gospel Choir Rehearsal Recording',
    duration: '3:42',
  },
  {
    id: 'seed-audio-002',
    noteId: 'seed-note-007',
    uri: 'https://placehold.co/1x1?text=Interfaith+Panel.mp3',
    name: 'Interfaith Panel Discussion Excerpt',
    duration: '12:05',
  },
];

// ============================================
// Comments
// ============================================

const THREAD_A = 'seed-thread-001';
const THREAD_B = 'seed-thread-002';

export const comments = [
  // Thread A: instructor feedback on note-001 (resolved)
  {
    id: 'seed-comment-001',
    noteId: 'seed-note-001',
    authorId: 'seed-instructor-001',
    authorName: 'Dr. Sarah Chen',
    text: 'Good observation about congregation diversity. Can you elaborate on the age demographics you noticed?',
    position: { from: 48, to: 113 },
    threadId: THREAD_A,
    parentId: null,
    isResolved: true,
    createdAt: new Date('2024-03-11T09:00:00Z'),
    updatedAt: new Date('2024-03-11T09:00:00Z'),
  },
  {
    id: 'seed-comment-002',
    noteId: 'seed-note-001',
    authorId: 'seed-student-001',
    authorName: 'Alice Thompson',
    text: 'The congregation skewed older, roughly 60% over 50. There were a few young families with children but most attendees were middle-aged or senior.',
    position: null,
    threadId: THREAD_A,
    parentId: 'seed-comment-001',
    isResolved: true,
    createdAt: new Date('2024-03-11T14:30:00Z'),
    updatedAt: new Date('2024-03-11T14:30:00Z'),
  },

  // Thread B: peer feedback on note-002
  {
    id: 'seed-comment-003',
    noteId: 'seed-note-002',
    authorId: 'seed-student-001',
    authorName: 'Alice Thompson',
    text: 'Really interesting to hear about the food distribution program. Did you learn how long they have been running it?',
    position: null,
    threadId: THREAD_B,
    parentId: null,
    isResolved: false,
    createdAt: new Date('2024-03-16T10:00:00Z'),
    updatedAt: new Date('2024-03-16T10:00:00Z'),
  },
  {
    id: 'seed-comment-004',
    noteId: 'seed-note-002',
    authorId: 'seed-student-002',
    authorName: 'Bob Martinez',
    text: 'They said it started about five years ago and has expanded each year. They now serve around 200 meals per week during Ramadan.',
    position: null,
    threadId: THREAD_B,
    parentId: 'seed-comment-003',
    isResolved: false,
    createdAt: new Date('2024-03-16T11:15:00Z'),
    updatedAt: new Date('2024-03-16T11:15:00Z'),
  },

  // Standalone instructor comment on note-003
  {
    id: 'seed-comment-005',
    noteId: 'seed-note-003',
    authorId: 'seed-instructor-001',
    authorName: 'Dr. Sarah Chen',
    text: 'Consider comparing this outdoor practice with the indoor meditation centers you visited earlier. How does the setting shape the experience?',
    position: { from: 0, to: 80 },
    threadId: null,
    parentId: null,
    isResolved: false,
    createdAt: new Date('2024-03-21T08:00:00Z'),
    updatedAt: new Date('2024-03-21T08:00:00Z'),
  },

  // Comment on note-006
  {
    id: 'seed-comment-006',
    noteId: 'seed-note-006',
    authorId: 'seed-student-001',
    authorName: 'Alice Thompson',
    text: 'The architectural details you described are fascinating. Do you have photos of the carved figures on the gopuram?',
    position: null,
    threadId: null,
    parentId: null,
    isResolved: false,
    createdAt: new Date('2024-04-13T09:30:00Z'),
    updatedAt: new Date('2024-04-13T09:30:00Z'),
  },

  // Comment on note-004 (unpublished)
  {
    id: 'seed-comment-007',
    noteId: 'seed-note-004',
    authorId: 'seed-instructor-001',
    authorName: 'Dr. Sarah Chen',
    text: 'This is a strong entry. I would suggest expanding the section on the historical significance before publishing.',
    position: null,
    threadId: null,
    parentId: null,
    isResolved: false,
    createdAt: new Date('2024-12-11T10:00:00Z'),
    updatedAt: new Date('2024-12-11T10:00:00Z'),
  },
];
