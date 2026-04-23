import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Send, Trash2, ArrowLeft } from 'lucide-react';
import io from 'socket.io-client';
import axiosClient from '../../../utils/axiosClient';
import { setComments, deleteComment } from '../../../utils/Slice/commentSlice';

const Discussion = ({ pid }) => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { comments } = useSelector((state) => state.comment);
    const [newComment, setNewComment] = useState('');
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedCommentId, setExpandedCommentId] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const chatContainerRef = useRef(null);
    const textareaRef = useRef(null);
    const socketRef = useRef(null);

    // Initialize Socket.IO
    useEffect(() => {
        socketRef.current = io(import.meta.env.VITE_API_URL, {
            withCredentials: true,
            reconnection: true,
            transports: ['websocket'],
            path: '/socket.io'
        });

        socketRef.current.on('connect_error', (err) => {
            console.error('Socket.IO connection error:', err);
            setError('Failed to connect to discussion server');
        });

        socketRef.current.emit('joinProblemRoom', pid);

        socketRef.current.on('newComment', (updatedComments) => {
            const validComments = (updatedComments || []).filter(comment => comment.user_id && comment.user_id._id);
            dispatch(setComments(validComments));
        });

        socketRef.current.on('commentDeleted', ({ commentId, comments }) => {
            const validComments = (comments || []).filter(comment => comment.user_id && comment.user_id._id);
            dispatch(setComments(validComments));
        });

        return () => {
            socketRef.current.disconnect();
        };
    }, [pid, dispatch]);

    // Auto-resize textarea based on content
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            const adjustHeight = () => {
                textarea.style.height = 'auto';
                textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
            };
            textarea.addEventListener('input', adjustHeight);
            adjustHeight();
            return () => textarea.removeEventListener('input', adjustHeight);
        }
    }, [newComment]);

    // Fetch comments (initial load)
    useEffect(() => {
        const fetchComments = async () => {
            setIsLoading(true);
            try {
                const { data } = await axiosClient.get(`/problem/getAllComments/${pid}`);
                console.log(data);
                const validComments = (data.comments || []).filter(comment => comment.user_id && comment.user_id._id);
                dispatch(setComments(validComments));
            } catch (err) {
                console.error('Error fetching comments:', err);
                setError(err.response?.data?.error || 'Failed to load comments');
            } finally {
                setIsLoading(false);
            }
        };
        fetchComments();
    }, [pid, dispatch]);

    // Auto-scroll to bottom when new comments arrive
    useEffect(() => {
        if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            const isNearBottom = scrollHeight - (scrollTop + clientHeight) < 100;
            if (isNearBottom || !selectedUserId) {
                chatContainerRef.current.scrollTop = scrollHeight;
            }
        }
    }, [comments, selectedUserId]);

    // Handle comment submission
    const handleSendComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) {
            setError('Comment cannot be empty');
            return;
        }
        if (!user) {
            setError('You must be logged in to post a comment');
            return;
        }

        try {
            setIsSubmitting(true);
            const { data } = await axiosClient.post(`/problem/SaveComment/${pid}`, {
                comment: newComment
            });
            setNewComment('');
            setError(null);
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        } catch (err) {
            console.error('Error sending comment:', err);
            setError(err.response?.data?.error || 'Failed to send comment');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle comment deletion
    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) return;

        try {
            setIsSubmitting(true);
            const { data } = await axiosClient.post(`/problem/DeleteComment/${pid}/${commentId}`);
            setError(null);
            if (expandedCommentId === commentId) {
                setExpandedCommentId(null);
            }
        } catch (err) {
            console.error('Error deleting comment:', err);
            setError(err.response?.data?.error || 'Failed to delete comment');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Format timestamp
    const formatTimestamp = (timestamp) => {
        try {
            return new Date(timestamp).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return 'Invalid time';
        }
    };

    // Get unique users with their latest comment
    const getUniqueUsers = () => {
        const userMap = new Map();
        [...comments]
            .filter(comment => comment.user_id && comment.user_id._id)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .forEach((comment) => {
                if (!userMap.has(comment.user_id._id)) {
                    userMap.set(comment.user_id._id, {
                        user_id: comment.user_id,
                        latestComment: comment.comment,
                        latestTimestamp: comment.createdAt,
                    });
                }
            });
        return Array.from(userMap.values());
    };

    // Get comments by selected user (newest first)
    const getUserComments = (userId) => {
        return comments
            .filter((comment) => comment.user_id && comment.user_id._id === userId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    };

    return (
        <div className="flex flex-col h-[78vh] dark:bg-slate-900 text-gray-900 dark:text-gray-100">
            <div className="flex flex-col h-full relative">
                <div 
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto p-4 pb-24"
                >
                    {!selectedUserId ? (
                        <>
                            {isLoading ? (
                                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                                    Loading comments...
                                </div>
                            ) : comments.length === 0 ? (
                                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                                    No comments yet. Start the discussion!
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {getUniqueUsers().map((userData) => (
                                        <div
                                            key={userData.user_id._id}
                                            className="p-3 bg-gray-100 dark:bg-slate-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                            onClick={() => setSelectedUserId(userData.user_id._id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-500 dark:bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                    {userData.user_id.UserName?.[0] || 'A'}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium">{userData.user_id.UserName || 'Anonymous'}</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                                        {userData.latestComment.length > 50
                                                            ? `${userData.latestComment.substring(0, 50)}...`
                                                            : userData.latestComment}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {formatTimestamp(userData.latestTimestamp)}
                                                    </p>
                                                </div>
                                                <div className="text-xs bg-blue-100 dark:bg-indigo-900 text-blue-800 dark:text-indigo-200 px-2 py-1 rounded-full">
                                                    {comments.filter(c => c.user_id?._id === userData.user_id._id).length} 
                                                    {comments.filter(c => c.user_id?._id === userData.user_id._id).length === 1 ? ' comment' : ' comments'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setSelectedUserId(null)}
                                className="flex items-center text-blue-600 dark:text-indigo-400 hover:text-blue-700 dark:hover:text-indigo-300 mb-4"
                            >
                                <ArrowLeft size={16} className="mr-2" />
                                Back to discussion
                            </button>
                            {isLoading ? (
                                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                                    Loading comments...
                                </div>
                            ) : getUserComments(selectedUserId).length === 0 ? (
                                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                                    No comments found for this user.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {getUserComments(selectedUserId).map((comment) => (
                                        <div
                                            key={comment._id}
                                            className={`p-3 rounded-lg ${
                                                comment.user_id?._id === user?._id
                                                    ? 'bg-blue-100 dark:bg-indigo-900'
                                                    : 'bg-gray-100 dark:bg-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-blue-500 dark:bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm">
                                                        {comment.user_id?.UserName?.[0] || 'A'}
                                                    </div>
                                                    <span className="font-medium">
                                                        {comment.user_id?.UserName || 'Anonymous'}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatTimestamp(comment.createdAt)}
                                                </span>
                                            </div>
                                            <p className="mb-2 whitespace-pre-wrap">{comment.comment}</p>
                                            {comment.user_id?._id === user?._id && (
                                                <div className="flex justify-end">
                                                    <button
                                                        onClick={() => handleDeleteComment(comment._id)}
                                                        disabled={isSubmitting}
                                                        className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 text-sm flex items-center gap-1"
                                                    >
                                                        <Trash2 size={14} />
                                                        {isSubmitting ? 'Deleting...' : 'Delete'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 shadow-lg sticky bottom-0 z-10">
                    <form onSubmit={handleSendComment} className="flex gap-2">
                        <textarea
                            ref={textareaRef}
                            value={newComment}
                            onChange={(e) => {
                                setNewComment(e.target.value);
                                setError(null);
                            }}
                            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none min-h-[48px] max-h-[150px]"
                            placeholder={user ? 'Type your comment...' : 'Log in to comment'}
                            disabled={isSubmitting || !user}
                            rows={1}
                        />
                        <button
                            type="submit"
                            disabled={isSubmitting || !user}
                            className={`px-4 py-2 rounded-lg flex items-center justify-center ${
                                isSubmitting || !user
                                    ? 'opacity-50 cursor-not-allowed bg-gray-400'
                                    : 'bg-blue-500 hover:bg-blue-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white'
                            }`}
                        >
                            {isSubmitting ? (
                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                            ) : (
                                <Send size={18} />
                            )}
                        </button>
                    </form>
                    {error && <p className="text-red-500 dark:text-red-400 mt-2 text-sm">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default Discussion;