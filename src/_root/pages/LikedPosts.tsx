import { GridPostList, Loader } from "@/components/shared";
import { useUserContext } from "@/context/AuthContext";
import { useGetLikedPosts } from "@/lib/react-query/queries";

const LikedPosts = () => {
  const { user } = useUserContext();
  const { data: likedPosts = [], isLoading } = useGetLikedPosts(user.id);

  if (isLoading)
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );

  return (
    <>
      {likedPosts.length === 0 && (
        <p className="text-light-4">No liked posts</p>
      )}

      <GridPostList posts={likedPosts} showStats={false} />
    </>
  );
};

export default LikedPosts;
