import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, TextInput, Image, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ScreenContainer, InitialAvatar, Loader, EmptyState, Button, DatePickerModal, useFeedback } from '@/components'
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

/**
 * Profile — employee details from the Profile GET API.
 *
 * GET /profile (Bearer auth). Maps { profile, manager } into the form. While
 * the backend is unreachable it falls back to the cached signed-in user so the
 * screen stays usable; 401 signs the user out, 404 shows "profile not found".
 * "Update" is a stub until the update endpoint is wired.
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

  // Demo fallback from the cached user so the page renders before the API is
  // live. Real API data always takes precedence.
  const fallback = useMemo<ProfileResponse | undefined>(() => {
    if (!user) return undefined
    const [fname, ...rest] = (user.name ?? '').split(' ')
    return {
      status: true,
      profile: {
        id: user.id,
        emp_id: typeof user.id === 'string' ? user.id : 'BP080',
        fname: fname || 'Biswajit',
        lname: rest.join(' ') || 'Mondal',
        full_name: user.name ?? 'Biswajit Mondal',
        email: user.email ?? 'biswajit.m@bitpastel.in',
        phone: user.phone_number ?? '7908155251',
        gender: 'Male',
        dob: '2000-08-25',
        join_date: '2023-07-24',
        address: 'Kolkata',
        designation: user.designation ?? 'Software Engineer - II',
        emp_type: 'Full Time',
        role: 'employee',
        profile_picture: null,
      },
      manager: { id: 'BP061', name: 'Rammoy Mandal', email: '', phone: '', profile_picture: null },
    }
  }, [user])

  // Use real data when available; on 404 show the empty state; otherwise (loading
  // / network error) fall back to the cached user.
  const data = query.data ?? (status === 404 ? undefined : fallback)

  // Editable fields, seeded from the resolved profile.
  const [form, setForm] = useState({ fname: '', lname: '', phone: '', dob: '', gender: '', address: '' })
  useEffect(() => {
    if (data?.profile) {
      const p = data.profile
      setForm({ fname: p.fname, lname: p.lname, phone: p.phone, dob: p.dob, gender: capitalize(p.gender), address: p.address })
    }
  }, [data?.profile])

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  // Date-picker + locally-picked (pre-upload) photo preview.
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  // Merge an updated profile (from either mutation) into the cache + redux so
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
      if (res.profile) {
        applyProfile(res.profile)
      } else if (res.profile_picture) {
        // Backend returned only the stored filename — patch it into the cache.
        const current = queryClient.getQueryData<ProfileResponse>(['profile'])
        if (current?.profile) {
          applyProfile({ ...current.profile, profile_picture: res.profile_picture })
        }
      }
      setPhotoPreview(null)
      toast.success(res.message || 'Your profile picture has been updated.')
    },
    onError: (err: any) => {
      setPhotoPreview(null)
      if (handleAuthError(err)) return
      toast.error(err?.response?.data?.message || 'Could not upload your picture. Please try again.')
    },
  })

  const onPhotoResult = (result: ImagePickResult) => {
    if (result.status === 'denied') {
      toast.error('Please allow camera and photo access in Settings to change your picture.')
      return
    }
    if (result.status === 'canceled') return
    setPhotoPreview(result.uri)
    pictureMutation.mutate(result.uri)
  }

  const handleChangePhoto = async () => {
    const choice = await sheet({
      title: 'Profile Picture',
      message: 'Take a new photo or choose one from your library.',
      options: [
        { label: 'Take Photo', icon: 'camera-outline' },
        { label: 'Choose from Library', icon: 'image-outline' },
      ],
    })
    if (choice === 0) onPhotoResult(await takeProfilePhoto())
    else if (choice === 1) onPhotoResult(await pickProfilePhoto())
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

  // --- States ---------------------------------------------------------------
  if (status === 401) {
    return (
      <ScreenContainer>
        <Loader />
      </ScreenContainer>
    )
  }

  if (query.isLoading && !data) {
    return (
      <ScreenContainer>
        <Loader />
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

  return (
    <ScreenContainer edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Please enter your details here</Text>

        <View style={styles.card}>
          {/* Avatar with camera badge — tap to take/choose a new picture */}
          <Pressable style={styles.avatarWrap} onPress={handleChangePhoto} disabled={pictureMutation.isPending}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
            ) : (
              <InitialAvatar name={p.full_name || `${form.fname} ${form.lname}`} size={92} />
            )}
            {pictureMutation.isPending && (
              <View style={styles.avatarUploading}>
                <ActivityIndicator color="#FFFFFF" />
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={15} color="#FFFFFF" />
            </View>
          </Pressable>
          <Text style={styles.avatarLabel}>Profile Picture</Text>

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
          <Field label="Emp ID" required icon="id-card-outline" value={p.emp_id} editable={false} />
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>
              Date of Birth<Text style={styles.req}> *</Text>
            </Text>
            <Pressable style={styles.inputRow} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={18} color={BRAND} style={{ marginRight: 10 }} />
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
              <Ionicons name="person-outline" size={18} color={BRAND} style={{ marginRight: 10 }} />
              <Text style={[styles.input, !form.gender && styles.inputPlaceholder]}>
                {form.gender || 'Select gender'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#9AA1AD" />
            </Pressable>
          </View>
          <Field label="Address" required icon="location-outline" value={form.address} onChangeText={set('address')} />

          <Pressable
            style={[styles.updateBtn, updateMutation.isPending && styles.updateBtnDisabled]}
            onPress={handleUpdate}
            disabled={updateMutation.isPending}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.updateText}>Update</Text>
            )}
          </Pressable>

          <Pressable style={styles.signOutBtn} onPress={handleSignOut} hitSlop={6}>
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            <Text style={styles.signOutText}>Log Out</Text>
          </Pressable>
        </View>
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
/* Outlined labeled input (matches the web portal's form fields)              */
/* -------------------------------------------------------------------------- */

interface FieldProps extends React.ComponentProps<typeof TextInput> {
  label: string
  required?: boolean
  icon: keyof typeof Ionicons.glyphMap
}

const Field: React.FC<FieldProps> = ({ label, required, icon, editable = true, ...rest }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.label}>
      {label}
      {required ? <Text style={styles.req}> *</Text> : null}
    </Text>
    <View style={[styles.inputRow, !editable && styles.inputRowDisabled]}>
      <Ionicons name={icon} size={18} color="#9AA1AD" style={{ marginRight: 10 }} />
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
  scroll: { padding: 20, paddingBottom: 110 },
  title: { fontSize: 24, fontWeight: '700', color: '#2B2B2B', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 6, marginBottom: 20 },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#FFFFFF',
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },

  avatarWrap: { alignSelf: 'center', marginBottom: 8 },
  avatarImg: { width: 92, height: 92, borderRadius: 46, backgroundColor: '#E5E7EB' },
  avatarUploading: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(11, 27, 51, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarLabel: { fontSize: 16, fontWeight: '700', color: '#2B2B2B', textAlign: 'center', marginBottom: 18 },

  fieldWrap: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#4B5563', marginBottom: 6 },
  req: { color: '#EF4444' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  inputRowDisabled: { backgroundColor: '#F6F7F9' },
  input: { flex: 1, fontSize: 15, color: '#1F2937', paddingVertical: 0 },
  inputDisabled: { color: '#8A92A0' },
  inputPlaceholder: { color: '#9AA1AD' },

  updateBtn: {
    height: 48,
    borderRadius: 8,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    alignSelf: 'center',
    paddingHorizontal: 36,
  },
  updateBtnDisabled: { opacity: 0.7 },
  updateText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 18 },
  signOutText: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
})
