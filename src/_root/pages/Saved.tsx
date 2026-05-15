import { Link } from "react-router-dom";

import { Loader } from "@/components/shared";
import { useUserContext } from "@/context/AuthContext";
import { useGetSavedPosts } from "@/lib/react-query/queries";
import { getFilePreview } from "@/lib/appwrite/api";
import { multiFormatDateString } from "@/lib/utils";

const Saved = () => {
  const { user } = useUserContext();
  const { data: savePosts = [], isLoading } = useGetSavedPosts(user.id);
  const savedCreators = new Set(
    savePosts.map((post) => post.creator?.$id).filter(Boolean)
  ).size;

  return (
    <div className="saved-container">
      <div className="saved-hero">
        <div className="flex-start gap-4">
          <div className="saved-hero_icon">
            <img
              src="/assets/icons/save.svg"
              width={28}
              height={28}
              alt="saved"
              className="invert-white"
            />
          </div>
          <div>
            <p className="small-semibold text-secondary-500">
              Your private collection
            </p>
            <h2 className="h3-bold md:h2-bold text-left w-full page-title">
              Saved Posts
            </h2>
          </div>
        </div>

        <div className="saved-summary">
          <div>
            <p className="h3-bold text-light-1">{savePosts.length}</p>
            <p className="small-medium text-light-3">Saved</p>
          </div>
          <div>
            <p className="h3-bold text-light-1">{savedCreators}</p>
            <p className="small-medium text-light-3">Creators</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <Loader />
      ) : (
        <div className="saved-content">
          {savePosts.length === 0 ? (
            <div className="saved-empty">
              <img
                src="/assets/icons/save.svg"
                width={42}
                height={42}
                alt="saved"
                className="invert-white opacity-80"
              />
              <h3 className="body-bold text-light-1">No saved posts yet</h3>
              <p className="small-medium text-light-3">
                Tap the save icon on posts you want to revisit later.
              </p>
            </div>
          ) : (
            <ul className="saved-list">
              {savePosts.map((post) => {
                const postImageUrl = post.imageId
                  ? getFilePreview(post.imageId)?.toString()
                  : post.imageUrl;
                const creator = post.creator;
                const tags = post.tags || [];
                const likesCount = post.likes?.length || 0;

                return (
                  <li key={post.$id}>
                    <Link to={`/posts/${post.$id}`} className="saved-card">
                      <img
                        src={
                          postImageUrl || "/assets/icons/profile-placeholder.svg"
                        }
                        alt="saved post"
                        className="saved-card_img"
                      />

                      <div className="saved-card_info">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              creator?.imageUrl ||
                              "/assets/icons/profile-placeholder.svg"
                            }
                            alt="creator"
                            className="h-10 w-10 rounded-full object-cover ring-2 ring-primary-500"
                          />
                          <div className="min-w-0">
                            <p className="base-semibold text-light-1 line-clamp-1">
                              {creator?.name || "Unknown creator"}
                            </p>
                            <p className="small-regular text-light-3 line-clamp-1">
                              {post.location || "No location"} ·{" "}
                              {multiFormatDateString(post.$createdAt)}
                            </p>
                          </div>
                        </div>

                        <p className="saved-card_caption">
                          {post.caption || "No caption added."}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {tags.length > 0 ? (
                            tags.slice(0, 4).map((tag, index) => (
                              <span
                                key={`${tag}${index}`}
                                className="post-tag small-regular">
                                #{tag}
                              </span>
                            ))
                          ) : (
                            <span className="post-tag small-regular">
                              #saved
                            </span>
                          )}
                        </div>

                        <div className="saved-card_meta">
                          <span>{likesCount} likes</span>
                          <span>View details</span>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default Saved;
