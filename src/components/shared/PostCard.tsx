import { Link } from "react-router-dom";

import { PostStats } from "@/components/shared";
import { PostDocument } from "@/types";
import { multiFormatDateString } from "@/lib/utils";
import { useUserContext } from "@/context/AuthContext";
import { getFilePreview } from "@/lib/appwrite/api";

type PostCardProps = {
  post: PostDocument;
};

const PostCard = ({ post }: PostCardProps) => {
  const { user } = useUserContext();
  const postImageUrl = post.imageId
    ? getFilePreview(post.imageId)?.toString()
    : post.imageUrl;

  if (!post.creator) return;

  return (
    <div className="post-card">
      <div className="post-card_header">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.creator.$id}`}>
            <img
              src={
                post.creator?.imageUrl ||
                "/assets/icons/profile-placeholder.svg"
              }
              alt="creator"
              className="h-12 w-12 rounded-full object-cover ring-2 ring-primary-500 shadow-lg shadow-black"
            />
          </Link>

          <div className="flex flex-col">
            <p className="base-medium lg:body-bold text-light-1">
              {post.creator.name}
            </p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-light-3">
              <p className="subtle-semibold lg:small-regular">
                {multiFormatDateString(post.$createdAt)}
              </p>
              {post.location && (
                <>
                  <span className="text-primary-500">•</span>
                  <p className="subtle-semibold lg:small-regular">
                    {post.location}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <Link
          to={`/update-post/${post.$id}`}
          className={`post-card_edit ${
            user.id !== post.creator.$id && "hidden"
          }`}>
          <img
            src={"/assets/icons/edit.svg"}
            alt="edit"
            width={20}
            height={20}
          />
        </Link>
      </div>

      <Link to={`/posts/${post.$id}`}>
        <div className="post-card_body small-medium lg:base-medium">
          <p className="whitespace-pre-wrap break-words text-light-2">
            {post.caption}
          </p>
          <ul className="flex flex-wrap gap-2 mt-3">
            {(post.tags || []).map((tag, index) => (
              <li key={`${tag}${index}`} className="post-tag small-regular">
                #{tag}
              </li>
            ))}
          </ul>
        </div>

        <img
          src={postImageUrl || "/assets/icons/profile-placeholder.svg"}
          alt="post image"
          className="post-card_img"
        />
      </Link>

      <PostStats post={post} userId={user.id} />
    </div>
  );
};

export default PostCard;
