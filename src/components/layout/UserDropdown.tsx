'use client'

import { useAuth } from '@/lib/authProvider'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    } from '@/components/ui/dropdown-menu'
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
    import { LogOut, Settings, User } from 'lucide-react'

export function UserDropdown() {
    const { user, signOut } = useAuth()

    if (!user) return null

    return (
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
                <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                <AvatarFallback>
                {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0)}
                </AvatarFallback>
            </Avatar>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
            <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium">{user.user_metadata?.full_name}</p>
                <p className="w-[200px] truncate text-sm text-muted-foreground">
                {user.email}
                </p>
            </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
            </DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
    )
}