import { render, screen, fireEvent } from '@testing-library/react';
import AudioPicker from '../lib/components/noteElements/audio_component';
import { AudioType } from '../lib/models/media_class';

describe('AudioPicker', () => {
  const audioArray = [
    new AudioType({ uuid: 'uuid1', type: 'audio', uri: 'audio1.mp3', name: 'Audio 1', duration: '1:00', isPlaying: false }),
    new AudioType({ uuid: 'uuid2', type: 'audio',  uri: 'audio2.mp3', name: 'Audio 2', duration: '2:00', isPlaying: false }),
  ];
  const setAudio = jest.fn();

  it('renders without crashing', () => {
    render(<AudioPicker audioArray={audioArray} />);
    expect(screen.getByTestId('audio-player')).toBeInTheDocument();
  });

  // it('renders the correct number of audio options', () => {
  //   render(<AudioPicker audioArray={audioArray} setAudio={setAudio} />);
  //   const options = screen.getAllByTestId('audio-option');
  //   expect(options).toHaveLength(audioArray.length);
  // });

  // it('displays the correct audio names', () => {
  //   render(<AudioPicker audioArray={audioArray} setAudio={setAudio} />);
  //   audioArray.forEach(audio => {
  //     expect(screen.getByText(audio.name)).toBeInTheDocument();
  //   });
  // });

  // it('passes the correct src to the audio player', () => {
  //   render(<AudioPicker audioArray={audioArray} setAudio={setAudio} />);
  //   const select = screen.getByTestId('audio-select');
  //   fireEvent.change(select, { target: { value: audioArray[0].uri } });
  //   const audioPlayer = screen.getByTestId('audio-player');
  //   expect(audioPlayer).toHaveAttribute('src', audioArray[0].uri);
  // });
});
