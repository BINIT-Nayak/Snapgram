import { MouseEvent, useEffect, useState } from "react";

import { Button, ButtonProps } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useUserContext } from "@/context/AuthContext";
import { useFollowUser, useUnfollowUser } from "@/lib/react-query/queries";
import { UserDocument } from "@/types";

type FollowButtonProps = {
  targetUser: UserDocument;
  className?: string;
  size?: ButtonProps["size"];
};

const FollowButton = ({
  targetUser,
  className = "",
  size = "sm",
}: FollowButtonProps) => {
  const { user } = useUserContext();
  const { toast } = useToast();
  const { mutateAsync: followUser, isLoading: isFollowingUser } =
    useFollowUser();
  const { mutateAsync: unfollowUser, isLoading: isUnfollowingUser } =
    useUnfollowUser();
  const [isFollowing, setIsFollowing] = useState(false);

  const currentUserId = user.id;
  const targetUserId = targetUser.$id;
  const isOwnProfile = currentUserId === targetUserId;
  const isLoading = isFollowingUser || isUnfollowingUser;

  useEffect(() => {
    setIsFollowing((targetUser.followers || []).includes(currentUserId));
  }, [currentUserId, targetUser.followers]);

  const handleFollow = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!currentUserId || isOwnProfile || isLoading) {
      return;
    }

    const nextIsFollowing = !isFollowing;
    setIsFollowing(nextIsFollowing);

    try {
      const payload = { currentUserId, targetUserId };
      if (nextIsFollowing) {
        await followUser(payload);
      } else {
        await unfollowUser(payload);
      }
    } catch (error) {
      setIsFollowing(!nextIsFollowing);
      toast({
        title: "Follow action failed",
        description:
          error instanceof Error
            ? error.message
            : "Please check your Appwrite permissions and try again.",
      });
    }
  };

  if (isOwnProfile) {
    return (
      <Button
        type="button"
        size={size}
        disabled
        className={`shad-button_dark_4 px-5 ${className}`}>
        You
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size={size}
      disabled={isLoading}
      onClick={handleFollow}
      className={`px-5 ${
        isFollowing ? "shad-button_dark_4" : "shad-button_primary"
      } ${className}`}>
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
};

export default FollowButton;
