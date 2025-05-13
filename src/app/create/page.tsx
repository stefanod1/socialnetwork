'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/firebase';
import { useAuth } from '@/lib/hooks/useAuth';

export default function CreatePost() {
  const router = useRouter();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setImage(file);
      setError(null);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    if (!user) {
      throw new Error('User must be authenticated to upload images');
    }

    try {
      // Log Firebase configuration
      console.log('Firebase Storage Configuration:', {
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
      });

      // Create a unique filename
      const filename = `${user.uid}_${Date.now()}_${file.name}`;
      
      // Create storage reference
      const storageRef = ref(storage, `posts/${filename}`);
      console.log('Storage reference created:', {
        fullPath: storageRef.fullPath,
        bucket: storageRef.bucket,
        name: storageRef.name
      });

      // Upload file
      console.log('Starting file upload...', {
        fileSize: file.size,
        fileType: file.type,
        fileName: file.name
      });

      const metadata = {
        contentType: file.type,
        customMetadata: {
          userId: user.uid,
          uploadedAt: Date.now().toString()
        }
      };

      const snapshot = await uploadBytes(storageRef, file, metadata);
      console.log('File uploaded successfully:', {
        path: snapshot.ref.fullPath,
        size: snapshot.metadata.size,
        contentType: snapshot.metadata.contentType
      });

      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL obtained:', downloadURL);

      return downloadURL;
    } catch (error: any) {
      console.error('Upload error details:', {
        code: error.code,
        message: error.message,
        name: error.name,
        stack: error.stack,
        user: user ? {
          uid: user.uid,
          email: user.email,
          isAnonymous: user.isAnonymous
        } : 'No user'
      });
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      let imageURL = '';

      if (image) {
        try {
          console.log('Starting image upload process...');
          imageURL = await uploadImage(image);
          console.log('Image upload completed, URL:', imageURL);
        } catch (uploadError: any) {
          console.error('Image upload failed:', uploadError);
          setError(`Failed to upload image: ${uploadError.message}`);
          setIsLoading(false);
          return;
        }
      }

      const postData = {
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhotoURL: user.photoURL || '',
        content: content.trim(),
        imageURL,
        likes: [],
        comments: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('Creating post with data:', {
        ...postData,
        createdAt: 'serverTimestamp',
        updatedAt: 'serverTimestamp'
      });

      const docRef = await addDoc(collection(db, 'posts'), postData);
      console.log('Post created successfully with ID:', docRef.id);
      
      router.push('/');
    } catch (error: any) {
      console.error('Post creation failed:', error);
      setError(`Failed to create post: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-gray-600">Please sign in to create a post</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Create Post</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full p-4 border rounded-lg resize-none"
            rows={4}
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block mb-2">
            <span className="text-gray-700">Add Image (optional)</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-1 block w-full"
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500 mt-1">
              Maximum file size: 5MB
            </p>
          </label>
        </div>

        {image && (
          <div className="relative w-full h-64">
            <img
              src={URL.createObjectURL(image)}
              alt="Preview"
              className="w-full h-full object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={() => setImage(null)}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
              disabled={isLoading}
            >
              Remove
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !content.trim()}
          className={`w-full py-3 px-4 rounded-lg text-white font-semibold ${
            isLoading || !content.trim()
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Creating...
            </div>
          ) : (
            'Create Post'
          )}
        </button>
      </form>
    </div>
  );
} 