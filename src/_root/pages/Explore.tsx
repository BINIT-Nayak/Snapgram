import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

import { Input } from "@/components/ui";
import { DocumentList, PostDocument } from "@/types";
import useDebounce from "@/hooks/useDebounce";
import { ErrorState, GridPostList, Loader } from "@/components/shared";
import { useGetPosts, useSearchPosts } from "@/lib/react-query/queries";

type ExploreFilter = "all" | "liked" | "latest";

export type SearchResultProps = {
  isSearchError: boolean;
  isSearchFetching: boolean;
  onRetry: () => void;
  searchedPosts?: DocumentList<PostDocument>;
};

const SearchResults = ({
  isSearchError,
  isSearchFetching,
  onRetry,
  searchedPosts,
}: SearchResultProps) => {
  if (isSearchFetching) {
    return <Loader />;
  } else if (isSearchError) {
    return (
      <ErrorState
        message="Could not search posts right now."
        onRetry={onRetry}
      />
    );
  } else if (searchedPosts && searchedPosts.documents.length > 0) {
    return <GridPostList posts={searchedPosts.documents} />;
  } else {
    return (
      <p className="text-light-4 mt-10 text-center w-full">No results found</p>
    );
  }
};

const Explore = () => {
  const { ref, inView } = useInView();
  const {
    data: posts,
    fetchNextPage,
    hasNextPage,
    isError: isPostsError,
    isFetchingNextPage,
    refetch: refetchPosts,
  } = useGetPosts();

  const [searchValue, setSearchValue] = useState("");
  const [activeFilter, setActiveFilter] = useState<ExploreFilter>("all");
  const debouncedSearch = useDebounce(searchValue, 500);
  const {
    data: searchedPosts,
    isError: isSearchError,
    isFetching: isSearchFetching,
    refetch: refetchSearch,
  } = useSearchPosts(debouncedSearch);

  useEffect(() => {
    if (inView && !searchValue && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, inView, isFetchingNextPage, searchValue]);

  if (!posts && !isPostsError)
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );

  if (isPostsError) {
    return (
      <div className="explore-container">
        <ErrorState
          message="Could not load explore posts."
          onRetry={() => refetchPosts()}
        />
      </div>
    );
  }

  const shouldShowSearchResults = searchValue !== "";
  const allPosts = Array.from(
    new Map(
      posts?.pages
        .flatMap((item) => item.documents)
        .map((post) => [post.$id, post]) || []
    ).values()
  );
  const visiblePosts = [...allPosts].sort((firstPost, secondPost) => {
    if (activeFilter === "liked") {
      return (secondPost.likes?.length || 0) - (firstPost.likes?.length || 0);
    }

    return (
      new Date(secondPost.$createdAt).getTime() -
      new Date(firstPost.$createdAt).getTime()
    );
  });
  const shouldShowPosts =
    !shouldShowSearchResults && visiblePosts.length === 0;

  return (
    <div className="explore-container">
      <div className="explore-inner_container">
        <h2 className="h3-bold md:h2-bold w-full">Search Posts</h2>
        <div className="explore-searchbar">
          <img
            src="/assets/icons/search.svg"
            width={24}
            height={24}
            alt="search"
          />
          <Input
            type="text"
            placeholder="Search for captions..."
            className="explore-search"
            value={searchValue}
            onChange={(e) => {
              const { value } = e.target;
              setSearchValue(value);
            }}
          />
          {searchValue && (
            <button
              type="button"
              aria-label="Clear search"
              className="explore-clear_btn"
              onClick={() => setSearchValue("")}>
              ×
            </button>
          )}
        </div>
      </div>

      <div className="flex-between w-full max-w-5xl mt-16 mb-7">
        <h3 className="body-bold md:h3-bold">Popular Today</h3>

        <div className="explore-filter_group">
          {[
            { label: "All", value: "all" },
            { label: "Most liked", value: "liked" },
            { label: "Latest", value: "latest" },
          ].map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={`explore-filter_btn ${
                activeFilter === filter.value ? "explore-filter_btn-active" : ""
              }`}
              onClick={() => setActiveFilter(filter.value as ExploreFilter)}>
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-9 w-full max-w-5xl">
        {shouldShowSearchResults ? (
          <SearchResults
            isSearchError={isSearchError}
            isSearchFetching={isSearchFetching}
            onRetry={() => refetchSearch()}
            searchedPosts={searchedPosts}
          />
        ) : shouldShowPosts ? (
          <p className="text-light-4 mt-10 text-center w-full">End of posts</p>
        ) : (
          <GridPostList posts={visiblePosts} />
        )}
      </div>

      {hasNextPage && !searchValue && (
        <div ref={ref} className="mt-10">
          {isFetchingNextPage && <Loader />}
        </div>
      )}
    </div>
  );
};

export default Explore;
