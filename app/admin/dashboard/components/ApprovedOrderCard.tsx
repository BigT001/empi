"use client";

import { Mail, Phone, Calendar, Clock, FileText, MessageCircle, Play } from "lucide-react";
import type { CustomOrder } from "../CustomOrdersPanel";

interface ApprovedOrderCardProps {
  order: CustomOrder;
  onChatClick: (orderId: string) => void;
  onStartProduction?: (orderId: string) => void;
}

export function ApprovedOrderCard({ order, onChatClick, onStartProduction }: ApprovedOrderCardProps) {
  // ApprovedOrderCard removed — approved/completed cards are no longer shown.
  return null;
}
