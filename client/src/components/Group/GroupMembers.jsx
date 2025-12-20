// client/src/components/Group/GroupMembers.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crown, Shield, MoreHorizontal, UserMinus, UserPlus, Search } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useSocket } from '@/context/SocketContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getInitials } from '@/utils/helpers'
import { cn } from '@/lib/utils'

export default function GroupMembers({ 
  members, 
  admins = [], 
  ownerId,
  onAddMember,
  onRemoveMember,
  onMakeAdmin,
  onRemoveAdmin
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const { user } = useAuth()
  const { isUserOnline } = useSocket()

  const isOwner = user?._id === ownerId
  const isAdmin = admins.includes(user?._id)
  const canManageMembers = isOwner || isAdmin

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getMemberRole = (memberId) => {
    if (memberId === ownerId) return 'owner'
    if (admins.includes(memberId)) return 'admin'
    return 'member'
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search members..."
          className="pl-10"
        />
      </div>

      {/* Add Member Button */}
      {canManageMembers && (
        <Button onClick={onAddMember} variant="outline" className="w-full">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Members
        </Button>
      )}

      {/* Members List */}
      <ScrollArea className="h-[300px]">
        <AnimatePresence>
          {filteredMembers.map((member, index) => {
            const role = getMemberRole(member._id)
            const isOnline = isUserOnline(member._id)
            const isSelf = member._id === user?._id

            return (
              <motion.div
                key={member._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {member.name} {isSelf && '(You)'}
                      </span>
                      {role === 'owner' && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                      {role === 'admin' && (
                        <Shield className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground capitalize">{role}</span>
                  </div>
                </div>

                {canManageMembers && !isSelf && role !== 'owner' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isOwner && (
                        <>
                          {role === 'admin' ? (
                            <DropdownMenuItem onClick={() => onRemoveAdmin?.(member._id)}>
                              <Shield className="h-4 w-4 mr-2" />
                              Remove Admin
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => onMakeAdmin?.(member._id)}>
                              <Shield className="h-4 w-4 mr-2" />
                              Make Admin
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem
                        onClick={() => onRemoveMember?.(member._id)}
                        className="text-destructive"
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Remove from Group
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </ScrollArea>
    </div>
  )
}