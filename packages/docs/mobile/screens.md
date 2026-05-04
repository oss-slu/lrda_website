# Mobile Screens

A reference of all screens in the mobile app, organized by navigation context.

## Authentication Screens

| Screen | File | Description |
| --- | --- | --- |
| Onboarding | `OnboardingScreen.tsx` | First-time user tutorial swiper |
| Login | `loginScreens/LoginScreen.tsx` | Email/password login |
| Register | `loginScreens/RegisterScreen.tsx` | Account creation |
| Forgot Password | `loginScreens/ForgotPassword.tsx` | Password reset via email |

## Home Tab (Stack)

| Screen | File | Description |
| --- | --- | --- |
| Home | `HomeScreen.tsx` | User's own notes in a swipeable list |
| Add Note | `AddNoteScreen.tsx` | Rich text editor with title, media picker, tags, location |
| Edit Note | `EditNoteScreen.tsx` | Edit wrapper that routes to AddNote with existing note data |
| Video Player | `VideoPlayer.tsx` | Full-screen video playback |
| Profile | `ProfilePage.tsx` | User account info and logout |

## Library Tab

| Screen | File | Description |
| --- | --- | --- |
| Library | `Library.tsx` | Paginated list of all published notes from all users |

## Add Note Tab

The center tab uses a custom floating action button (`AddNoteBtnComponent`) instead of a standard tab button. Tapping it navigates to `AddNoteScreen` within the Home stack.

## Map Tab

| Screen | File | Description |
| --- | --- | --- |
| Explore | `mapPage/ExploreScreen.js` | Google Maps with note markers and clustering |

**Modals within Explore:**

| Modal | File | Description |
| --- | --- | --- |
| Note Detail | `mapPage/NoteDetailModal.tsx` | Note preview when tapping a marker |
| Image Viewer | `mapPage/ImageModal.tsx` | Full-screen image viewer |
| Video Viewer | `mapPage/VideoModal.tsx` | Full-screen video player |

## More Tab (Stack)

| Screen | File | Description |
| --- | --- | --- |
| More | `MorePage.tsx` | Settings menu with links to sub-pages |
| About | `AboutScreen.tsx` | App description and version info |
| Team | `TeamPage.tsx` | Team members list |
| Resources | `ResourceScreen.tsx` | External research resources |
| Read More | `ReadMoreScreen.tsx` | Additional project info |
| Theme | `AppThemeSelectorScreen.tsx` | Color palette picker and dark mode toggle |

## Standalone Screens

| Screen | File | Description |
| --- | --- | --- |
| Audio Player | `AudioPlayerScreen.tsx` | Audio recording playback controls |

## Key Components

These reusable components appear across multiple screens:

| Component | File | Purpose |
| --- | --- | --- |
| NotesComponent | `components/NotesComponent.tsx` | Note card display |
| MapNotesComponent | `components/MapNotesComponent.tsx` | Note cards for map view |
| PhotoScroller | `components/photoScroller.tsx` | Horizontal media carousel |
| Audio | `components/audio.tsx` | Audio recording and playback |
| Location | `components/location.tsx` | Location picker |
| Tagging | `components/tagging.tsx` | Tag input |
| ThemeProvider | `components/ThemeProvider.js` | Theme context and dark mode |
