import { ReactNode, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface ScrollerProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  visibleItems?: number;
  gap?: number;
  className?: string;
}

const Scroller = <T,>({
  items,
  renderItem,
  gap = 13,
  className = "",
}: ScrollerProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [totalWidth, setTotalWidth] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      const children = containerRef.current.children;
      let width = 0;
      for (let i = 0; i < children.length; i++) {
        width += children[i].getBoundingClientRect().width + gap;
      }
      setTotalWidth(width - gap); // Remove last gap
    }
  }, [items, gap]);

  const containerWidth =
    containerRef.current?.getBoundingClientRect().width || 400;

  return (
    <div className={`overflow-hidden w-full ${className}`}>
      <motion.div
        ref={containerRef}
        className="flex cursor-grab active:cursor-grabbing"
        drag="x"
        dragConstraints={{
          left: -(totalWidth - containerWidth),
          right: 0,
        }}
        style={{ gap: `${gap}px`, paddingLeft: "4px", paddingRight: "4px" }}
      >
        {items.map((item, index) => (
          <div key={index} className="flex-shrink-0">
            {renderItem(item, index)}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default Scroller;
