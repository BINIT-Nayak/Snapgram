import { useMemo, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

import { PostDocument } from "@/types";
import { checkIsLiked } from "@/lib/utils";
import {
  useLikePost,
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
    () => (post.likes || []).map((user) => user.$id),
    [post.likes]
  );

  const [likes, setLikes] = useState<string[]>(likesList);
  const [isSaved, setIsSaved] = useState(false);

  const { mutate: likePost } = useLikePost();
  const { mutate: savePost } = useSavePost();
  const { mutate: deleteSavePost } = useDeleteSavedPost();

  const { data: currentUser } = useGetCurrentUser();

  const savedPostRecord = currentUser?.save?.find((record) => {
    const savedPostId =
      typeof record.post === "string" ? record.post : record.post?.$id;

    return savedPostId === post.$id;
  });

  useEffect(() => {
    setIsSaved(!!savedPostRecord);
  }, [savedPostRecord]);

  useEffect(() => {
    setLikes(likesList);
  }, [likesList]);

  const handleLikePost = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.stopPropagation();

    const previousLikes = likes;
    let likesArray = [...likes];

    if (likesArray.includes(userId)) {
      likesArray = likesArray.filter((Id) => Id !== userId);
    } else {
      likesArray.push(userId);
    }

    setLikes(likesArray);
    likePost(
      { postId: post.$id, likesArray },
      {
        onError: () => {
          setLikes(previousLikes);
        },
      }
    );
  };

  const handleSavePost = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.stopPropagation();

    if (savedPostRecord) {
      setIsSaved(false);
      return deleteSavePost(savedPostRecord.$id, {
        onError: () => {
          setIsSaved(true);
        },
      });
    }

    setIsSaved(true);
    savePost(
      { userId: userId, postId: post.$id },
      {
        onError: () => {
          setIsSaved(false);
        },
      }
    );
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
          aria-label={checkIsLiked(likes, userId) ? "Unlike post" : "Like post"}
          onClick={(e) => handleLikePost(e)}
          className={`post-action-btn ${
            checkIsLiked(likes, userId) ? "post-action-btn_liked" : ""
          }`}>
          <img
            src={
              checkIsLiked(likes, userId)
                ? "/assets/icons/liked.svg"
                : "/assets/icons/like.svg"
            }
            alt=""
            width={20}
            height={20}
            className="h-5 w-5"
          />
        </button>
        <p className="small-semibold lg:base-medium text-light-2">
          {likes.length}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          aria-label={isSaved ? "Remove saved post" : "Save post"}
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
