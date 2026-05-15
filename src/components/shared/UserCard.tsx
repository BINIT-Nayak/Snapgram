import { Link } from "react-router-dom";

import { UserDocument } from "@/types";
import FollowButton from "./FollowButton";

type UserCardProps = {
  user: UserDocument;
};

const UserCard = ({ user }: UserCardProps) => {
  return (
    <article className="user-card">
      <Link to={`/profile/${user.$id}`} className="flex-center flex-col gap-4">
        <img
          src={user.imageUrl || "/assets/icons/profile-placeholder.svg"}
          alt="creator"
          className="rounded-full w-14 h-14 ring-2 ring-secondary-500"
        />

        <div className="flex-center flex-col gap-1">
          <p className="base-medium text-light-1 text-center line-clamp-1">
            {user.name}
          </p>
          <p className="small-regular text-light-3 text-center line-clamp-1">
            @{user.username}
          </p>
        </div>
      </Link>

      <FollowButton targetUser={user} />
    </article>
  );
};

export default UserCard;
