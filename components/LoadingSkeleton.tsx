"use client";
import { motion } from "framer-motion";

// ============================================================
// LoadingSkeleton Component
// Shimmer loading effect for cards and charts
// ============================================================

interface LoadingSkeletonProps {
  type?: "card" | "chart" | "sidebar";
  count?: number;
}

export default function LoadingSkeleton({
  type = "card",
  count = 1,
}: LoadingSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          className="relative overflow-hidden p-5 rounded-3xl bg-white/70 backdrop-blur-md border border-white/50 shadow-md"
        >
          {type === "card" && <CardSkeleton />}
          {type === "chart" && <ChartSkeleton />}
          {type === "sidebar" && <SidebarSkeleton />}
        </motion.div>
      ))}
    </>
  );
}

function CardSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <div className="min-w-0 flex-1">
        {/* Title placeholder */}
        <div className="h-3 w-20 bg-slate-200 rounded animate-pulse mb-3" />
        
        {/* Value placeholder */}
        <div className="flex items-baseline gap-1">
          <div className="h-8 w-16 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-8 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>
      
      {/* Icon placeholder */}
      <div className="flex-shrink-0 p-2.5 rounded-2xl bg-slate-200 animate-pulse" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div>
      {/* Title placeholder */}
      <div className="h-5 w-40 bg-slate-200 rounded animate-pulse mb-6" />
      
      {/* Chart area placeholder */}
      <div className="h-[260px] bg-slate-100 rounded-2xl animate-pulse" />
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div>
      {/* Title placeholder */}
      <div className="h-5 w-36 bg-slate-200 rounded animate-pulse mb-6" />
      
      {/* Status items placeholder */}
      <div className="space-y-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
            <div className="h-6 w-20 bg-slate-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
