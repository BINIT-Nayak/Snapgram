import { useMemo } from "react";
import { useLocation } from "react-router-dom";

import { PostDocument } from "@/types";
import { getLikeUserId } from "@/lib/appwrite/api";
import { checkIsLiked } from "@/lib/utils";
import {
  useLikePost,
  useUnlikePost,
  useSavePost,
  useDeleteSavedPost,
  useGetCurrentUser,
} from "@/lib/react-query/queries";

type PostStatsProps = {
  post: PostDocument;
  userId: string;
};

const PostStats = ({ post, userId }: PostStatsProps) => {
  const location = useLocation();
  const likesList = useMemo(
    () => (post.likes || []).map((like) => getLikeUserId(like)),
    [post.likes]
  );

  const { mutate: likePost, isLoading: isLikingPost } = useLikePost();
  const { mutate: unlikePost, isLoading: isUnlikingPost } = useUnlikePost();
  const { mutate: savePost, isLoading: isSavingPost } = useSavePost();
  const { mutate: deleteSavePost, isLoading: isDeletingSavedPost } =
    useDeleteSavedPost();

  const { data: currentUser } = useGetCurrentUser();

  const savedPostRecord = currentUser?.save?.find((record) => {
    const savedPostId =
      typeof record.post === "string" ? record.post : record.post?.$id;

    return savedPostId === post.$id;
  });
  const isSaved = !!savedPostRecord;
  const isLiked = checkIsLiked(likesList, userId);
  const likedPostRecord = post.likes?.find(
    (like) => getLikeUserId(like) === userId
  );

  const handleLikePost = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.stopPropagation();

    if (likedPostRecord) {
      return unlikePost({
        likeRecordId: likedPostRecord.$id,
        userId,
        postId: post.$id,
        post,
      });
    }

    likePost({ userId, postId: post.$id, post });
  };

  const handleSavePost = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.stopPropagation();

    if (savedPostRecord) {
      return deleteSavePost({
        savedRecordId: savedPostRecord.$id,
        postId: post.$id,
      });
    }

    savePost({ userId: userId, postId: post.$id, post });
  };

  const containerStyles = location.pathname.startsWith("/profile")
    ? "w-full"
    : "";

  return (
    <div
      className={`post-stats-container z-20 ${containerStyles}`}>
      <div className="flex gap-2 mr-5 items-center">
        <button
          type="button"
          aria-label={isLiked ? "Unlike post" : "Like post"}
          disabled={isLikingPost || isUnlikingPost}
          onClick={(e) => handleLikePost(e)}
          className={`post-action-btn ${
            isLiked ? "post-action-btn_liked" : ""
          }`}>
          <img
            src={
              isLiked ? "/assets/icons/liked.svg" : "/assets/icons/like.svg"
            }
            alt=""
            width={20}
            height={20}
            className="h-5 w-5"
          />
        </button>
        <p className="small-semibold lg:base-medium text-light-2">
          {likesList.length}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          aria-label={isSaved ? "Remove saved post" : "Save post"}
          disabled={isSavingPost || isDeletingSavedPost}
          onClick={(e) => handleSavePost(e)}
          className={`post-action-btn ${
            isSaved ? "post-action-btn_saved" : ""
          }`}>
          <img
            src={isSaved ? "/assets/icons/saved.svg" : "/assets/icons/save.svg"}
            alt=""
            width={20}
            height={20}
            className="h-5 w-5"
          />
        </button>
      </div>
    </div>
  );
};

export default PostStats;
