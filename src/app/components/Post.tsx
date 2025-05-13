import { useState } from 'react';
import Image from 'next/image';
import { Post as PostType } from '@/lib/types/social';
import { useAuth } from '@/lib/hooks/useAuth';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

interface PostProps {
  post: PostType;
}

export default function Post({ post }: PostProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.likes.includes(user?.uid || ''));
  const [likesCount, setLikesCount] = useState(post.likes.length);

  const handleLike = async () => {
    if (!user) return;

    const postRef = doc(db, 'posts', post.id);
    const newLikesCount = isLiked ? likesCount - 1 : likesCount + 1;
    
    try {
      await updateDoc(postRef, {
        likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
      
      setIsLiked(!isLiked);
      setLikesCount(newLikesCount);
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center space-x-3 mb-4">
        <Image
          src={post.authorPhotoURL || '/default-avatar.png'}
          alt={post.authorName}
          width={40}
          height={40}
          className="rounded-full"
        />
        <div>
          <h3 className="font-semibold">{post.authorName}</h3>
          <p className="text-sm text-gray-500">
            {post.createdAt?.toDate().toLocaleDateString()}
          </p>
        </div>
      </div>

      <p className="text-gray-800 mb-4">{post.content}</p>

      {post.imageURL && (
        <div className="relative w-full h-64 mb-4">
          <Image
            src={post.imageURL}
            alt="Post image"
            fill
            className="object-cover rounded-lg"
          />
        </div>
      )}

      <div className="flex items-center space-x-4">
        <button
          onClick={handleLike}
          className={`flex items-center space-x-1 ${
            isLiked ? 'text-red-500' : 'text-gray-500'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill={isLiked ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span>{likesCount}</span>
        </button>
      </div>
    </div>
  );
} 