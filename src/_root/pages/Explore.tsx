import {
  type KeyboardEvent,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useInView } from "react-intersection-observer";
import { Link, useLocation, useSearchParams } from "react-router-dom";

import { Input } from "@/components/ui";
import {
  ExploreSearchType,
  SnapgramSearchResults,
} from "@/types";
import useDebounce from "@/hooks/useDebounce";
import {
  ErrorState,
  GridPostList,
  Loader,
  VirtualPostGrid,
} from "@/components/shared";
import {
  useGetMostLikedPosts,
  useGetPosts,
  useSearchSnapgram,
} from "@/lib/react-query/queries";

type ExploreFilter = "all" | "liked" | "latest";

export type SearchResultProps = {
  activeType: ExploreSearchType;
  isSearchError: boolean;
  isSearchFetching: boolean;
  onRetry: () => void;
  resultRef: RefObject<HTMLDivElement>;
  searchResults?: SnapgramSearchResults;
};

const SearchResults = ({
  activeType,
  isSearchError,
  isSearchFetching,
  onRetry,
  resultRef,
  searchResults,
}: SearchResultProps) => {
  const posts = searchResults?.posts.documents || [];
  const people = searchResults?.people.documents || [];
  const tags = searchResults?.tags || [];
  const locations = searchResults?.locations || [];
  const hasResults =
    posts.length > 0 ||
    people.length > 0 ||
    tags.length > 0 ||
    locations.length > 0;

  if (isSearchFetching) {
    return <Loader />;
  } else if (isSearchError) {
    return (
      <ErrorState
        message="Could not search posts right now."
        onRetry={onRetry}
      />
    );
  } else if (!hasResults) {
    return (
      <p className="text-light-4 mt-10 text-center w-full">No results found</p>
    );
  }

  const showPosts = activeType === "all" || activeType === "posts";
  const showPeople = activeType === "all" || activeType === "people";
  const showTags = activeType === "all" || activeType === "tags";
  const showLocations = activeType === "all" || activeType === "locations";

  return (
    <div ref={resultRef} className="search-results">
      {showPosts && posts.length > 0 && (
        <section className="search-result_section">
          <h3 className="body-bold text-light-1">Posts</h3>
          <GridPostList posts={posts} />
        </section>
      )}

      {showPeople && people.length > 0 && (
        <section className="search-result_section">
          <h3 className="body-bold text-light-1">People</h3>
          <ul className="search-result_list">
            {people.map((person) => (
              <li key={person.$id}>
                <Link to={`/profile/${person.$id}`} className="search-person">
                  <img
                    src={person.imageUrl || "/assets/icons/profile-placeholder.svg"}
                    alt="profile"
                    className="h-11 w-11 rounded-full object-cover ring-2 ring-primary-500"
                  />
                  <div className="min-w-0">
                    <p className="base-semibold text-light-1 line-clamp-1">
                      {person.name}
                    </p>
                    <p className="small-regular text-light-3 line-clamp-1">
                      @{person.username}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {showTags && tags.length > 0 && (
        <section className="search-result_section">
          <h3 className="body-bold text-light-1">Tags</h3>
          <ul className="search-chip_grid">
            {tags.map((tag) => (
              <li key={tag.tag}>
                <Link
                  to={`/explore?q=${encodeURIComponent(tag.tag)}&type=posts`}
                  className="search-chip">
                  <span>#{tag.tag}</span>
                  <span>{tag.postCount} posts</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {showLocations && locations.length > 0 && (
        <section className="search-result_section">
          <h3 className="body-bold text-light-1">Locations</h3>
          <ul className="search-chip_grid">
            {locations.map((location) => (
              <li key={location.location}>
                <Link
                  to={`/explore?q=${encodeURIComponent(
                    location.location
                  )}&type=posts`}
                  className="search-chip">
                  <span>{location.location}</span>
                  <span>{location.postCount} posts</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

const searchTabs: Array<{ label: string; value: ExploreSearchType }> = [
  { label: "All", value: "all" },
  { label: "Posts", value: "posts" },
  { label: "People", value: "people" },
  { label: "Tags", value: "tags" },
  { label: "Locations", value: "locations" },
];

const getInitialSearchType = (type?: string | null): ExploreSearchType => {
  if (
    type === "posts" ||
    type === "people" ||
    type === "tags" ||
    type === "locations"
  ) {
    return type;
  }

  return "all";
};

const getRecentSearches = () => {
  if (typeof window === "undefined") return [];

  try {
    return JSON.parse(window.localStorage.getItem("snapgram.searches") || "[]");
  } catch {
    return [];
  }
};

const Explore = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const { ref, inView } = useInView();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    data: posts,
    fetchNextPage,
    hasNextPage,
    isError: isPostsError,
    isFetchingNextPage,
    refetch: refetchPosts,
  } = useGetPosts();

  const [searchValue, setSearchValue] = useState(searchParams.get("q") || "");
  const [activeSearchType, setActiveSearchType] = useState<ExploreSearchType>(
    getInitialSearchType(searchParams.get("type"))
  );
  const [recentSearches, setRecentSearches] = useState<string[]>(
    getRecentSearches
  );
  const [activeFilter, setActiveFilter] = useState<ExploreFilter>("all");
  const debouncedSearch = useDebounce(searchValue, 500);
  const {
    data: searchResults,
    isError: isSearchError,
    isFetching: isSearchFetching,
    refetch: refetchSearch,
  } = useSearchSnapgram(debouncedSearch);
  const {
    data: mostLikedPostPages,
    fetchNextPage: fetchNextMostLikedPage,
    hasNextPage: hasNextMostLikedPage,
    isLoading: isMostLikedLoading,
    isError: isMostLikedError,
    isFetchingNextPage: isFetchingNextMostLikedPage,
    refetch: refetchMostLikedPosts,
  } = useGetMostLikedPosts(activeFilter === "liked" && !searchValue);

  useEffect(() => {
    const latestParams = new URLSearchParams(location.search);
    const queryParam = latestParams.get("q") || "";
    const typeParam = getInitialSearchType(latestParams.get("type"));

    setSearchValue((currentSearch) =>
      currentSearch === queryParam ? currentSearch : queryParam
    );
    setActiveSearchType((currentType) =>
      currentType === typeParam ? currentType : typeParam
    );
  }, [location.search]);

  useEffect(() => {
    const trimmedSearch = debouncedSearch.trim();

    setSearchParams(
      (params) => {
        const nextParams = new URLSearchParams(params);

        if (trimmedSearch) {
          nextParams.set("q", trimmedSearch);
          nextParams.set("type", activeSearchType);
        } else {
          nextParams.delete("q");
          nextParams.delete("type");
        }

        return nextParams;
      },
      { replace: true }
    );

    if (!trimmedSearch || typeof window === "undefined") return;

    setRecentSearches((currentSearches) => {
      const nextRecentSearches = [
        trimmedSearch,
        ...currentSearches.filter((search) => search !== trimmedSearch),
      ].slice(0, 5);

      window.localStorage.setItem(
        "snapgram.searches",
        JSON.stringify(nextRecentSearches)
      );

      return nextRecentSearches;
    });
  }, [activeSearchType, debouncedSearch, setSearchParams]);

  useEffect(() => {
    if (
      inView &&
      !searchValue &&
      activeFilter === "liked" &&
      hasNextMostLikedPage &&
      !isFetchingNextMostLikedPage
    ) {
      fetchNextMostLikedPage();
    }

    if (
      inView &&
      !searchValue &&
      activeFilter !== "liked" &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    activeFilter,
    fetchNextPage,
    fetchNextMostLikedPage,
    hasNextPage,
    hasNextMostLikedPage,
    inView,
    isFetchingNextPage,
    isFetchingNextMostLikedPage,
    searchValue,
  ]);

  const shouldShowSearchResults = searchValue.trim() !== "";
  const visibleSearchTabs = useMemo(
    () =>
      searchTabs.map((tab) => ({
        ...tab,
        count:
          tab.value === "all"
            ? (searchResults?.posts.documents.length || 0) +
              (searchResults?.people.documents.length || 0) +
              (searchResults?.tags.length || 0) +
              (searchResults?.locations.length || 0)
            : tab.value === "posts"
              ? searchResults?.posts.documents.length || 0
              : tab.value === "people"
                ? searchResults?.people.documents.length || 0
                : tab.value === "tags"
                  ? searchResults?.tags.length || 0
                  : searchResults?.locations.length || 0,
      })),
    [searchResults]
  );
  const allPosts = Array.from(
    new Map(
      posts?.pages
        .flatMap((item) => item.documents)
        .map((post) => [post.$id, post]) || []
    ).values()
  );
  const visiblePosts = [...allPosts].sort((firstPost, secondPost) => {
    return (
      new Date(secondPost.$createdAt).getTime() -
      new Date(firstPost.$createdAt).getTime()
    );
  });
  const mostLikedPosts = Array.from(
    new Map(
      mostLikedPostPages?.pages
        .flatMap((item) => item.documents)
        .map((post) => [post.$id, post]) || []
    ).values()
  );
  const postsToRender =
    activeFilter === "liked" ? mostLikedPosts : visiblePosts;
  const shouldShowPosts =
    !shouldShowSearchResults && postsToRender.length === 0;

  if (!shouldShowSearchResults && !posts && !isPostsError)
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );

  if (!shouldShowSearchResults && isPostsError) {
    return (
      <div className="explore-container" ref={scrollRef}>
        <ErrorState
          message="Could not load explore posts."
          onRetry={() => refetchPosts()}
        />
      </div>
    );
  }

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setSearchValue("");
      return;
    }

    if (event.key === "ArrowDown") {
      searchResultsRef.current
        ?.querySelector<HTMLAnchorElement>("a,button")
        ?.focus();
    }
  };

  const handleSearchTypeChange = (type: ExploreSearchType) => {
    setActiveSearchType(type);
    setSearchParams((params) => {
      const nextParams = new URLSearchParams(params);

      if (searchValue.trim()) {
        nextParams.set("q", searchValue.trim());
        nextParams.set("type", type);
      }

      return nextParams;
    });
  };

  return (
    <div className="explore-container" ref={scrollRef}>
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
            placeholder="Search posts, people, tags, locations..."
            className="explore-search"
            value={searchValue}
            onChange={(e) => {
              const { value } = e.target;
              setSearchValue(value);
            }}
            onKeyDown={handleSearchKeyDown}
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

      {shouldShowSearchResults && recentSearches.length > 0 && (
        <div className="recent-searches">
          {recentSearches.map((search) => (
            <button
              key={search}
              type="button"
              className="recent-search_btn"
              onClick={() => setSearchValue(search)}>
              {search}
            </button>
          ))}
        </div>
      )}

      <div className="flex-between w-full max-w-5xl mt-16 mb-7">
        <h3 className="body-bold md:h3-bold">
          {shouldShowSearchResults ? "Search Results" : "Popular Today"}
        </h3>

        {shouldShowSearchResults ? (
          <div className="explore-filter_group">
            {visibleSearchTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={`explore-filter_btn ${
                  activeSearchType === tab.value
                    ? "explore-filter_btn-active"
                    : ""
                }`}
                onClick={() => handleSearchTypeChange(tab.value)}>
                {tab.label}
                {tab.count > 0 && <span className="ml-1">({tab.count})</span>}
              </button>
            ))}
          </div>
        ) : (
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
                  activeFilter === filter.value
                    ? "explore-filter_btn-active"
                    : ""
                }`}
                onClick={() => setActiveFilter(filter.value as ExploreFilter)}>
                {filter.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-9 w-full max-w-5xl">
        {shouldShowSearchResults ? (
          <SearchResults
            activeType={activeSearchType}
            isSearchError={isSearchError}
            isSearchFetching={isSearchFetching}
            onRetry={() => refetchSearch()}
            resultRef={searchResultsRef}
            searchResults={searchResults}
          />
        ) : activeFilter === "liked" && isMostLikedLoading ? (
          <Loader />
        ) : activeFilter === "liked" && isMostLikedError ? (
          <ErrorState
            message="Could not load most liked posts."
            onRetry={() => refetchMostLikedPosts()}
          />
        ) : shouldShowPosts ? (
          <p className="text-light-4 mt-10 text-center w-full">End of posts</p>
        ) : (
          <VirtualPostGrid
            posts={postsToRender}
            scrollRef={scrollRef}
            priorityFirst
          />
        )}
      </div>

      {!searchValue && activeFilter === "liked" && hasNextMostLikedPage && (
        <div ref={ref} className="mt-10">
          {isFetchingNextMostLikedPage && <Loader />}
        </div>
      )}

      {!searchValue && activeFilter !== "liked" && hasNextPage && (
        <div ref={ref} className="mt-10">
          {isFetchingNextPage && <Loader />}
        </div>
      )}
    </div>
  );
};

export default Explore;
