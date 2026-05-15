import PostForm from "@/components/forms/PostForm";

const CreatePost = () => {
  return (
    <div className="flex flex-1">
      <div className="create-post-container">
        <div className="create-post-hero">
          <div className="flex-start gap-4">
            <div className="create-post-icon">
              <img
                src="/assets/icons/add-post.svg"
                width={30}
                height={30}
                alt="add"
              />
            </div>
            <div>
              <p className="small-semibold text-secondary-500">New moment</p>
              <h2 className="h3-bold md:h2-bold text-left w-full page-title">
                Create Post
              </h2>
            </div>
          </div>
          <div className="create-post-sparkline" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>

        <PostForm action="Create" />
      </div>
    </div>
  );
};

export default CreatePost;
