import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";

import { VideoType, PhotoType, Media } from "../models/media_class";
import Image from "next/image";
import ReactPlayer from "react-player";

export default function MediaViewer({ mediaArray }: { mediaArray: Media[] }) {
  return (
    <Carousel className="w-full h-auto flex items-center justify-center">
      <CarouselContent>
        {mediaArray.map((media, index) => (
          <CarouselItem
            key={index}
            className="flex justify-center items-center h-full self-center"
          >
            {media.type === "image" && (
              <img
                src={media.uri}
                className="max-w-full max-h-full self-center"
                alt="Media content"
              />
            )}
            {media.type === "video" && (
              <ReactPlayer
                url={media.uri}
                controls={true}
                width="100%"
                height="100%"
                className="self-center"
              />
            )}
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
