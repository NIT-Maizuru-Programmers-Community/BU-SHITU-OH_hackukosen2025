import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, DocumentData, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface AttendanceUser {
  uid: string;
  displayName: string;
  checkInTime: Date;
  duration: number; // 分単位
  isOnline: boolean;
}

export function useCurrentAttendance() {
  const [attendees, setAttendees] = useState<AttendanceUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    
    // 在室中のユーザーを取得
    const q = query(
      collection(db, 'attendance'),
      where('status', '==', 'in')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const now = new Date();
        const attendanceData: AttendanceUser[] = snapshot.docs.map((doc) => {
          const data = doc.data() as DocumentData;
          const checkInTime = data.checkInTime?.toDate() || new Date();
          const duration = Math.floor((now.getTime() - checkInTime.getTime()) / (1000 * 60)); // 分単位
          
          return {
            uid: data.userId || doc.id,
            displayName: data.displayName || '名無し',
            checkInTime,
            duration,
            isOnline: true,
          };
        });
        
        setAttendees(attendanceData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('在室状況取得エラー:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { attendees, loading, error, count: attendees.length };
}

// 滞在時間をフォーマット
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}時間${mins}分` : `${mins}分`;
}
