import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-black text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Topbar />
        <main className="flex-1 p-5">{children}</main>
      </div>
    </div>
  );
}
