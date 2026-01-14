/**
 * Instructor Service
 *
 * Handles instructor-specific operations including student management,
 * approval requests, and notifications.
 */

import { doc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/app/lib/config/firebase';
import { usersService } from '../users/users.service';
import type {
  StudentInfo,
  ApprovalNoteData,
  ApprovalRequestData,
  SerializedMediaItem,
  SerializedAudioItem,
} from './instructor.types';

class InstructorService {
  /**
   * Fetch all students assigned to an instructor.
   */
  async fetchStudents(instructorId: string): Promise<StudentInfo[]> {
    if (!db) {
      throw new Error('Firebase db is not initialized');
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('parentInstructorId', '==', instructorId),
        where('isInstructor', '==', false),
      );

      const snap = await getDocs(q);
      const users: StudentInfo[] = [];

      snap.forEach(docSnap => {
        const data = docSnap.data();
        if (data?.uid && data?.name && data?.email) {
          users.push({
            uid: data.uid,
            name: data.name,
            email: data.email,
          });
        }
      });

      return users;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '';

      // Fallback to API-based lookup on permission errors
      if (errorMessage.includes('permission')) {
        console.warn('Falling back to API-based students list due to Firestore permissions.');
        return this.fetchStudentsFallback(instructorId);
      }

      throw new Error(`Unable to fetch students for instructor: ${instructorId}`);
    }
  }

  /**
   * Fallback method to fetch students when Firestore permissions fail.
   */
  private async fetchStudentsFallback(instructorId: string): Promise<StudentInfo[]> {
    const profile = await usersService.fetchById(instructorId);
    const studentUids: string[] = profile?.students || [];

    if (!studentUids.length) {
      return [];
    }

    return Promise.all(
      studentUids.map(async uid => {
        const name = await usersService.fetchCreatorName(uid).catch(() => 'Unknown User');
        return { uid, name, email: '' };
      }),
    );
  }

  /**
   * Submit a note for instructor approval.
   */
  async requestApproval(noteData: ApprovalNoteData): Promise<void> {
    const { instructorId, ...noteDetails } = noteData;

    if (!db) {
      throw new Error('Firebase db is not initialized');
    }

    const instructorRef = doc(db, 'users', instructorId);
    const approvalsRef = collection(instructorRef, 'approvalRequests');

    const serializedData = this.serializeNoteForFirestore(noteDetails);
    await addDoc(approvalsRef, serializedData);
  }

  /**
   * Serialize note data for Firestore storage.
   * Converts class instances (PhotoType, VideoType, AudioType) to plain objects.
   */
  private serializeNoteForFirestore(
    noteDetails: Omit<ApprovalNoteData, 'instructorId'>,
  ): ApprovalRequestData {
    const serialized: ApprovalRequestData = {
      ...noteDetails,
      status: 'pending',
      submittedAt: new Date(),
    };

    // Serialize media array (convert class instances to plain objects)
    if (noteDetails.media && Array.isArray(noteDetails.media)) {
      serialized.media = noteDetails.media.map((item: unknown): SerializedMediaItem => {
        const mediaItem = item as Record<string, unknown>;
        return {
          uuid:
            (mediaItem.uuid as string) ||
            (typeof mediaItem.getUuid === 'function' ? mediaItem.getUuid() : ''),
          type:
            (mediaItem.type as string) ||
            (typeof mediaItem.getType === 'function' ? mediaItem.getType() : ''),
          uri:
            (mediaItem.uri as string) ||
            (typeof mediaItem.getUri === 'function' ? mediaItem.getUri() : ''),
          thumbnail: mediaItem.thumbnail as string | undefined,
          duration: mediaItem.duration as string | undefined,
          name: mediaItem.name as string | undefined,
          isPlaying: mediaItem.isPlaying as boolean | undefined,
        };
      });
    }

    // Serialize audio array
    if (noteDetails.audio && Array.isArray(noteDetails.audio)) {
      serialized.audio = noteDetails.audio.map((item: unknown): SerializedAudioItem => {
        const audioItem = item as Record<string, unknown>;
        return {
          uuid:
            (audioItem.uuid as string) ||
            (typeof audioItem.getUuid === 'function' ? audioItem.getUuid() : ''),
          type:
            (audioItem.type as string) ||
            (typeof audioItem.getType === 'function' ? audioItem.getType() : 'audio'),
          uri:
            (audioItem.uri as string) ||
            (typeof audioItem.getUri === 'function' ? audioItem.getUri() : ''),
          duration:
            (audioItem.duration as string) ||
            (typeof audioItem.getDuration === 'function' ? audioItem.getDuration() : ''),
          name: (audioItem.name as string) || '',
          isPlaying: audioItem.isPlaying !== undefined ? (audioItem.isPlaying as boolean) : false,
        };
      });
    }

    return serialized;
  }

  /**
   * Send email notification when a new instructor signs up.
   */
  async sendNotification(email: string, name: string, description: string): Promise<boolean> {
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
}

// Export singleton instance
export const instructorService = new InstructorService();

// Export class for testing
export { InstructorService };
