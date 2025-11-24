import React from 'react';
import { render, screen } from '@testing-library/react';
import PublishToggle from '../lib/components/noteElements/publish_toggle';

describe('PublishToggle', () => {
  test('shows Approve for instructor reviewing a student note', () => {
    render(
      <PublishToggle
        noteId="n1"
        userId="u2"
        isPublished={false}
        isApprovalRequested={true}
        instructorId={"i1"}
        isInstructorReview={true}
      />
    );
    expect(screen.getByText(/Approve|Publish/i)).toBeTruthy();
  });
});


