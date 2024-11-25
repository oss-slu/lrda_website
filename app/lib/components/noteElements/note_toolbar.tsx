'use client'
import React from 'react';
import { Calendar, MapPin, Music } from 'lucide-react';

const NoteToolbar = () => {
    return (
      <div className="bg-white p-2 rounded shadow"> {/* Added 'shadow' for consistency if needed */}
        <div className="flex items-center justify-around"> {/* Removed styling here and applied to parent */}
          <span title="Calendar">
            <Calendar className="cursor-pointer text-gray-600 hover:text-gray-800" />
          </span>
          <span title="Location">
            <MapPin className="cursor-pointer text-gray-600 hover:text-gray-800" />
          </span>
          <span title="Music"> {/* moving this icon to... */}
            <Music className="cursor-pointer text-gray-600 hover:text-gray-800" />
          </span>
        </div>
      </div>
    );
  };

export default NoteToolbar;