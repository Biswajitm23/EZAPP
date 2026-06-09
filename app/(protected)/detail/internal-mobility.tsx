import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ScreenContainer, Reveal, PressableScale } from '@/components'

/* -------------------------------------------------------------------------- */
/* Static Internal Mobility screen (Careers card → no API).                    */
/* Matches Mobility Details.png (hero + job listings) and                      */
/* Mobility Job content.png (job detail with roles & responsibilities).        */
/* Mirrors content/[id]'s back-header + title + scroll chrome.                 */
/* -------------------------------------------------------------------------- */

const BRAND = '#13A07C'

interface Job {
  id: string
  title: string
  jobId: string
  designation: string
  ctc: string
  intro: string
  responsibilities: string[]
}

const JOBS: Job[] = [
  {
    id: 'shopify-backend',
    title: 'Shopify Developer (Backend)',
    jobId: 'BPIM-2324-01',
    designation: 'Senior Engineer - II',
    ctc: 'INR 2,80,000 - INR 3,00,000',
    intro: 'In this position you are expected to work on Shopify Development projects.',
    responsibilities: [
      'Shopify Website Backend Development & Theme Customization',
      'Extending Shopify functionalities to the next level using Storefront APIs, JS, liquid programming, meta fields, JSON templates, etc.',
      'Shopify headless Development with Storefront API, Hydrogen, and Oxygen',
      'Producing high-quality work with a strong focus on detail',
      'Site Performance Optimization with scripting',
    ],
  },
  {
    id: 'wordpress-dev',
    title: 'WordPress Developer',
    jobId: 'BPIM-2324-02',
    designation: 'Engineer - II',
    ctc: 'INR 2,40,000 - INR 2,80,000',
    intro: 'In this position you are expected to work on WordPress Development projects.',
    responsibilities: [
      'Custom theme and plugin development for WordPress',
      'Page builder development (Elementor, WPBakery) and performance tuning',
      'Integrating third-party APIs and WooCommerce stores',
      'Maintaining and optimising existing client websites',
      'Ensuring cross-browser and responsive compatibility',
    ],
  },
  {
    id: 'backend-php',
    title: 'Backend Developer (PHP)',
    jobId: 'BPIM-2324-03',
    designation: 'Senior Engineer - II',
    ctc: 'INR 3,00,000 - INR 3,60,000',
    intro: 'In this position you are expected to work on backend and API development projects.',
    responsibilities: [
      'API and server-side development using PHP / CodeIgniter',
      'Designing and optimising relational database schemas',
      'Building secure integrations with third-party services',
      'Writing clean, maintainable and well-documented code',
      'Collaborating with frontend teams to ship features end to end',
    ],
  },
  {
    id: 'marketing',
    title: 'Marketing Executive',
    jobId: 'BPIM-2324-04',
    designation: 'Executive - II',
    ctc: 'INR 2,20,000 - INR 2,60,000',
    intro: 'In this position you are expected to work on brand, growth and content marketing.',
    responsibilities: [
      'Planning and executing digital marketing campaigns',
      'SEO, content writing and social media management',
      'Tracking analytics and reporting on campaign performance',
      'Storytelling and brand communication for Bitpastel',
      'Collaborating with design and sales on go-to-market',
    ],
  },
]

const HIGHLIGHTS = [
  'Dynamic Teams working on new ideas',
  'Enjoy a Happy work environment',
  'Fast track career progress',
]

export default function InternalMobility() {
  const router = useRouter()
  const [activeJob, setActiveJob] = useState<Job | null>(null)

  /* ---------------------------- Job detail view --------------------------- */
  if (activeJob) {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Reveal index={0}>
            <View style={styles.headerRow}>
              <Pressable style={styles.back} onPress={() => setActiveJob(null)} hitSlop={8}>
                <Ionicons name="chevron-back" size={24} color="#1B2233" />
                <Text style={styles.backText}>Back</Text>
              </Pressable>
            </View>
          </Reveal>

          <Reveal index={1}>
            <View style={styles.jobDetailHead}>
              <Text style={styles.jobDetailTitle}>{activeJob.title}</Text>
              <Text style={styles.jobMeta}>Job ID: {activeJob.jobId}</Text>
              <Text style={styles.jobMeta}>Designation: {activeJob.designation}</Text>
              <Text style={styles.jobMeta}>CTC: {activeJob.ctc}</Text>
            </View>
          </Reveal>

          <Reveal index={2}>
            <Text style={styles.jobIntro}>{activeJob.intro}</Text>
            <Text style={styles.jobIntro}>The current position requires the following skills:</Text>
          </Reveal>

          <Reveal index={3}>
            <Text style={styles.sectionLabel}>Roles and Responsibilities:</Text>
            {activeJob.responsibilities.map((r, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{r}</Text>
              </View>
            ))}
          </Reveal>

          <Reveal index={4}>
            <PressableScale style={styles.applyBtn} activeScale={0.97} onPress={() => setActiveJob(null)}>
              <Text style={styles.applyText}>Apply</Text>
            </PressableScale>
          </Reveal>
        </ScrollView>
      </ScreenContainer>
    )
  }

  /* --------------------------- Listings (hero) ---------------------------- */
  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Reveal index={0}>
          <View style={styles.headerRow}>
            <Pressable style={styles.back} onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="chevron-back" size={24} color="#1B2233" />
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          </View>
        </Reveal>

        <Reveal index={1}>
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Work @ Bitpastel{'\n'}on Awesome Projects</Text>
            {HIGHLIGHTS.map((h, i) => (
              <View key={i} style={styles.heroRow}>
                <Ionicons name="checkmark-circle" size={18} color={BRAND} />
                <Text style={styles.heroRowText}>{h}</Text>
              </View>
            ))}
          </View>
        </Reveal>

        <Reveal index={2}>
          <Text style={styles.applyIntro}>
            To apply for any of the current job openings, please go to the respective box below and click on
            the Apply button. If you don&apos;t see any suitable vacancy, send your resume and we&apos;ll get
            in touch with you as soon as there is an opening that matches your profile.
          </Text>
        </Reveal>

        <Reveal index={3}>
          <Text style={styles.sectionLabel}>Open Positions</Text>
        </Reveal>

        {JOBS.map((job, i) => (
          <Reveal index={i + 4} key={job.id}>
            <View style={styles.jobCard}>
              <View style={styles.jobCardHead}>
                <Text style={styles.jobCardTitle}>{job.title}</Text>
              </View>
              <View style={styles.jobCardBody}>
                <Text style={styles.jobMeta}>Job ID: {job.jobId}</Text>
                <Text style={styles.jobMeta}>Designation: {job.designation}</Text>
                <Text style={styles.jobMeta}>CTC: {job.ctc}</Text>
                <PressableScale style={styles.applyBtn} activeScale={0.97} onPress={() => setActiveJob(job)}>
                  <Text style={styles.applyText}>Apply</Text>
                </PressableScale>
              </View>
            </View>
          </Reveal>
        ))}

        <Reveal index={JOBS.length + 4}>
          <Text style={styles.footnote}>
            Interested? Reach out to your manager or HR to start the conversation.
          </Text>
        </Reveal>
      </ScrollView>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40 },

  headerRow: { flexDirection: 'row', alignItems: 'center' },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 16, fontWeight: '600', color: '#1B2233', marginLeft: 2 },

  // hero
  hero: { marginTop: 12, marginBottom: 22 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#1B2233', marginBottom: 18, lineHeight: 32 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  heroRowText: { fontSize: 15, color: '#374151', fontWeight: '500' },

  applyIntro: { fontSize: 14, lineHeight: 22, color: '#6B7280', marginBottom: 22 },
  sectionLabel: { fontSize: 18, fontWeight: '700', color: '#2B2B2B', marginBottom: 14 },

  // job listing card
  jobCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  jobCardHead: { backgroundColor: '#1F4FB8', paddingVertical: 14, paddingHorizontal: 16 },
  jobCardTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  jobCardBody: { padding: 16, gap: 8 },
  jobMeta: { fontSize: 14, color: '#4B5563', lineHeight: 22 },

  applyBtn: {
    marginTop: 12,
    height: 44,
    borderRadius: 8,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  applyText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  // job detail
  jobDetailHead: { marginTop: 12, marginBottom: 18 },
  jobDetailTitle: { fontSize: 22, fontWeight: '800', color: '#1B2233', marginBottom: 10 },
  jobIntro: { fontSize: 15, lineHeight: 23, color: '#4B5563', marginBottom: 12 },
  bulletRow: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  bulletDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: BRAND, marginTop: 7 },
  bulletText: { flex: 1, fontSize: 14.5, lineHeight: 22, color: '#374151' },

  footnote: { fontSize: 13, color: '#9AA3B2', textAlign: 'center', marginTop: 14 },
})
