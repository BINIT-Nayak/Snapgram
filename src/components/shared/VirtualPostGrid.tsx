import { RefObject, useEffect, useMemo, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import { PostDocument } from "@/types";
import GridPostList from "./GridPostList";

type VirtualPostGridProps = {
  posts: PostDocument[];
  scrollRef: RefObject<HTMLElement>;
  priorityFirst?: boolean;
};

const getColumnCount = () => {
  if (typeof window === "undefined") return 1;

  if (window.innerWidth >= 1280) return 3;
  if (window.innerWidth >= 1024) return 2;
  if (window.innerWidth >= 768) return 1;
  if (window.innerWidth >= 640) return 2;

  return 1;
};

const VirtualPostGrid = ({
  posts,
  scrollRef,
  priorityFirst = false,
}: VirtualPostGridProps) => {
  const [columnCount, setColumnCount] = useState(getColumnCount);
  const rowCount = Math.ceil(posts.length / columnCount);
  const rows = useMemo(
    () =>
      Array.from({ length: rowCount }, (_, rowIndex) =>
        posts.slice(rowIndex * columnCount, rowIndex * columnCount + columnCount)
      ),
    [columnCount, posts, rowCount]
  );
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 348,
    overscan: 3,
  });

  useEffect(() => {
    const handleResize = () => setColumnCount(getColumnCount());

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (posts.length === 0) return null;

  return (
    <ul
      className="virtual-grid"
      style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
      {rowVirtualizer.getVirtualItems().map((virtualRow) => (
        <li
          key={virtualRow.key}
          data-index={virtualRow.index}
          ref={rowVirtualizer.measureElement}
          className="virtual-grid_row"
          style={{ transform: `translateY(${virtualRow.start}px)` }}>
          <GridPostList
            posts={rows[virtualRow.index]}
            priorityFirst={priorityFirst && virtualRow.index === 0}
          />
        </li>
      ))}
    </ul>
  );
};

export default VirtualPostGrid;
