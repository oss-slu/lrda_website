import { useMutation } from '@tanstack/react-query';
import { generateTags, type GenerateTagsInput } from '@/services/tags.service';

export function useGenerateTags() {
  return useMutation({
    mutationFn: (input: GenerateTagsInput) => generateTags(input),
  });
}
