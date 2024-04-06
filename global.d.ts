export {}; // This line makes the file a module and prevents the types from being globally exposed

declare global {
  interface Window {
    introJs: typeof introJs;
  }
}