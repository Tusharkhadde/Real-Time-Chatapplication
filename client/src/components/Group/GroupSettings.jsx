// client/src/components/Group/GroupSettings.jsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, Save, Loader2, LogOut, Trash2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { getInitials } from '@/utils/helpers'
import toast from 'react-hot-toast'

export default function GroupSettings({ 
  group, 
  onUpdate, 
  onLeave, 
  onDelete 
}) {
  const [name, setName] = useState(group?.name || '')
  const [description, setDescription] = useState(group?.description || '')
  const [avatar, setAvatar] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(group?.avatar)
  const [notifications, setNotifications] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()

  const isOwner = group?.owner === user?._id
  const isAdmin = group?.admins?.includes(user?._id)
  const canEdit = isOwner || isAdmin

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatar(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Group name is required')
      return
    }

    setIsLoading(true)
    try {
      await onUpdate?.({
        name: name.trim(),
        description: description.trim(),
        avatar
      })
      toast.success('Group updated successfully')
    } catch (error) {
      toast.error('Failed to update group')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLeave = () => {
    if (confirm('Are you sure you want to leave this group?')) {
      onLeave?.()
    }
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      onDelete?.()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Avatar */}
      <div className="flex justify-center">
        <div className="relative">
          <Avatar className="h-24 w-24">
            <AvatarImage src={avatarPreview} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          {canEdit && (
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
              <Camera className="h-4 w-4 text-primary-foreground" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* Group Info */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Group Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter group name"
            disabled={!canEdit || isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this group about?"
            disabled={!canEdit || isLoading}
            rows={3}
          />
        </div>
      </div>

      <Separator />

      {/* Settings */}
      <div className="space-y-4">
        <h3 className="font-medium">Settings</h3>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Notifications</p>
            <p className="text-sm text-muted-foreground">
              Receive notifications from this group
            </p>
          </div>
          <Switch
            checked={notifications}
            onCheckedChange={setNotifications}
          />
        </div>
      </div>

      <Separator />

      {/* Actions */}
      <div className="space-y-3">
        {canEdit && (
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        )}

        <Button
          variant="outline"
          onClick={handleLeave}
          className="w-full text-destructive hover:text-destructive"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Leave Group
        </Button>

        {isOwner && (
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Group
          </Button>
        )}
      </div>
    </motion.div>
  )
}