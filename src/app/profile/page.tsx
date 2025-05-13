'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Post as PostType, User } from '@/lib/types/social';
import Post from '@/components/Post';
import { useAuth } from '@/lib/hooks/useAuth';

export default function Profile() {
  const { user } = useAuth();
  const [userPosts, setUserPosts] = useState<PostType[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (!user) {
      console.log('No user found, returning early');
      return;
    }

    console.log('User found:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    });

    // Fetch user's profile data
    const fetchUserProfile = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setBio(userData.bio || '');
          console.log('User profile fetched:', userData);
        } else {
          console.log('No user profile found in Firestore');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();

    try {
      console.log('Setting up posts query...');
      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef,
        where('authorId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      console.log('Posts query created:', {
        userId: user.uid,
        collection: 'posts',
        conditions: ['authorId == user.uid', 'orderBy createdAt desc']
      });

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          console.log('Posts snapshot received:', {
            empty: snapshot.empty,
            size: snapshot.size,
            docs: snapshot.docs.map(doc => ({
              id: doc.id,
              data: doc.data()
            }))
          });
          
          const postsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as PostType[];
          
          console.log('Processed posts data:', postsData);
          setUserPosts(postsData);
        },
        (error) => {
          console.error('Error in posts snapshot listener:', error);
        }
      );

      return () => {
        console.log('Cleaning up posts listener');
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up posts query:', error);
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      bio,
      updatedAt: new Date()
    });

    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-gray-600">Please sign in to view your profile</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <Image
            src={user.photoURL || '/default-avatar.png'}
            alt={user.displayName || 'User'}
            width={100}
            height={100}
            className="rounded-full"
          />
          <div>
            <h1 className="text-2xl font-bold">{user.displayName}</h1>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write something about yourself..."
              className="w-full p-2 border rounded-lg"
              rows={3}
            />
            <div className="flex space-x-2">
              <button
                onClick={handleUpdateProfile}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-700 mb-4">{bio || 'No bio yet'}</p>
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-500 hover:text-blue-600"
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>

      <h2 className="text-xl font-semibold mb-4">Your Posts</h2>
      <div className="space-y-4">
        {userPosts.length === 0 ? (
          <p className="text-gray-500 text-center">No posts yet</p>
        ) : (
          userPosts.map((post) => (
            <Post key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
} 