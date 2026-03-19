import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import ChatWindowLayout from "@/components/chat/ChatWindowLayout";

const ChatAppPage = () => { 
    return(
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="flex flex-col h-screen overflow-hidden">
                <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 bg-background z-10">
                    <SidebarTrigger className="-ml-1" />
                    <div className="font-semibold">ChatApp</div>
                </header>
                <div className="flex-1 overflow-hidden p-2">
                    <ChatWindowLayout />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
};
export default ChatAppPage;