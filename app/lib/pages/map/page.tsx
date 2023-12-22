"use client";
import React from "react";
import { useState } from "react";
import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import SearchBar from "../../components/search_bar";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

const mapAPIKey = process.env.NEXT_PUBLIC_MAP_KEY || "";

const Page = () => {
  const longitude = -90.286021;
  const latitude = 38.637334;

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: mapAPIKey,
  });

  const RowTemp: React.FC<{num: number}> = ({ num }) => {
    return (
      <div className="flex flex-row w-[95%] justify-between">
        <div className="bg-popover w-[48%] h-72 mt-3 rounded-md shadow-md flex items-center justify-center text-2xl font-bold">
          Note #{num}
        </div>
        <div className="bg-popover w-[48%] h-72 mt-3 rounded-md shadow-md flex items-center justify-center text-2xl font-bold">
          Note #{num + 1}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-row w-screen h-[90vh] bg-background">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel className="min-w-[300px] max-w-[70vw]">
          <>
            <div className="flex flex-row h-[10%] bg-secondary items-center pl-5 pr-5">
              <SearchBar />
              <div className="ml-10">
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Event Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Event Filter</SelectLabel>
                      <SelectItem value="Religious">Religious</SelectItem>
                      <SelectItem value="Cultural">Cultural</SelectItem>
                      <SelectItem value="Sporting">Sporting</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {isLoaded && (
              <GoogleMap
                mapContainerStyle={{
                  width: "100%",
                  height: "90%",
                }}
                center={{ lat: latitude, lng: longitude }}
                zoom={10}
                options={{
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: false,
                }}
              />
            )}
          </>
        </ResizablePanel>
        <ResizableHandle withHandle/>
        <ResizablePanel className="min-w-[400px] max-w-[70vw]">
          <ScrollArea className="flex flex-col w-[100%] h-[90vh] bg-popover shadow-2xl items-center justify-center align-right">
            <div className="flex flex-col w-[100%] items-center justify-center pb-3">
              <RowTemp num={1} />
              <RowTemp num={3} />
              <RowTemp num={5} />
              <RowTemp num={7} />
              <RowTemp num={9} />
              <RowTemp num={11} />
              <RowTemp num={13} />
            </div>
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Page;
