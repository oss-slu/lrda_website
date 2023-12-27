import React, { useState, useEffect } from "react";
import Player from "@madzadev/audio-player";
import "@madzadev/audio-player/dist/index.css";

const fetchCSSVariable = (varName: string) => {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  };

const colors = {
    '--tagsBackground': fetchCSSVariable('--primary'),
    '--tagsText': fetchCSSVariable('--primary-foreground'),
    '--tagsBackgroundHoverActive': fetchCSSVariable('--accent'),
    '--tagsTextHoverActive': fetchCSSVariable('--accent-foreground'),
    '--searchBackground': fetchCSSVariable('--input'),
    '--searchText': fetchCSSVariable('--foreground'),
    '--searchPlaceHolder': fetchCSSVariable('--muted'),
    '--playerBackground': fetchCSSVariable('--card'),
    '--titleColor': fetchCSSVariable('--foreground'),
    '--timeColor': fetchCSSVariable('--foreground'),
    '--progressSlider': fetchCSSVariable('--primary'),
    '--progressUsed': fetchCSSVariable('--primary-foreground'),
    '--progressLeft': fetchCSSVariable('--background'),
    '--volumeSlider': fetchCSSVariable('--secondary'),
    '--volumeUsed': fetchCSSVariable('--secondary-foreground'),
    '--volumeLeft': fetchCSSVariable('--background'),
    '--playlistBackground': fetchCSSVariable('--card'),
    '--playlistText': fetchCSSVariable('--card-foreground'),
    '--playlistBackgroundHoverActive': fetchCSSVariable('--accent'),
    '--playlistTextHoverActive': fetchCSSVariable('--accent-foreground'),
  };

const tracks = [
  {
    url: "https://audioplayer.madza.dev/Madza-Chords_of_Life.mp3",
    title: "Madza - Chords of Life",
    tags: ["house"],
  },
  {
    url: "https://audioplayer.madza.dev/Madza-Late_Night_Drive.mp3",
    title: "Madza - Late Night Drive",
    tags: ["dnb"],
  },
  {
    url: "https://audioplayer.madza.dev/Madza-Persistence.mp3",
    title: "Madza - Persistence",
    tags: ["dubstep"],
  },
];

export default function AudioPicker() {
  return (
    <div>
      <Player trackList={tracks} includeTags={false} includeSearch={false} customColorScheme={colors}/>
    </div>
  );
}
