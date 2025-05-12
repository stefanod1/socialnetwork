'use client';

import { useState } from 'react';
import Image from 'next/image';
import { HeartIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { Post as PostType } from '@/lib/types/social';
import { useAuth } from '@/lib/hooks/useAuth';
import { db } from '@/lib/firebase/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

interface PostProps {
  post: PostType;
}

export default function Post({ post }: PostProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(user ? post.likes.includes(user.uid) : false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  const handleLike = async () => {
    if (!user) return;

    const postRef = doc(db, 'posts', post.id);
    if (isLiked) {
      await updateDoc(postRef, {
        likes: arrayRemove(user.uid)
      });
    } else {
      await updateDoc(postRef, {
        likes: arrayUnion(user.uid)
      });
    }
    setIsLiked(!isLiked);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    const postRef = doc(db, 'posts', post.id);
    const comment = {
      id: Date.now().toString(),
      authorId: user.uid,
      authorName: user.displayName || 'Anonymous',
      authorPhotoURL: user.photoURL || '',
      content: newComment.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await updateDoc(postRef, {
      comments: arrayUnion(comment)
    });

    setNewComment('');
  };

  return (
    <div className="bg-white rounded-lg shadow mb-4 p-4">
      <div className="flex items-center space-x-3 mb-4">
        <Image
          src={post.authorPhotoURL}
          alt={post.authorName}
          width={40}
          height={40}
          className="rounded-full"
        />
        <div>
          <h3 className="font-semibold">{post.authorName}</h3>
          <p className="text-sm text-gray-500">
            {new Date(post.createdAt.toDate()).toLocaleDateString()}
          </p>
        </div>
      </div>

      <p className="mb-4">{post.content}</p>

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

      <div className="flex items-center space-x-4 border-t border-b py-2">
        <button
          onClick={handleLike}
          className="flex items-center space-x-1 text-gray-500 hover:text-red-500"
        >
          {isLiked ? (
            <HeartIconSolid className="h-6 w-6 text-red-500" />
          ) : (
            <HeartIcon className="h-6 w-6" />
          )}
          <span>{post.likes.length}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-1 text-gray-500 hover:text-blue-500"
        >
          <ChatBubbleLeftIcon className="h-6 w-6" />
          <span>{post.comments.length}</span>
        </button>
      </div>

      {showComments && (
        <div className="mt-4">
          <form onSubmit={handleComment} className="mb-4">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full p-2 border rounded-lg"
            />
          </form>

          <div className="space-y-4">
            {post.comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <Image
                  src={comment.authorPhotoURL}
                  alt={comment.authorName}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <div>
                  <p className="font-semibold">{comment.authorName}</p>
                  <p>{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 