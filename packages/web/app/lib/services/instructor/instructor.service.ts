/**
 * Instructor Service
 *
 * Handles instructor-specific operations including student management,
 * approval requests, and notifications.
 */

import type { StudentInfo, ApprovalNoteData } from './instructor.types';
import { fetchWithAuth } from '../api';

/**
 * Fetch all students assigned to an instructor.
 */
export async function fetchStudents(instructorId: string): Promise<StudentInfo[]> {
  try {
    const students = await fetchWithAuth<
      Array<{
        id: string;
        name: string;
        email: string;
      }>
    >(`/api/users/${instructorId}/students`);

    // Map API response to StudentInfo format
    return students.map(s => ({
      uid: s.id,
      name: s.name,
      email: s.email,
    }));
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
}

/**
 * Submit a note for instructor approval.
 * NOTE: This feature requires additional API endpoints to be implemented.
 * For now, this is a placeholder that will need to be connected to the
 * new backend once approval requests endpoints are added.
 */
export async function requestApproval(noteData: ApprovalNoteData): Promise<void> {
  // TODO: Implement when approval requests API endpoints are added
  // The approval requests feature requires:
  // - A new approval_requests table in the database
  // - POST /api/instructors/:id/approval-requests endpoint
  // - GET /api/instructors/:id/approval-requests endpoint
  // - PATCH /api/approval-requests/:id (approve/reject) endpoint
  console.warn(
    'requestApproval: Feature not yet implemented with new API. Note data:',
    noteData.title,
  );
  throw new Error('Approval requests feature is being migrated. Please try again later.');
}

/**
 * Send email notification when a new instructor signs up.
 */
export async function sendNotification(
  email: string,
  name: string,
  description: string,
): Promise<boolean> {
  if (!email || !name || !description) {
    throw new Error('Missing required fields');
  }

  try {
    const response = await fetch('/api/send-instructor-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, description }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('Email notification sent successfully');
      return true;
    }

    console.error('Failed to send email notification:', result.error || result.message);
    return false;
  } catch (error) {
    console.error('Error sending instructor notification:', error);
    return false;
  }
}
