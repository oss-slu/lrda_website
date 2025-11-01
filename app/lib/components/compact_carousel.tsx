import React, { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { type CarouselApi } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";

import { VideoType, PhotoType, Media } from "../models/media_class";
import Image from "next/image";
import ReactPlayer from "react-player";

export default function CompactCarousel({
  mediaArray,
}: {
  mediaArray: Media[];
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);
  const [isHovered, setIsHovered] = useState(false); // State to track hover

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      console.log("current");
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);
  const handleRightClick = (event: React.MouseEvent) => {
    api?.scrollNext();
    event.stopPropagation();
  };
  const handleLeftClick = (event: React.MouseEvent) => {
    api?.scrollPrev();
    event.stopPropagation();
  };
  return (
    <Carousel
      setApi={setApi}
      className="w-full h-auto flex items-center justify-center"
      onMouseEnter={()=>setIsHovered(true)}
      onMouseLeave={()=>setIsHovered(false)}
    >
      <CarouselContent>
        {mediaArray.map((media, index) => (
          <CarouselItem
            key={index}
            className="flex justify-center items-center h-full self-center"
          >
            {media.type === "image" && (
              <Image
              src={media.uri}
              width={256}
              height={180}
              objectFit="cover"
              className="rounded-t-lg h-[140px] sm:h-[180px] w-full max-w-[256px]"
              alt="Media content"
              quality={5}
            />
            )}
            {media.type === "video" && (
              <ReactPlayer
                src={media.uri}
                controls={true}
                width="100%"
                height="140px"
                className="self-center object-cover bg-black rounded-t-lg"
              />
            )}
            
          </CarouselItem>
        ))}
      </CarouselContent>
      {(count > 1) && (isHovered) && (
              <div className="absolute bottom-1 flex flex-row rounded items-center justify-center p-1 h-5 w-20 bg-[rgb(255,255,255,0.7)]">
                <span className="text-sm font-semibold">
                  {current} of {count}
                </span>
              </div>
            )}
      {(mediaArray.length > 1) && (current > 1) && isHovered && (
        <CarouselPrevious
        className="absolute left-0 hover:z-50 bg-[rgb(255,255,255,0.5)]"
        onClick={handleLeftClick}
      />
      )}
      {(mediaArray.length > 1) && (current < count) && isHovered && (
        <CarouselNext
          className="absolute right-0 hover:z-50 bg-[rgb(255,255,255,0.5)]"
          onClick={handleRightClick}
        />
      )}
    </Carousel>
  );
}
