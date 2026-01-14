import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

import { Media } from '../models/media_class';
import ReactPlayer from 'react-player';

export default function MediaViewer({ mediaArray }: { mediaArray: Media[] }) {
  return (
    <Carousel className='flex h-auto w-full items-center justify-center'>
      <CarouselContent>
        {mediaArray.map((media, index) => (
          <CarouselItem key={index} className='flex h-full items-center justify-center self-center'>
            {/* Render Image */}
            {media.type === 'image' && (
              <img
                src={media.uri}
                className='max-h-full max-w-full self-center'
                alt='Media content'
              />
            )}

            {/* Render Video */}
            {media.type === 'video' && (
              <ReactPlayer
                {...({
                  url: media.uri,
                  controls: true,
                  width: '100%',
                  height: '100%',
                  className: 'self-center',
                } as any)}
              />
            )}

            {/* Render Audio */}
            {media.type === 'audio' && (
              <audio controls src={media.uri} className='w-full self-center'>
                Your browser does not support the audio element.
              </audio>
            )}
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
