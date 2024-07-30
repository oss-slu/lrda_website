import fetchMock from 'jest-fetch-mock';
import ApiService from '../lib/utils/api_service'; // Adjust the path to your ApiService file

describe('ApiService.generateTags', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('should return a list of tags based on the note content', async () => {
    // Arrange
    const fakeResponse = {
      choices: [
        {
          message: {
            content: 'tag1, tag2, tag3, tag4, tag5'
          }
        }
      ]
    };

    fetchMock.mockResponseOnce(JSON.stringify(fakeResponse));

    const noteContent = 'This is a test note content';

    // Act
    const tags = await ApiService.generateTags(noteContent);

    // Assert
    expect(tags).toEqual(['tag1', 'tag2', 'tag3', 'tag4', 'tag5']);
  });

  it('should throw an error when the API call fails', async () => {
    // Arrange
    fetchMock.mockRejectOnce(new Error('Internal Server Error'));

    const noteContent = 'This is a test note content';

    // Act & Assert
    await expect(ApiService.generateTags(noteContent)).rejects.toThrow('Failed to generate tags');
  });

  it('should return an empty array when note content is empty', async () => {
    // Arrange
    const fakeResponse = {
      choices: [
        {
          message: {
            content: ''
          }
        }
      ]
    };

    fetchMock.mockResponseOnce(JSON.stringify(fakeResponse));

    const noteContent = '';

    // Act
    const tags = await ApiService.generateTags(noteContent);

    // Assert
    expect(tags).toEqual([]);
  });

  it('should throw an error for invalid response structure', async () => {
    // Arrange
    const fakeResponse = {
      invalidStructure: true
    };

    fetchMock.mockResponseOnce(JSON.stringify(fakeResponse));

    const noteContent = 'This is a test note content';

    // Act & Assert
    await expect(ApiService.generateTags(noteContent)).rejects.toThrow('Failed to generate tags');
  });

  it('should handle API rate limit errors gracefully', async () => {
    // Arrange
    fetchMock.mockResponseOnce(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 });

    const noteContent = 'This is a test note content';

    // Act & Assert
    await expect(ApiService.generateTags(noteContent)).rejects.toThrow('Failed to generate tags');
  });

  it('should handle network errors gracefully', async () => {
    // Arrange
    fetchMock.mockRejectOnce(new Error('Network Error'));

    const noteContent = 'This is a test note content';

    // Act & Assert
    await expect(ApiService.generateTags(noteContent)).rejects.toThrow('Failed to generate tags');
  });

  it('should return trimmed and clean tags', async () => {
    // Arrange
    const fakeResponse = {
      choices: [
        {
          message: {
            content: '  tag1 , tag2 , tag3 ,  tag4 , tag5  '
          }
        }
      ]
    };

    fetchMock.mockResponseOnce(JSON.stringify(fakeResponse));

    const noteContent = 'This is a test note content';

    // Act
    const tags = await ApiService.generateTags(noteContent);

    // Assert
    expect(tags).toEqual(['tag1', 'tag2', 'tag3', 'tag4', 'tag5']);
  });
});
