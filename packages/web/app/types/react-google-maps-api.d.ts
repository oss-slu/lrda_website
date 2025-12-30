import * as React from "react";

declare module "@react-google-maps/api" {
  export interface AutocompleteProps {
    onLoad?: (autocomplete: google.maps.places.Autocomplete) => void;
    onPlaceChanged?: () => void;
    onUnmount?: (autocomplete: google.maps.places.Autocomplete) => void;
    options?: google.maps.places.AutocompleteOptions;
    className?: string;
    children?: React.ReactNode;
  }

  export const Autocomplete: React.FC<AutocompleteProps>;

  // Re-export other components that work fine
  export * from "@react-google-maps/api";
}
