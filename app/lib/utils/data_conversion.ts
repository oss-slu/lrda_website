import { Note, ImageNote } from "@/app/types";
import { VideoType, AudioType, PhotoType } from "../models/media_class";

/**
 * Utility class for converting media types in fetched data to the appropriate classes.
 */
export default class DataConversion {
  /**
   * Converts media types in the fetched data to the appropriate classes.
   * @param {any[]} data - The fetched data containing media items.
   * @returns {Note[]} The converted notes, sorted with appropriate media classes.
   */
  static convertMediaTypes(data: any[]): Note[] {
    const fetchedNotes: Note[] = data.map((message: any) => {
      let time = new Date(message.__rerum.createdAt);
      if (message.time === undefined) {
        time = new Date(message.__rerum.createdAt);
        var date = new Date();
        var offsetInHours = date.getTimezoneOffset() / 60;
        time.setHours(time.getHours() - offsetInHours);
      } else {
        time = new Date(message.time);
      }

      const mediaItems = message.media.map((item: any) => {
        if (item.type === "video") {
          return new VideoType({
            uuid: item.uuid,
            type: item.type,
            uri: item.uri,
            thumbnail: item.thumbnail,
            duration: item.duration,
          });
        } else if (item.type === "audio") {
          return new AudioType({
            uuid: item.uuid,
            type: item.type,
            uri: item.uri,
            duration: item.duration,
            name: item.name,
            isPlaying: false,
          });
        } else {
          return new PhotoType({
            uuid: item.uuid,
            type: item.type,
            uri: item.uri,
          });
        }
      });

      const audioItems = message.audio?.map((item: any) => {
        return new AudioType({
          uuid: item.uuid,
          type: item.type,
          uri: item.uri,
          duration: item.duration,
          name: item.name,
          isPlaying: false,
        });
      });

      return {
        id: message["@id"],
        title: message.title || "",
        text: message.BodyText || "",
        time: time || "",
        creator: message.creator || "",
        media: mediaItems || [],
        audio: audioItems || [],
        latitude: message.latitude || "",
        longitude: message.longitude || "",
        published: message.published || false,
        tags: message.tags || [],
        uid: message.uid, // Add the uid property here
        // isArchived: note.isArchived,

      };
    });

    fetchedNotes.sort(
      (b, a) => new Date(b.time).getTime() - new Date(a.time).getTime()
    );

    return fetchedNotes;
  }

  /**
   * Extracts images from the fetched notes and returns an array of ImageNote objects.
   * @param {Note[]} fetchedNotes - The fetched notes containing media items.
   * @returns {ImageNote[]} The extracted images with corresponding note information.
   */
  static extractImages(fetchedNotes: Note[]): ImageNote[] {
    const extractedImages: ImageNote[] = fetchedNotes.flatMap((note) => {
      return note.media.map((item: any) => {
        if (item.type === "video") {
          return {
            image: item.thumbnail,
            note: {
              id: note.id,
              title: note.title || "",
              text: note.text || "",
              media: note.media.map((mediaItem: any) => {
                if (mediaItem.type === "video") {
                  return new VideoType({
                    uuid: mediaItem.uuid,
                    type: mediaItem.type,
                    uri: mediaItem.uri,
                    thumbnail: mediaItem.thumbnail,
                    duration: mediaItem.duration,
                  });
                } else {
                  return new PhotoType({
                    uuid: mediaItem.uuid,
                    type: mediaItem.type,
                    uri: mediaItem.uri,
                  });
                }
              }),
              audio: note.audio || [],
              time: note.time || "",
              creator: note.creator || "",
              latitude: note.latitude,
              longitude: note.longitude,
              published: note?.published || false,
              tags: note?.tags || [],
              uid: note.uid, // Add the uid property here
            },
          };
        } else {
          return {
            image: item.uri,
            note: {
              id: note.id,
              title: note.title || "",
              text: note.text || "",
              media: note.media.map((mediaItem: any) => {
                if (mediaItem.type === "video") {
                  return new VideoType({
                    uuid: mediaItem.uuid,
                    type: mediaItem.type,
                    uri: mediaItem.uri,
                    thumbnail: mediaItem.thumbnail,
                    duration: mediaItem.duration,
                  });
                } else {
                  return new PhotoType({
                    uuid: mediaItem.uuid,
                    type: mediaItem.type,
                    uri: mediaItem.uri,
                  });
                }
              }),
              audio: note.audio || [],
              time: note.time || "",
              creator: note.creator || "",
              latitude: note.latitude,
              longitude: note.longitude,
              published: note?.published || false,
              tags: note?.tags || [],
              uid: note.uid, // Add the uid property here
              //isArchived: note.isArchived
            },
          };
        }
      });
    });

    return extractedImages;
  }
}

export function formatDateTime(date: any) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return 'Pick a date'; // Handle invalid dates
  }

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const ampm = hours < 12 ? 'AM' : 'PM';

  return `${date.toDateString()} ${formattedHours}:${formattedMinutes} ${ampm}`;
}

export function format12hourTime(date: any) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return 'Pick a date'; // Handle invalid dates
  }

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const ampm = hours < 12 ? 'AM' : 'PM';

  return `${formattedHours}:${formattedMinutes} ${ampm}`;
}

