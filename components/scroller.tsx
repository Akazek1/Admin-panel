import { ReactNode } from "react";
import { motion } from "framer-motion";

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
  const containerWidth = itemWidth * visibleItems + gap * (visibleItems - 1);

  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{ width: `${containerWidth}px` }}
    >
      {/* Draggable Scrollable Container */}
      <motion.div
        className="flex cursor-grab active:cursor-grabbing"
        drag="x"
        dragConstraints={{
          left: -(items.length * (itemWidth + gap) - containerWidth),
          right: 0,
        }}
        style={{ gap: `${gap}px`, paddingLeft: "4px", paddingRight: "4px" }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className="flex-shrink-0"
            style={{ width: `${itemWidth}px` }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default Scroller;
