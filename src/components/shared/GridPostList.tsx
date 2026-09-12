import { Link } from "react-router-dom";

import { PerformanceImage, PostStats } from "@/components/shared";
import { PostDocument } from "@/types";
import { useUserContext } from "@/context/AuthContext";
import { getFilePreview } from "@/lib/appwrite/api";

type GridPostListProps = {
  posts: PostDocument[];
  showUser?: boolean;
  showStats?: boolean;
  priorityFirst?: boolean;
};

const GridPostList = ({
  posts,
  showUser = true,
  showStats = true,
  priorityFirst = false,
}: GridPostListProps) => {
  const { user } = useUserContext();

  return (
    <ul className="grid-container">
      {posts.map((post, index) => (
        <li key={post.$id} className="group grid-post_item">
          <Link to={`/posts/${post.$id}`} className="grid-post_link">
            <PerformanceImage
              src={
                post.imageId
                  ? getFilePreview(post.imageId)?.toString()
                  : post.imageUrl
              }
              alt="post"
              className="h-full w-full object-cover"
              wrapperClassName="h-full w-full"
              eager={priorityFirst && index === 0}
              sizes="(max-width: 640px) calc(100vw - 40px), (max-width: 1280px) 50vw, 33vw"
            />
          </Link>

          <div className="grid-post_user">
            {showUser && (
              <div className="flex items-center justify-start gap-2 flex-1">
                <img
                  src={
                    post.creator?.imageUrl ||
                    "/assets/icons/profile-placeholder.svg"
                  }
                  alt="creator"
                  className="w-8 h-8 rounded-full"
                />
                <p className="line-clamp-1">{post.creator?.name}</p>
              </div>
            )}
            {showStats && <PostStats post={post} userId={user.id} />}
          </div>
        </li>
      ))}
    </ul>
  );
};

export default GridPostList;
