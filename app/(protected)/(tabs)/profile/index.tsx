import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, Image, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ScreenContainer,
  InitialAvatar,
<<<<<<< HEAD
  SkeletonProfile,
=======
  Loader,
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
  EmptyState,
  Button,
  DatePickerModal,
  PressableScale,
  Reveal,
  useFeedback,
} from '@/components'
import { useAuth } from '@/hooks/useAuth'
import { useAppDispatch } from '@/provider/hooks'
import { setUser } from '@/provider/slices/authSlice'
import { profileService } from '@/api'
import { employeePicUrl, takeProfilePhoto, pickProfilePhoto, type ImagePickResult } from '@/helpers'
import type { ProfileResponse, ProfileUpdatePayload } from '@/api/types'

const BRAND = '#13A07C'
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const GENDERS = ['Male', 'Female'] as const

/** Capitalize the first letter so values like "male" display as "Male". */
const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s)

type IoniconName = keyof typeof Ionicons.glyphMap

/**
 * Profile — employee details from the Profile GET API.
 *
 * Read-only display (Figma "My Profile"): a centered header, an avatar with an
 * upload/remove control, and Employee / Contact / Personal information cards.
 * "Update Profile" flips the screen into an inline edit mode that saves changes
 * via POST /profile/update.
 *
 * GET /profile (Bearer auth). Maps { profile, manager } into the view. While the
 * backend is unreachable it falls back to the cached signed-in user so the
 * screen stays usable; 401 signs the user out, 404 shows "profile not found".
 */
export default function ProfileScreen() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()
  const { toast, confirm, sheet } = useFeedback()

  const query = useQuery({
    queryKey: ['profile'],
    queryFn: ({ signal }) => profileService.getProfile(signal),
    retry: false,
  })

  const status: number | undefined = (query.error as any)?.response?.status

  // 401 — token missing/invalid: clear the session and return to login.
  useEffect(() => {
    if (status === 401) {
      signOut().then(() => router.replace('/login'))
    }
  }, [status, signOut, router])

  // Real profile data only — from GET /profile. No static fallback.
  const data = query.data

  // Editable fields, seeded from the resolved profile.
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ fname: '', lname: '', phone: '', dob: '', gender: '', address: '' })
  const seedForm = (p: ProfileResponse['profile']) =>
    setForm({ fname: p.fname, lname: p.lname, phone: p.phone, dob: p.dob, gender: capitalize(p.gender), address: p.address })
  useEffect(() => {
    if (data?.profile) seedForm(data.profile)
<<<<<<< HEAD
=======
    // eslint-disable-next-line react-hooks/exhaustive-deps
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
  }, [data?.profile])

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  // Date-picker + locally-picked (pre-upload) photo preview.
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  // Merge an updated profile (from the text update) into the cache + redux so
  // this screen and the dashboard greeting stay in sync.
  const applyProfile = (profile: ProfileResponse['profile']) => {
    queryClient.setQueryData<ProfileResponse>(['profile'], (old) =>
      old ? { ...old, profile } : { status: true, profile, manager: data?.manager ?? null }
    )
    dispatch(
      setUser(
        user
          ? {
              ...user,
              name: profile.full_name,
              phone_number: profile.phone,
              profile_image_url: employeePicUrl(profile.profile_picture),
            }
          : user
      )
    )
  }

  // Patch only the picture (filename + url) into the cache + redux. `filename`
  // is null when the photo was removed.
  const applyPicture = (filename: string | null, url?: string) => {
    queryClient.setQueryData<ProfileResponse>(['profile'], (old) =>
      old?.profile ? { ...old, profile: { ...old.profile, profile_picture: filename } } : old
    )
    dispatch(setUser(user ? { ...user, profile_image_url: url || employeePicUrl(filename) } : user))
  }

  const handleAuthError = (err: any): boolean => {
    if (err?.response?.status === 401) {
      signOut().then(() => router.replace('/login'))
      return true
    }
    return false
  }

  const updateMutation = useMutation({
    mutationFn: (payload: ProfileUpdatePayload) => profileService.updateProfile(payload),
    onSuccess: (res) => {
      applyProfile(res.profile)
      setEditing(false)
      toast.success(res.message || 'Your profile has been updated.')
    },
    onError: (err: any) => {
      if (handleAuthError(err)) return
      const msg =
        err?.response?.data?.message ||
        (err?.response?.status === 422
          ? 'Please check your details — a valid name and date of birth are required.'
          : 'Could not update your profile. Please try again.')
      toast.error(msg)
    },
  })

  const pictureMutation = useMutation({
    mutationFn: (uri: string) => profileService.uploadProfilePicture(uri),
    onSuccess: (res) => {
      setPhotoPreview(null)
      if (res.profile) applyProfile(res.profile)
      else applyPicture(res.profile_picture || null, res.profile_picture_url || undefined)
      toast.success(res.message || 'Your profile picture has been updated.')
    },
    onError: (err: any) => {
      setPhotoPreview(null)
      if (handleAuthError(err)) return
      const msg =
        err?.response?.status === 422
          ? err?.response?.data?.message ||
            'Please use a square image (JPG, PNG, WebP or GIF) under 5 MB.'
          : err?.response?.data?.message || 'Could not upload your picture. Please try again.'
      toast.error(msg)
    },
  })

  const removeMutation = useMutation({
    mutationFn: () => profileService.removeProfilePicture(),
    onSuccess: (res) => {
      applyPicture(null, undefined)
      toast.success(res.message || 'Your profile picture has been removed.')
    },
    onError: (err: any) => {
      if (handleAuthError(err)) return
      toast.error(err?.response?.data?.message || 'Could not remove your picture. Please try again.')
    },
  })

  const photoBusy = pictureMutation.isPending || removeMutation.isPending

  const onPhotoResult = (result: ImagePickResult) => {
    if (result.status === 'denied') {
      toast.error('Please allow camera and photo access in Settings to change your picture.')
      return
    }
    if (result.status === 'canceled') return
    setPhotoPreview(result.uri)
    pictureMutation.mutate(result.uri)
  }

  const handleChangePhoto = async (hasPhoto: boolean) => {
    if (photoBusy) return
    const options = [
      { label: 'Take Photo', icon: 'camera-outline' as IoniconName },
      { label: 'Choose from Library', icon: 'image-outline' as IoniconName },
      ...(hasPhoto ? [{ label: 'Remove Photo', icon: 'trash-outline' as IoniconName, destructive: true }] : []),
    ]
    const choice = await sheet({
      title: 'Profile Picture',
      message: 'Take a new photo, choose one from your library, or remove the current picture.',
      options,
    })
    if (choice === 0) onPhotoResult(await takeProfilePhoto())
    else if (choice === 1) onPhotoResult(await pickProfilePhoto())
    else if (choice === 2 && hasPhoto) removeMutation.mutate()
  }

  const handleSelectGender = async () => {
    const choice = await sheet({
      title: 'Gender',
      message: 'Select your gender.',
      options: GENDERS.map((g) => ({ label: g })),
    })
    if (typeof choice === 'number' && GENDERS[choice]) {
      setForm((f) => ({ ...f, gender: GENDERS[choice] }))
    }
  }

  const handleUpdate = () => {
    if (!data?.profile) return

    // Diff the editable fields against the loaded profile — send only changes.
    const orig = data.profile
    const payload: ProfileUpdatePayload = {}
    if (form.fname.trim() !== orig.fname) payload.fname = form.fname.trim()
    if (form.lname.trim() !== orig.lname) payload.lname = form.lname.trim()
    if (form.phone.trim() !== orig.phone) payload.phone = form.phone.trim()
    if (form.address.trim() !== orig.address) payload.address = form.address.trim()
    if (form.gender.trim() !== orig.gender) payload.gender = form.gender.trim()
    if (form.dob.trim() !== orig.dob) payload.dob = form.dob.trim()

    if (Object.keys(payload).length === 0) {
      toast.info('You haven’t changed anything yet.')
      return
    }
    // Client-side guards mirroring the API's 422 rules.
    if ('fname' in payload && !payload.fname) return toast.error('First name cannot be empty.')
    if ('lname' in payload && !payload.lname) return toast.error('Last name cannot be empty.')
    if ('dob' in payload && payload.dob && !ISO_DATE.test(payload.dob)) {
      return toast.error('Date of birth must be a valid date.')
    }

    updateMutation.mutate(payload)
  }

  const handleCancelEdit = () => {
    if (data?.profile) seedForm(data.profile)
    setEditing(false)
  }

  const handleSignOut = () => {
    confirm({
      title: 'Log Out?',
      message: 'Are you sure you want to log out of Employee Zone?',
      icon: 'log-out-outline',
      confirmText: 'Log Out',
      cancelText: 'Cancel',
      onConfirm: async () => {
        await signOut()
        router.replace('/login')
      },
    })
  }

<<<<<<< HEAD
  const handleBack = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/(protected)/(tabs)/dashboard')
  }

=======
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
  const handleMenu = async () => {
    const choice = await sheet({
      title: 'My Profile',
      options: [
        { label: 'Edit Profile', icon: 'create-outline' },
        { label: 'Log Out', icon: 'log-out-outline', destructive: true },
      ],
    })
    if (choice === 0) setEditing(true)
    else if (choice === 1) handleSignOut()
  }

  // --- States ---------------------------------------------------------------
  if (status === 401 || (query.isLoading && !data)) {
    return (
<<<<<<< HEAD
      <ScreenContainer edges={['top']}>
        <SkeletonProfile />
=======
      <ScreenContainer>
        <Loader />
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
      </ScreenContainer>
    )
  }

  if (status === 404 || !data) {
    return (
      <ScreenContainer edges={['top']}>
        <EmptyState
          icon="person-circle-outline"
          title={status === 404 ? 'Profile not found' : 'Could not load profile'}
          subtitle={
            status === 404
              ? "We couldn't find your profile. Please contact HR if this persists."
              : 'Something went wrong while loading your profile.'
          }
        />
        <View style={{ paddingHorizontal: 20 }}>
          <Button title="Retry" variant="outline" onPress={() => query.refetch()} />
        </View>
      </ScreenContainer>
    )
  }

  const p = data.profile
  const manager = data.manager
  const avatarUri = photoPreview ?? employeePicUrl(p.profile_picture)
  const hasPhoto = !!p.profile_picture

  return (
    <ScreenContainer edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          editing ? undefined : (
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor="#13A07C"
              colors={['#13A07C']}
            />
          )
        }
      >
        {/* Header — centered "Account / My Profile" with a menu button */}
        <Reveal index={0}>
          <View style={styles.header}>
<<<<<<< HEAD
            <PressableScale style={styles.backBtn} onPress={handleBack} activeScale={0.9} hitSlop={6}>
              <Ionicons name="chevron-back" size={20} color="#1B2233" />
            </PressableScale>
=======
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43
            <View style={styles.headerCenter}>
              <Text style={styles.kicker}>Account</Text>
              <Text style={styles.title}>My Profile</Text>
            </View>
            <PressableScale style={styles.menuBtn} onPress={handleMenu} activeScale={0.9} hitSlop={6}>
              <Ionicons name="ellipsis-vertical" size={18} color="#1B2233" />
            </PressableScale>
          </View>
        </Reveal>

        {/* Avatar + identity */}
        <Reveal index={1} style={styles.identity}>
          <PressableScale style={styles.avatarWrap} onPress={() => handleChangePhoto(hasPhoto)} disabled={photoBusy} activeScale={0.93}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
            ) : (
              <InitialAvatar name={p.full_name || `${form.fname} ${form.lname}`} size={120} />
            )}
            {photoBusy && (
              <View style={styles.avatarUploading}>
                <ActivityIndicator color="#FFFFFF" />
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </PressableScale>

          <Text style={styles.name}>{p.full_name}</Text>
          {!!p.designation && <Text style={styles.role}>{p.designation}</Text>}

          <PressableScale style={styles.uploadBtn} onPress={() => handleChangePhoto(hasPhoto)} disabled={photoBusy}>
            <Ionicons name="camera" size={18} color="#FFFFFF" />
            <Text style={styles.uploadBtnText}>{hasPhoto ? 'Change Profile Picture' : 'Upload Profile Picture'}</Text>
          </PressableScale>
        </Reveal>

        {editing ? (
          /* ----------------------------- EDIT MODE ----------------------------- */
          <Reveal index={2} style={styles.sectionCard}>
            <SectionHeader accent={BRAND} title="Edit Details" />
            <Field label="First Name" required icon="people-outline" value={form.fname} onChangeText={set('fname')} />
            <Field label="Last Name" required icon="people-outline" value={form.lname} onChangeText={set('lname')} />
            <Field label="Email" required icon="mail-outline" value={p.email} editable={false} />
            <Field
              label="Mobile Number"
              required
              icon="call-outline"
              value={form.phone}
              onChangeText={set('phone')}
              keyboardType="phone-pad"
            />
            <Field label="Emp ID" required icon="person-outline" value={p.emp_id} editable={false} />
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>
                Date of Birth<Text style={styles.req}> *</Text>
              </Text>
              <Pressable style={styles.inputRow} onPress={() => setShowDatePicker(true)}>
                <Ionicons name="calendar-outline" size={18} color={BRAND} style={styles.inputIcon} />
                <Text style={[styles.input, !form.dob && styles.inputPlaceholder]}>{form.dob || 'YYYY-MM-DD'}</Text>
                <Ionicons name="chevron-down" size={18} color="#9AA1AD" />
              </Pressable>
            </View>
            <Field label="Designation" required icon="school-outline" value={p.designation} editable={false} />
            <Field
              label="Assigned Manager"
              required
              icon="school-outline"
              value={manager ? manager.name : 'Not assigned'}
              editable={false}
            />
            <Field label="Joining Date" required icon="calendar-outline" value={p.join_date} editable={false} />
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>
                Gender<Text style={styles.req}> *</Text>
              </Text>
              <Pressable style={styles.inputRow} onPress={handleSelectGender}>
                <Ionicons name="person-outline" size={18} color={BRAND} style={styles.inputIcon} />
                <Text style={[styles.input, !form.gender && styles.inputPlaceholder]}>
                  {form.gender || 'Select gender'}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#9AA1AD" />
              </Pressable>
            </View>
            <Field label="Address" required icon="location-outline" value={form.address} onChangeText={set('address')} />

            <View style={styles.editActions}>
              <PressableScale style={styles.cancelBtn} onPress={handleCancelEdit} disabled={updateMutation.isPending}>
                <Text style={styles.cancelText}>Cancel</Text>
              </PressableScale>
              <PressableScale
                style={[styles.saveBtn, updateMutation.isPending && styles.btnDisabled]}
                onPress={handleUpdate}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveText}>Save Changes</Text>
                )}
              </PressableScale>
            </View>
          </Reveal>
        ) : (
          /* ---------------------------- DISPLAY MODE --------------------------- */
          <>
            <Reveal index={2} style={styles.sectionCard}>
              <SectionHeader accent={BRAND} title="Employee Information" />
              <InfoRow icon="card-outline" color="#2F80ED" label="Emp ID" value={p.emp_id} first />
              <InfoRow icon="briefcase-outline" color={BRAND} label="Designation" value={p.designation} />
              <InfoRow icon="calendar-outline" color="#2F80ED" label="Joining Date" value={p.join_date} />
              <InfoRow
                icon="people-outline"
                color="#6FCF97"
                label="Assigned Manager"
                value={manager ? manager.name : 'Not assigned'}
              />
            </Reveal>

            <Reveal index={3} style={styles.sectionCard}>
              <SectionHeader accent="#2F80ED" title="Contact Information" />
              <InfoRow icon="mail-outline" color="#EB5C5C" label="Email" value={p.email} first />
              <InfoRow icon="call-outline" color={BRAND} label="Mobile Number" value={p.phone} />
            </Reveal>

            <Reveal index={4} style={styles.sectionCard}>
              <SectionHeader accent="#9B51E0" title="Personal Information" />
              <InfoRow icon="person-outline" color="#2F80ED" label="First Name" value={p.fname} first />
              <InfoRow icon="person-outline" color="#9B51E0" label="Last Name" value={p.lname} />
              <InfoRow icon="male-female-outline" color="#EB5C8E" label="Gender" value={capitalize(p.gender)} />
              <InfoRow icon="calendar-clear-outline" color="#2F80ED" label="Date of Birth" value={p.dob} />
              <InfoRow icon="location-outline" color="#F2994A" label="Address" value={p.address} />
            </Reveal>

            <Reveal index={5}>
              <PressableScale style={styles.updateBtn} onPress={() => setEditing(true)}>
                <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                <Text style={styles.updateText}>Update Profile</Text>
              </PressableScale>

              <PressableScale style={styles.logoutBtn} onPress={handleSignOut} activeScale={0.97}>
                <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                <Text style={styles.logoutText}>Logout</Text>
              </PressableScale>
            </Reveal>
          </>
        )}
      </ScrollView>

      <DatePickerModal
        visible={showDatePicker}
        value={form.dob}
        title="Date of Birth"
        onClose={() => setShowDatePicker(false)}
        onConfirm={(date) => {
          setForm((f) => ({ ...f, dob: date }))
          setShowDatePicker(false)
        }}
      />
    </ScreenContainer>
  )
}

/* -------------------------------------------------------------------------- */
/* Display helpers                                                            */
/* -------------------------------------------------------------------------- */

const SectionHeader: React.FC<{ accent: string; title: string }> = ({ accent, title }) => (
  <View style={styles.sectionHead}>
    <View style={[styles.accentBar, { backgroundColor: accent }]} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
)

const InfoRow: React.FC<{
  icon: IoniconName
  color: string
  label: string
  value?: string
  first?: boolean
}> = ({ icon, color, label, value, first }) => (
  <View style={[styles.infoRow, !first && styles.infoDivider]}>
    <View style={[styles.infoIcon, { backgroundColor: `${color}1A` }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <View style={styles.infoText}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value || '—'}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color="#CBD2DB" />
  </View>
)

/* -------------------------------------------------------------------------- */
/* Labeled input (edit mode)                                                  */
/* -------------------------------------------------------------------------- */

interface FieldProps extends React.ComponentProps<typeof TextInput> {
  label: string
  required?: boolean
  icon: IoniconName
}

const Field: React.FC<FieldProps> = ({ label, required, icon, editable = true, ...rest }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.label}>
      {label}
      {required ? <Text style={styles.req}> *</Text> : null}
    </Text>
    <View style={[styles.inputRow, !editable && styles.inputRowDisabled]}>
      <Ionicons name={icon} size={18} color="#9AA1AD" style={styles.inputIcon} />
      <TextInput
        style={[styles.input, !editable && styles.inputDisabled]}
        editable={editable}
        placeholderTextColor="#9AA1AD"
        {...rest}
      />
    </View>
  </View>
)

const BORDER = '#E2E5EA'
const TEAL = '#13A07C'

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 120 },

  // Header
  header: { justifyContent: 'center', minHeight: 52, marginBottom: 8 },
  headerCenter: { alignItems: 'center' },
  kicker: { fontSize: 13, color: '#9AA1AD' },
  title: { fontSize: 24, fontWeight: '800', color: '#0E1726', marginTop: 2 },
  menuBtn: {
    position: 'absolute',
    right: 0,
    top: 6,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
<<<<<<< HEAD
  backBtn: {
    position: 'absolute',
    left: 0,
    top: 6,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
=======
>>>>>>> 7bd40f4462d6b8d134c54f2d6eb8b38d2134af43

  // Identity block
  identity: { alignItems: 'center', marginTop: 6, marginBottom: 22 },
  avatarWrap: { marginBottom: 14 },
  avatarImg: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#E5E7EB' },
  avatarUploading: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(11, 27, 51, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  name: { fontSize: 22, fontWeight: '800', color: '#0E1726' },
  role: { fontSize: 15, color: '#6B7280', marginTop: 3 },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    height: 48,
    paddingHorizontal: 22,
    borderRadius: 30,
    backgroundColor: TEAL,
    shadowColor: '#0E7A60',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  uploadBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  // Section cards
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F2F5',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  accentBar: { width: 4, height: 18, borderRadius: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1B2233' },

  // Info rows
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  infoDivider: { borderTopWidth: 1, borderTopColor: '#F2F4F7' },
  infoIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#9AA1AD', marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: '700', color: '#1B2233' },

  // Edit fields
  fieldWrap: { marginTop: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#4B5563', marginBottom: 6 },
  req: { color: '#EF4444' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  inputRowDisabled: { backgroundColor: '#F6F7F9' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#1F2937', paddingVertical: 0 },
  inputDisabled: { color: '#8A92A0' },
  inputPlaceholder: { color: '#9AA1AD' },

  editActions: { flexDirection: 'row', gap: 12, marginTop: 22 },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { color: '#4B5563', fontSize: 15, fontWeight: '700' },
  saveBtn: {
    flex: 1.4,
    height: 50,
    borderRadius: 30,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.7 },

  // Bottom actions (display mode)
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 30,
    backgroundColor: TEAL,
    marginBottom: 14,
    shadowColor: '#0E7A60',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  updateText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 30,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FBD5D5',
  },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: '700' },
})