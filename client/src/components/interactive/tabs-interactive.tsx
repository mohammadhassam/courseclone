import React, { useState } from "react";
import { TabContent } from "@shared/schema";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface TabsInteractiveProps {
  tabs: TabContent[];
  className?: string;
}

export function TabsInteractive({ tabs, className }: TabsInteractiveProps) {
  const [activeTab, setActiveTab] = useState(0);

  if (!tabs || tabs.length === 0) {
    return <div className="p-4 text-gray-500">No tab content available</div>;
  }

  return (
    <div className={cn("rounded-lg border bg-card text-card-foreground shadow", className)}>
      <div className="flex overflow-x-auto">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 cursor-pointer flex-shrink-0",
              activeTab === index
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
            )}
          >
            {tab.title}
          </button>
        ))}
      </div>
      <div className="p-6 pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="prose max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: tabs[activeTab].content }}
          />
        </AnimatePresence>
      </div>
    </div>
  );
}