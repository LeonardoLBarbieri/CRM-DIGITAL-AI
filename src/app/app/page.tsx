"use client";
import { motion } from "framer-motion";
import { ManagerDashboard } from "@/components/dashboard/ManagerDashboard";

export default function DashboardPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <ManagerDashboard />
    </motion.div>
  );
}
