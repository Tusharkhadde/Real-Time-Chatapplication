// client/src/components/Group/CreateGroup.jsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Camera, X, Loader2 } from 'lucide-react'
import { useChat } from '@/context/ChatContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/utils/helpers'
import toast from 'react-hot-toast'

export default function CreateGroup({ selectedUsers, onClose, onSuccess }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [avatar, setAvatar] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const { createConversation } = useChat()

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatar(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Please enter a group name')
      return
    }

    if (selectedUsers.length < 2) {
      toast.error('Please select at least 2 members')
      return
    }

    setIsLoading(true)
    try {
      const conversation = await createConversation(
        selectedUsers.map(u => u._id),
        true,
        name.trim()
      )
      toast.success('Group created successfully!')
      onSuccess?.(conversation)
      onClose?.()
    } catch (error) {
      toast.error('Failed to create group')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar */}
        <div className="flex justify-center">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarPreview} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {name ? getInitials(name) : <Users className="h-10 w-10" />}
              </AvatarFallback>
            </Avatar>
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
              <Camera className="h-4 w-4 text-primary-foreground" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Group Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter group name"
            disabled={isLoading}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this group about?"
            disabled={isLoading}
          />
        </div>

        {/* Selected Members */}
        <div className="space-y-2">
          <Label>Members ({selectedUsers.length})</Label>
          <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
            {selectedUsers.map(user => (
              <div
                key={user._id}
                className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-full"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="text-xs">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{user.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Group'
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  )
}