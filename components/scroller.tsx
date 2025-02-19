import { ReactNode, useRef, useState, useEffect } from "react";

interface ScrollerProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  visibleItems?: number;
  itemWidth?: number;
  gap?: number;
  className?: string;
}

const Scroller = <T,>({
  items,
  renderItem,
  visibleItems = 3,
  itemWidth = 280,
  gap = 16,
  className = "",
}: ScrollerProps<T>) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScrollButtons = () => {
    if (scrollerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    window.addEventListener("resize", checkScrollButtons);
    return () => window.removeEventListener("resize", checkScrollButtons);
  }, [items]);

  const scroll = (direction: "left" | "right") => {
    if (scrollerRef.current) {
      const scrollAmount =
        direction === "left" ? -itemWidth - gap : itemWidth + gap;
      scrollerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScrollButtons, 300);
    }
  };

  const containerWidth = itemWidth * visibleItems + gap * (visibleItems - 1);

  return (
    <div className={`relative group ${className}`}>
      {/* Left Arrow */}
      {showLeftArrow && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-r-lg p-2 transition-opacity duration-200 opacity-90 hover:opacity-100"
          aria-label="Scroll left"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      )}

      {/* Right Arrow */}
      {showRightArrow && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-l-lg p-2 transition-opacity duration-200 opacity-90 hover:opacity-100"
          aria-label="Scroll right"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      )}

      {/* Scroller Container */}
      <div
        ref={scrollerRef}
        className="overflow-x-auto scrollbar-hide"
        onScroll={checkScrollButtons}
        style={{ width: `${containerWidth}px` }}
      >
        <div
          className="inline-flex"
          style={{
            gap: `${gap}px`,
            paddingLeft: "4px",
            paddingRight: "4px",
          }}
        >
          {items.map((item, index) => (
            <div
              key={index}
              className="flex-shrink-0 "
              style={{ width: `${itemWidth}px` }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Scroller;
