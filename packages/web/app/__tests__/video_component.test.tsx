import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VideoComponent from '../lib/components/NoteEditor/NoteElements/VideoPicker';
import * as apiService from '../lib/utils/api_service';
import { toast } from 'sonner';

describe('VideoComponent', () => {
  const file = new File(['video'], 'video.mp4', { type: 'video/mp4' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const setVideo = jest.fn();
    render(<VideoComponent videoArray={[]} setVideo={setVideo} />);
  });
});
