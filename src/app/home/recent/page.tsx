"use client"
import { useEffect, useState } from 'react';

export default function Recent() {
  const [recentSubjects, setRecentSubjects] = useState<string[]>([]);
  const [recentLists, setRecentLists] = useState<string[]>([]);

  useEffect(() => {
  async function fetchData() {
    try {
      const response = await fetch('/api/recents');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setRecentSubjects(data.recent_subjects || []);
      setRecentLists(data.recent_lists || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  fetchData();
}, []);


  return (
    <>
      <div>
        <h2>Recent Subjects</h2>
        <ul>
          {recentSubjects.map((subject) => (
            <li key={subject}>{subject}</li>
          ))}
        </ul>
        <h2>Recent Lists</h2>
        <ul>
          {recentLists.map((list) => (
            <li key={list}>{list}</li>
          ))}
        </ul>
      </div>
    </>
  );
}