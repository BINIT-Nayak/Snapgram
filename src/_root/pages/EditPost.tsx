import { Link, useParams } from "react-router-dom";

import { Loader } from "@/components/shared";
import PostForm from "@/components/forms/PostForm";
import { useGetPostById } from "@/lib/react-query/queries";
import { useUserContext } from "@/context/AuthContext";

const EditPost = () => {
  const { id } = useParams();
  const { user } = useUserContext();
  const { data: post, isLoading } = useGetPostById(id);

  if (isLoading)
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );

  return (
    <div className="flex flex-1">
      <div className="common-container">
        <div className="flex-start gap-3 justify-start w-full max-w-5xl">
          <img
            src="/assets/icons/edit.svg"
            width={36}
            height={36}
            alt="edit"
            className="invert-white"
          />
          <h2 className="h3-bold md:h2-bold text-left w-full">Edit Post</h2>
        </div>

        {post && post.creator?.$id === user.id ? (
          <PostForm action="Update" post={post} />
        ) : (
          <div className="flex flex-col gap-4 w-full max-w-5xl rounded-lg border border-dark-4 bg-dark-3 p-8">
            <h3 className="h3-bold text-light-1">Post unavailable</h3>
            <p className="base-regular text-light-3">
              You can only edit posts that you created.
            </p>
            <Link
              to={`/posts/${id || ""}`}
              className="h-12 bg-primary-500 px-5 text-light-1 flex-center rounded-lg w-fit">
              Back to post
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditPost;
