import { Outlet } from "react-router-dom";
import Navbar from "@/components/marketplace/Navbar";
import AnnouncementTicker from "@/components/AnnouncementTicker";

export default function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <AnnouncementTicker />
      <Navbar />
      <Outlet />
    </div>
  );
}