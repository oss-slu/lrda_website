import moxios from 'moxios';
import { AudioType, VideoType, PhotoType } from '../lib/models/media_class'; // Update the path accordingly

describe('Media Classes', () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  describe('AudioType', () => {
    it('simulates data for an audio', done => {
      const testData = {
        uuid: 'sample-uuid',
        uri: 'http://fake-url.com/audio.mp3',
        duration: '3:30',
        name: 'Sample Audio',
        isPlaying: false,
      };
      const audioInstance = new AudioType(testData);

      moxios.stubRequest(`/fake-api/audio/${testData.uuid}`, {
        status: 200,
        response: testData,
      });

      // Here's a fake fetch method, simulate the behavior
      const fakeFetch = () => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(testData);
          }, 1000);
        });
      };

      fakeFetch().then(response => {
        expect(response).toEqual(testData);
        done();
      });
    });
  });

  describe('VideoType', () => {
    it('simulates data for a video', done => {
      const testData = {
        uuid: 'sample-uuid',
        uri: 'http://fake-url.com/video.mp4',
        thumbnail: 'http://fake-url.com/thumbnail.jpg',
        duration: '10:30',
      };
      const videoInstance = new VideoType(testData);

      moxios.stubRequest(`/fake-api/video/${testData.uuid}`, {
        status: 200,
        response: testData,
      });

      const fakeFetch = () => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(testData);
          }, 1000);
        });
      };

      fakeFetch().then(response => {
        expect(response).toEqual(testData);
        done();
      });
    });
  });

  describe('PhotoType', () => {
    it('simulates data for a photo', done => {
      const testData = {
        uuid: 'sample-uuid',
        uri: 'http://fake-url.com/photo.jpg',
      };
      const photoInstance = new PhotoType(testData);

      moxios.stubRequest(`/fake-api/photo/${testData.uuid}`, {
        status: 200,
        response: testData,
      });

      const fakeFetch = () => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(testData);
          }, 1000);
        });
      };

      fakeFetch().then(response => {
        expect(response).toEqual(testData);
        done();
      });
    });
  });
});
