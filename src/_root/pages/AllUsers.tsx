import { ErrorState, Loader, UserCard } from "@/components/shared";
import { useGetUsers } from "@/lib/react-query/queries";

const AllUsers = () => {
  const {
    data: creators,
    isLoading,
    isError: isErrorCreators,
    refetch,
  } = useGetUsers();

  if (isErrorCreators) {
    return (
      <div className="common-container">
        <ErrorState message="Could not load users." onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="common-container">
      <div className="user-container">
        <h2 className="h3-bold md:h2-bold text-left w-full">All Users</h2>
        {isLoading && !creators ? (
          <Loader />
        ) : creators?.documents.length === 0 ? (
          <div className="people-empty">
            <img
              src="/assets/icons/people.svg"
              width={44}
              height={44}
              alt="people"
              className="invert-white opacity-80"
            />
            <h3 className="body-bold text-light-1">No people yet</h3>
            <p className="small-medium text-light-3">
              New Snapgram users will appear here once accounts are created.
            </p>
          </div>
        ) : (
          <ul className="user-grid">
            {creators?.documents.map((creator) => (
              <li key={creator?.$id} className="flex-1 min-w-[200px] w-full  ">
                <UserCard user={creator} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AllUsers;
