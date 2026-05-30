import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { formatCitation } from '../utils/citation_formatter';

describe('formatCitation function', () => {
  it('should italicize entire citation when there is no comma (Case 1)', () => {
    const citation = 'American Anthropological Association Resources on Ethics';
    const { container } = render(<>{formatCitation(citation)}</>);
    const italicElement = container.querySelector('span.italic');
    expect(italicElement).toBeTruthy();
    expect(italicElement?.textContent).toBe(citation);
    expect(italicElement).toHaveStyle({ fontStyle: 'italic' });
  });

  it('should italicize title after period (Case 2)', () => {
    const citation =
      'Malley, Suzanne Blum and Ames Hawkins. Engaging Communities: Writing Ethnographic Research';
    const { container } = render(<>{formatCitation(citation)}</>);
    const italicElement = container.querySelector('span.italic');
    expect(italicElement).toBeTruthy();
    expect(italicElement?.textContent).toBe('Engaging Communities: Writing Ethnographic Research');
    expect(italicElement).toHaveStyle({ fontStyle: 'italic' });
    // Check that author part is not italicized
    expect(container.textContent).toContain('Malley, Suzanne Blum and Ames Hawkins.');
  });

  it('should italicize title after et. al. (Case 3)', () => {
    const citation = 'Tyner- Millings, Alia R. et. al. Ethnography Made Easy';
    const { container } = render(<>{formatCitation(citation)}</>);
    const italicElement = container.querySelector('span.italic');
    expect(italicElement).toBeTruthy();
    expect(italicElement?.textContent).toBe('Ethnography Made Easy');
    expect(italicElement).toHaveStyle({ fontStyle: 'italic' });
    // Check that author part is not italicized
    expect(container.textContent).toContain('Tyner- Millings, Alia R. et. al.');
  });

  it('should italicize title after comma when no period found', () => {
    const citation =
      'Emerson, Robert, Rachel Fretz, and Linda Shaw, Writing Ethnographic Fieldnotes';
    const { container } = render(<>{formatCitation(citation)}</>);
    const italicElement = container.querySelector('span.italic');
    expect(italicElement).toBeTruthy();
    expect(italicElement?.textContent).toBe('Writing Ethnographic Fieldnotes');
    expect(italicElement).toHaveStyle({ fontStyle: 'italic' });
  });

  it('should handle citations with ending period', () => {
    const citation = 'Agar, Michael. Speaking of Ethnography.';
    const { container } = render(<>{formatCitation(citation)}</>);
    const italicElement = container.querySelector('span.italic');
    expect(italicElement).toBeTruthy();
    expect(italicElement?.textContent).toBe('Speaking of Ethnography');
    expect(container.textContent).toContain('Agar, Michael.');
  });

  it('should italicize entire citation when no comma and no pattern found', () => {
    const citation = 'Some random text without proper format';
    const { container } = render(<>{formatCitation(citation)}</>);
    // When there's no comma, the entire citation should be italicized (Case 1)
    const italicElement = container.querySelector('span.italic');
    expect(italicElement).toBeTruthy();
    expect(italicElement?.textContent).toBe(citation);
    expect(italicElement).toHaveStyle({ fontStyle: 'italic' });
  });
});
