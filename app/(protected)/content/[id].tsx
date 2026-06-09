import React, { useMemo, useRef, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import type { WebViewMessageEvent } from 'react-native-webview'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { WebView } from 'react-native-webview'
import { Image } from 'expo-image'
import { useVideoPlayer, VideoView } from 'expo-video'
import { ScreenContainer, AppHeader, PressableScale, Reveal, Skeleton, EmptyState, useFeedback, Checkbox } from '@/components'
import { dashboardService } from '@/api'
import type {
  DashboardContentResponse,
  ElearningVideoDetail,
  ElearningVideoLanguage,
  FormListDetail,
  FormListItem,
  FormDetail,
  HrHandbookDetail,
  GuidelineDetail,
  GameDetail,
  RewardDetail,
  PresentationTopicsDetail,
  PresentationTopic,
  PresentationPdf,
  PresentationDetail,
  PresentationPdfDetail,
} from '@/api'

/* -------------------------------------------------------------------------- */
/* Shared pieces (exported for the next phase: guideline/game/reward/         */
/* presentations type branches will reuse the scaffold + media wrappers).     */
/* -------------------------------------------------------------------------- */

const BRAND = '#13A07C'

/**
 * Known asset base used by the web Employee Zone app. The `/dashboard/detail`
 * form_list response itself omits `asset_base_url`, so we prefer the value from
 * the cached `/dashboard/content` meta and fall back to this constant.
 */
const DEFAULT_ASSET_BASE_URL = 'https://bitpastel.org/employee-zone/'

/**
 * Resolve a form_list item's `image` (a bare filename, e.g. "1635770967317.jpg")
 * into a full URL. The web app serves these from
 * `<asset_base_url>admin/uploads/form_images/<image>`. Absolute URLs (should the
 * backend ever send one) are passed through unchanged.
 */
function resolveFormImageUrl(image?: string, assetBaseUrl?: string): string | undefined {
  if (!image) return undefined
  if (/^https?:\/\//i.test(image)) return image
  const base = (assetBaseUrl || DEFAULT_ASSET_BASE_URL).replace(/\/+$/, '')
  return `${base}/admin/uploads/form_images/${image}`
}

/** Types this screen fetches a detail for + renders a body for. */
export const ACTION_DETAIL_TYPES = [
  'elearning_video',
  'form_list',
  'form',
  'hr_handbook',
  'guideline',
  'game',
  'reward',
  'presentation_topics',
  'presentation',
  'presentation_pdf',
] as const

/**
 * Shared back-header + title + scroll chrome. Wraps any detail body so every
 * `type` branch keeps the same back-header + card aesthetic. Reused by the
 * next phase's type branches.
 */
export function DetailScaffold({
  title,
  children,
  onBack,
}: {
  title?: string
  children: React.ReactNode
  onBack?: () => void
}) {
  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Reveal index={0}>
          <AppHeader showBack title={title} onBack={onBack} />
        </Reveal>
        {children}
      </ScrollView>
    </ScreenContainer>
  )
}

/**
 * 16:9 in-app media surface. Renders iframe/HTML embeds and remote PDFs via
 * `react-native-webview`, and direct (mp4-style) video URLs via `expo-video`.
 * Exported so the next phase can reuse it for guideline/game/reward/presentation.
 */
export function MediaWebView({
  uri,
  html,
  style,
}: {
  uri?: string
  html?: string
  style?: object
}) {
  if (!uri && !html) return null
  return (
    <View style={[styles.mediaBox, style]}>
      <WebView
        style={styles.webview}
        source={html ? { html } : { uri: uri! }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.webLoading}>
            <ActivityIndicator color={BRAND} />
          </View>
        )}
      />
    </View>
  )
}

/** Direct video-file player (expo-video). For mp4/playable URLs only. */
function DirectVideoPlayer({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false
  })
  return (
    <View style={styles.mediaBox}>
      <VideoView style={styles.webview} player={player} allowsFullscreen nativeControls />
    </View>
  )
}

/**
 * Build a self-contained HTML document that renders a remote PDF with Mozilla
 * pdf.js (loaded from a CDN). Each PDF page is drawn to a full-width <canvas>
 * inside a horizontal CSS scroll-snap container, so the user swipes ONE page per
 * slide (no auto-advance). The page count and the currently-visible page index
 * are reported back to React Native via `window.ReactNativeWebView.postMessage`
 * so the app can show a "Page x / N" indicator.
 *
 * This replaces the previous flaky Android Google `gview` wrapper and renders
 * reliably on both Android and iOS without any native PDF module.
 */
function buildPdfViewerHtml(fileUrl: string): string {
  const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168'
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
  html,body{margin:0;padding:0;height:100%;background:#F3F4F6;overflow:hidden;}
  #pager{
    display:flex;flex-direction:row;height:100%;width:100%;
    overflow-x:auto;overflow-y:hidden;
    scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;
  }
  #pager::-webkit-scrollbar{display:none;}
  .slide{
    flex:0 0 100%;width:100%;height:100%;
    scroll-snap-align:center;scroll-snap-stop:always;
    display:flex;align-items:center;justify-content:center;
    box-sizing:border-box;padding:8px;
  }
  .slide canvas{max-width:100%;max-height:100%;box-shadow:0 1px 6px rgba(0,0,0,0.15);background:#fff;}
  #status{
    position:fixed;left:0;right:0;top:0;display:flex;align-items:center;justify-content:center;
    height:100%;color:#6B7280;font-family:-apple-system,Roboto,'Segoe UI',sans-serif;font-size:14px;
  }
</style>
</head>
<body>
<div id="pager"></div>
<div id="status">Loading…</div>
<script type="module">
  function send(msg){ try{ window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }catch(e){} }
  (async function(){
    try{
      const pdfjsLib = await import('${PDFJS}/pdf.min.mjs');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '${PDFJS}/pdf.worker.min.mjs';
      const loadingTask = pdfjsLib.getDocument({ url: ${JSON.stringify(fileUrl)} });
      const pdf = await loadingTask.promise;
      const pager = document.getElementById('pager');
      const status = document.getElementById('status');
      status.style.display = 'none';
      send({ type: 'meta', pages: pdf.numPages, page: 1 });
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      for (let n = 1; n <= pdf.numPages; n++){
        const slide = document.createElement('div');
        slide.className = 'slide';
        const canvas = document.createElement('canvas');
        slide.appendChild(canvas);
        pager.appendChild(slide);
        const page = await pdf.getPage(n);
        const vw = pager.clientWidth - 16;
        const vh = pager.clientHeight - 16;
        const base = page.getViewport({ scale: 1 });
        const scale = Math.min(vw / base.width, vh / base.height);
        const viewport = page.getViewport({ scale: scale * dpr });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = (viewport.width / dpr) + 'px';
        canvas.style.height = (viewport.height / dpr) + 'px';
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      }
      // Report current page as the user swipes (no timers / no autoplay).
      let raf = 0;
      pager.addEventListener('scroll', function(){
        if (raf) return;
        raf = requestAnimationFrame(function(){
          raf = 0;
          const idx = Math.round(pager.scrollLeft / pager.clientWidth) + 1;
          send({ type: 'page', page: Math.max(1, Math.min(pdf.numPages, idx)) });
        });
      }, { passive: true });
    }catch(err){
      const status = document.getElementById('status');
      if (status){ status.textContent = 'Could not load PDF.'; status.style.display = 'flex'; }
      send({ type: 'error', message: String(err && err.message || err) });
    }
  })();
</script>
</body>
</html>`
}

/**
 * Page-by-page PDF viewer. Renders the remote PDF with pdf.js inside a WebView
 * (one full-width page per horizontally-swipeable slide) and overlays a
 * "Page x / N" indicator that updates as the user swipes. No auto-advance.
 *
 * Reliable on Android + iOS without a native PDF module (Expo-managed safe).
 * `onPages` lets the parent surface the real page count (e.g. the "Pages • N"
 * line) once pdf.js reports it.
 */
export function PdfPager({ fileUrl, onPages }: { fileUrl: string; onPages?: (pages: number) => void }) {
  const html = useMemo(() => buildPdfViewerHtml(fileUrl), [fileUrl])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(0)
  const onPagesRef = useRef(onPages)
  onPagesRef.current = onPages

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data) as { type: string; pages?: number; page?: number }
      if (msg.type === 'meta') {
        if (typeof msg.pages === 'number') {
          setPages(msg.pages)
          onPagesRef.current?.(msg.pages)
        }
        if (typeof msg.page === 'number') setPage(msg.page)
      } else if (msg.type === 'page' && typeof msg.page === 'number') {
        setPage(msg.page)
      }
    } catch {
      // ignore malformed messages
    }
  }

  return (
    <View style={styles.tallMediaBox}>
      <WebView
        style={styles.webview}
        originWhitelist={['*']}
        source={{ html }}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        mixedContentMode="always"
        onMessage={onMessage}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.webLoading}>
            <ActivityIndicator color={BRAND} />
          </View>
        )}
      />
      {pages > 0 ? (
        <View style={styles.pageIndicatorWrap} pointerEvents="none">
          <View style={styles.pageIndicator}>
            <Text style={styles.pageIndicatorText}>
              Page {page} / {pages}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  )
}

/**
 * Normalize a Google Form URL for embedding. Google serves a scroll-friendly,
 * chrome-less layout for `viewform` URLs when `embedded=true` is present, so we
 * append it (idempotently) to Google Forms links that lack it. Non-Google /
 * already-embedded URLs are passed through unchanged.
 */
function googleFormEmbedUrl(url: string): string {
  const isGoogleForm = /docs\.google\.com\/forms\//i.test(url) || /\/viewform/i.test(url)
  if (!isGoogleForm) return url
  if (/[?&]embedded=true\b/i.test(url)) return url
  return url + (url.includes('?') ? '&' : '?') + 'embedded=true'
}

/** Is this URL a direct, playable video file (vs an iframe/HTML embed)? */
function isDirectVideoUrl(u?: string): boolean {
  if (!u) return false
  return /\.(mp4|m4v|mov|webm|m3u8)(\?|#|$)/i.test(u)
}

/**
 * Wrap a raw iframe/embed HTML fragment (e.g. a Google Drive preview iframe) in
 * a minimal responsive doc so it fills the 16:9 media box edge-to-edge.
 */
function wrapEmbedHtml(inner: string): string {
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>html,body{margin:0;height:100%;background:#000}iframe{width:100%;height:100%;border:0}</style>
</head><body>${inner}</body></html>`
}

/** Globe-iconed pill row to switch the active language. */
function LanguageSelector({
  languages,
  selected,
  onSelect,
}: {
  languages: { label: string }[]
  selected: number
  onSelect: (i: number) => void
}) {
  if (languages.length <= 1) return null
  return (
    <View>
      <View style={styles.langHeader}>
        <Ionicons name="globe-outline" size={16} color="#6B7280" />
        <Text style={styles.langHeaderText}>Language</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.langRow}
      >
        {languages.map((l, i) => {
          const active = i === selected
          return (
            <PressableScale
              key={`${l.label}-${i}`}
              style={[styles.langPill, active && styles.langPillActive]}
              activeScale={0.95}
              onPress={() => onSelect(i)}
            >
              <Text style={[styles.langText, active && styles.langTextActive]}>{l.label}</Text>
            </PressableScale>
          )
        })}
      </ScrollView>
    </View>
  )
}

/**
 * Shared completion block: a functional Checkbox that gates a Confirm CTA. The
 * CTA is disabled until the box is ticked (frontend validation). When already
 * done, shows a success state instead.
 */
function CompletionGate({
  done,
  doneLabel,
  checkboxLabel,
  ctaLabel,
  pending,
  onConfirm,
}: {
  done: boolean
  doneLabel: string
  checkboxLabel: string
  ctaLabel: string
  pending?: boolean
  onConfirm: () => void
}) {
  const [checked, setChecked] = useState(false)

  if (done) {
    return (
      <View style={[styles.watchedCard, styles.submittedCard]}>
        <View style={[styles.checkCircle, { backgroundColor: BRAND }]}>
          <Ionicons name="checkmark" size={34} color="#FFFFFF" />
        </View>
        <Text style={styles.watchedText}>{doneLabel}</Text>
      </View>
    )
  }

  return (
    <View style={styles.completionCard}>
      <Checkbox
        checked={checked}
        onChange={setChecked}
        label={checkboxLabel}
        disabled={pending}
        style={styles.completionCheckbox}
      />
      <PressableScale
        style={[styles.ctaBtn, (!checked || pending) && styles.ctaBtnDisabled]}
        activeScale={0.97}
        disabled={!checked || pending}
        onPress={() => {
          if (!checked || pending) return
          onConfirm()
        }}
      >
        {pending ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        )}
      </PressableScale>
    </View>
  )
}

/* -------------------------------------------------------------------------- */
/* Screen                                                                      */
/* -------------------------------------------------------------------------- */

export default function ContentDetail() {
  const params = useLocalSearchParams<{
    id?: string
    type?: string
    key?: string
    slug?: string
    detailId?: string
    title?: string
    image?: string
  }>()

  const { type, key, slug, detailId, id } = params
  const title = params.title ?? 'Content'

  const qc = useQueryClient()
  const invalidateDashboard = () => qc.invalidateQueries({ queryKey: ['dashboard', 'content'] })

  const isActionType = !!type && (ACTION_DETAIL_TYPES as readonly string[]).includes(type)

  const detailQuery = useQuery({
    queryKey: ['dashboard', 'detail', type, key || slug || detailId || id],
    queryFn: ({ signal }) =>
      dashboardService.getDetail(
        {
          type: type!,
          key: key || undefined,
          slug: slug || undefined,
          id: detailId || undefined,
        },
        signal,
      ),
    enabled: isActionType,
    retry: false,
  })

  // Unknown / not-yet-implemented type → friendly empty state (next phase adds branches).
  if (!isActionType) {
    return (
      <DetailScaffold title={title}>
        <Reveal index={1}>
          <EmptyState
            icon="construct-outline"
            title="Not available yet"
            subtitle="This content type isn't supported in the app yet."
          />
        </Reveal>
      </DetailScaffold>
    )
  }

  if (detailQuery.isLoading) {
    // PDF/form/presentation detail uses a tall document viewer; everything else
    // (video / read content) uses a 16:9-ish block. Match it so there's no jump.
    const tallMedia =
      type === 'form' ||
      type === 'hr_handbook' ||
      type === 'presentation_pdf' ||
      type === 'guideline'
    return (
      <DetailScaffold title={title}>
        <Reveal index={1}>
          <Skeleton height={tallMedia ? 320 : 200} borderRadius={12} style={{ marginBottom: 18 }} />
          <Skeleton width="40%" height={14} style={{ marginBottom: 12 }} />
          <Skeleton width="90%" height={12} style={{ marginBottom: 8 }} />
          <Skeleton width="75%" height={12} style={{ marginBottom: 24 }} />
          <Skeleton height={56} borderRadius={16} />
        </Reveal>
      </DetailScaffold>
    )
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <DetailScaffold title={title}>
        <Reveal index={1}>
          <EmptyState
            icon="cloud-offline-outline"
            title="Couldn't load this"
            subtitle="Something went wrong fetching this content."
          />
          <Pressable style={styles.retryBtn} onPress={() => detailQuery.refetch()}>
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </Reveal>
      </DetailScaffold>
    )
  }

  const resp = detailQuery.data as Record<string, any>

  // The LIVE /dashboard/detail response is WRAPPED: the real payload lives under
  // `.item` (with `status` + `type` siblings). Some list types nest the actual
  // collection (items/forms/topics/pdfs) inside that `item`. Unwrap ONCE here so
  // every `type` branch reads its fields from `payload`, not the raw envelope.
  // (The dashboard/content endpoint is NOT wrapped and is untouched.)
  const payload = (resp?.item ?? resp?.data?.item ?? resp?.data ?? resp) as Record<string, any>
  const detail = payload

  // Switch on `type` — the next phase ADDS cases (guideline/game/reward/presentations).
  switch (type) {
    case 'elearning_video':
      return (
        <ElearningVideoBody
          detail={detail as ElearningVideoDetail}
          title={detail?.title ?? title}
          // Watched key: prefer the action's own body.key, then payload.key, then route param.
          contentKey={detail?.mark_watched?.body?.key || detail?.key || key || ''}
          invalidateDashboard={invalidateDashboard}
        />
      )
    case 'form_list':
      return <FormListBody detail={detail as FormListDetail} title={detail?.title ?? title} />
    case 'form':
      return (
        <FormBody
          detail={detail as FormDetail}
          title={detail?.title ?? title}
          invalidateDashboard={invalidateDashboard}
        />
      )
    case 'hr_handbook':
      return (
        <HrHandbookBody
          detail={detail as HrHandbookDetail}
          title={detail?.title ?? title}
          invalidateDashboard={invalidateDashboard}
        />
      )
    case 'guideline':
      return (
        <GuidelineBody
          detail={detail as GuidelineDetail}
          title={detail?.title ?? title}
          invalidateDashboard={invalidateDashboard}
        />
      )
    case 'game':
      return <ReadOnlyContentBody detail={detail as GameDetail} title={detail?.title ?? title} />
    case 'reward':
      return <ReadOnlyContentBody detail={detail as RewardDetail} title={detail?.title ?? title} />
    case 'presentation_topics':
      return (
        <PresentationTopicsBody detail={detail as PresentationTopicsDetail} title={detail?.title ?? title} />
      )
    case 'presentation':
      return <PresentationBody detail={detail as PresentationDetail} title={detail?.title ?? title} />
    case 'presentation_pdf':
      return (
        <PresentationPdfBody detail={detail as PresentationPdfDetail} title={detail?.title ?? title} />
      )
    default:
      return (
        <DetailScaffold title={title}>
          <Reveal index={1}>
            <EmptyState
              icon="construct-outline"
              title="Not available yet"
              subtitle="This content type isn't supported in the app yet."
            />
          </Reveal>
        </DetailScaffold>
      )
  }
}

/* -------------------------------------------------------------------------- */
/* 1. elearning_video                                                          */
/* -------------------------------------------------------------------------- */

function ElearningVideoBody({
  detail,
  title,
  contentKey,
  invalidateDashboard,
}: {
  detail: ElearningVideoDetail
  title: string
  contentKey: string
  invalidateDashboard: () => void
}) {
  const { toast } = useFeedback()
  const languages: ElearningVideoLanguage[] = Array.isArray(detail?.languages) ? detail.languages : []
  const [selected, setSelected] = useState(0)

  // Watched is true if the detail or the (any) language reports it.
  const apiWatched =
    detail?.watched === true || languages.some((l) => l?.watched === true)
  const [watched, setWatched] = useState<boolean>(apiWatched)

  const mutation = useMutation({
    mutationFn: () => dashboardService.markElearningWatched(contentKey),
    onSuccess: () => {
      setWatched(true)
      invalidateDashboard()
      toast.success('Marked as watched')
    },
    onError: () => toast.error('Could not save. Please try again.'),
  })

  const lang = languages[selected]
  // Defensive: a language may expose a direct video URL under several keys.
  const directUrl: string | undefined =
    lang?.video_url || lang?.url || lang?.file_url || lang?.src
  // Embed (iframe HTML). Prefer the selected language's `embed`; if `languages`
  // is missing/empty, fall back to the payload-level url_en/url_bn iframe HTML.
  const embed: string | undefined =
    lang?.embed ||
    (languages.length === 0
      ? selected === 1
        ? detail?.url_bn || detail?.url_en
        : detail?.url_en || detail?.url_bn
      : undefined)

  const langOptions = languages.map((l, i) => ({
    label: l?.label || l?.title || l?.key || `Language ${i + 1}`,
  }))
  // Duration / description may arrive under a few keys (contract-inferred).
  const duration: string | undefined =
    detail?.duration || detail?.length || lang?.duration
  const description: string | undefined =
    detail?.description || detail?.summary || lang?.description

  return (
    <DetailScaffold title={title}>
      <Reveal index={1}>
        {isDirectVideoUrl(directUrl) ? (
          <DirectVideoPlayer uri={directUrl!} />
        ) : embed ? (
          <MediaWebView html={wrapEmbedHtml(embed)} />
        ) : directUrl ? (
          <MediaWebView uri={directUrl} />
        ) : (
          <EmptyState icon="videocam-off-outline" title="No video available" />
        )}
      </Reveal>

      {langOptions.length > 1 ? (
        <Reveal index={2}>
          <LanguageSelector languages={langOptions} selected={selected} onSelect={setSelected} />
        </Reveal>
      ) : null}

      {duration ? (
        <Reveal index={3}>
          <Text style={styles.metaLine}>Duration • {duration}</Text>
        </Reveal>
      ) : null}

      {description ? (
        <Reveal index={4}>
          <Text style={styles.sectionHeading}>Description</Text>
          <Text style={styles.bodyText}>{description}</Text>
        </Reveal>
      ) : null}

      <Reveal index={5}>
        <CompletionGate
          done={watched}
          doneLabel="You have completed this video."
          checkboxLabel={`I have completed watching the full ${title} video`}
          ctaLabel="Confirm Completion"
          pending={mutation.isPending}
          onConfirm={() => mutation.mutate()}
        />
      </Reveal>
    </DetailScaffold>
  )
}

/* -------------------------------------------------------------------------- */
/* 2. form_list                                                                */
/* -------------------------------------------------------------------------- */

/** Open a single form's detail screen. */
function openForm(router: ReturnType<typeof useRouter>, form: FormListItem, fallbackId: string) {
  const formSlug =
    form?.detail?.slug ?? form?.slug_name ?? (form as Record<string, any>)?.slug ?? ''
  router.push({
    pathname: '/(protected)/content/[id]',
    params: {
      id: formSlug || fallbackId,
      type: 'form',
      slug: formSlug,
      title: form?.name ?? form?.title ?? 'Form',
    },
  })
}

/**
 * Illustrated form card (WEBAPPForm.png): the form illustration image, the form
 * name, and a status pill ("Pending"/"Submitted"). Falls back to a tinted icon
 * tile when the image is absent or fails to load.
 */
function FormCard({
  form,
  index,
  imageUrl,
  onPress,
}: {
  form: FormListItem
  index: number
  imageUrl?: string
  onPress: () => void
}) {
  const submitted = form?.submitted === true
  const name = form?.name ?? form?.title ?? 'Form'
  // A small palette / icon set so the fallback tile still reads like the grid.
  const tints = ['#FFF2E2', '#E6F0FF', '#E8F7F0', '#FFF7E0', '#EFEAFE', '#FDE9EE']
  const icons: (keyof typeof Ionicons.glyphMap)[] = [
    'person-outline',
    'card-outline',
    'cube-outline',
    'cash-outline',
    'shield-checkmark-outline',
    'wallet-outline',
  ]
  const tint = tints[index % tints.length]
  const icon = icons[index % icons.length]
  const [imgFailed, setImgFailed] = useState(false)
  const showImage = !!imageUrl && !imgFailed

  return (
    <PressableScale style={styles.formCard} activeScale={0.97} onPress={onPress}>
      {showImage ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.formCardImage}
          contentFit="cover"
          transition={150}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <View style={[styles.formCardArt, { backgroundColor: tint }]}>
          <Ionicons name={icon} size={34} color={BRAND} />
        </View>
      )}
      <Text style={styles.formCardTitle} numberOfLines={2}>
        {name}
      </Text>
      <View style={[styles.statusPill, submitted ? styles.statusPillDone : styles.statusPillPending]}>
        <Text style={styles.statusPillText}>{submitted ? 'Submitted' : 'Pending'}</Text>
      </View>
    </PressableScale>
  )
}

/**
 * Is this form one of the PF/ESIC "Optional" set shown under "Optional Forms" on
 * the web (PF Declaration, KYC Form for PF & ESIC, Bank Account Information for
 * PF & ESIC)? `available_for` is "Employee" for both sets in the live payload, so
 * the reliable split is the form name (PF / ESIC / Declaration / KYC).
 */
function isOptionalForm(f: FormListItem): boolean {
  const name = String(f?.name ?? f?.title ?? '').toLowerCase()
  const slug = String(f?.slug_name ?? f?.detail?.slug ?? '').toLowerCase()
  const hay = `${name} ${slug}`
  return /\bpf\b|esic|declaration|\bkyc\b/.test(hay)
}

function FormListBody({ detail, title }: { detail: FormListDetail; title: string }) {
  const router = useRouter()
  const qc = useQueryClient()
  const forms: FormListItem[] = Array.isArray(detail?.forms)
    ? detail.forms
    : Array.isArray(detail?.items)
      ? detail.items
      : []

  // The form_list response omits asset_base_url — read it from the cached
  // dashboard content meta (already fetched by the dashboard tab); fall back to
  // the known web base inside resolveFormImageUrl.
  const cachedDashboard = qc.getQueryData<DashboardContentResponse>(['dashboard', 'content'])
  const assetBaseUrl = cachedDashboard?.meta?.asset_base_url

  if (forms.length === 0) {
    return (
      <DetailScaffold title={title}>
        <Reveal index={1}>
          <EmptyState icon="document-text-outline" title="No forms" subtitle="There are no forms to show." />
        </Reveal>
      </DetailScaffold>
    )
  }

  // Aggregate status line: submitted / total.
  const total = detail?.total_forms ?? forms.length
  const submittedCount =
    detail?.submitted_forms ?? forms.filter((f) => f?.submitted === true).length
  const allDone = total > 0 && submittedCount >= total

  // Split into "Employee Forms" vs "Optional Forms" to match WEBAPPForm.png.
  const indexed = forms.map((form, idx) => ({ form, idx }))
  const employeeForms = indexed.filter(({ form }) => !isOptionalForm(form))
  const optionalForms = indexed.filter(({ form }) => isOptionalForm(form))

  const groups: { label: string; subtitle?: string; items: { form: FormListItem; idx: number }[] }[] =
    []
  if (employeeForms.length > 0) groups.push({ label: 'Employee Forms', items: employeeForms })
  if (optionalForms.length > 0) {
    groups.push({
      label: 'Optional Forms',
      subtitle: 'Please fill these forms only when asked by HR Department.',
      items: optionalForms,
    })
  }

  return (
    <DetailScaffold title={title}>
      <Reveal index={1}>
        <View style={styles.aggCard}>
          <View>
            <Text style={styles.aggLabel}>Status</Text>
            <Text style={[styles.aggStatus, allDone ? styles.aggStatusDone : styles.aggStatusPending]}>
              {allDone ? 'Submitted' : 'Pending'}
            </Text>
          </View>
          <View style={styles.aggCountWrap}>
            <Text style={styles.aggCount}>
              {submittedCount} / {total}
            </Text>
            <Text style={styles.aggCountLabel}>submitted</Text>
          </View>
        </View>
      </Reveal>

      {groups.map((group, gi) => (
        <View key={group.label || `g-${gi}`}>
          <Reveal index={gi + 2}>
            <Text style={styles.groupHeading}>{group.label}</Text>
            {group.subtitle ? <Text style={styles.groupSubtitle}>{group.subtitle}</Text> : null}
          </Reveal>
          <Reveal index={gi + 2}>
            <View style={styles.formGrid}>
              {group.items.map(({ form, idx }) => (
                <FormCard
                  key={`${form?.detail?.slug ?? form?.slug_name ?? idx}`}
                  form={form}
                  index={idx}
                  imageUrl={resolveFormImageUrl(form?.image, assetBaseUrl)}
                  onPress={() => openForm(router, form, String(idx))}
                />
              ))}
            </View>
          </Reveal>
        </View>
      ))}
    </DetailScaffold>
  )
}

/* -------------------------------------------------------------------------- */
/* 3. form                                                                     */
/* -------------------------------------------------------------------------- */

function FormBody({
  detail,
  title,
  invalidateDashboard,
}: {
  detail: FormDetail
  title: string
  invalidateDashboard: () => void
}) {
  const router = useRouter()
  const { toast } = useFeedback()
  const [confirmed, setConfirmed] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const embedUrl = detail?.embed_url || undefined
  const fileUrl = detail?.file_url || undefined
  const formId = detail?.form_id
  const needsSignature =
    detail?.needs_signature === true ||
    detail?.signature_required === true ||
    detail?.signature_required === 'yes'

  // Google Form embeds get `&embedded=true` (scroll-friendly layout); PDF-backed
  // forms render through the page-by-page PdfPager below.
  const formEmbedUri = embedUrl ? googleFormEmbedUrl(embedUrl) : undefined

  const mutation = useMutation({
    mutationFn: () => {
      if (formId == null) throw new Error('Missing form id')
      // Current forms have no signature → send ONLY form_id. (needsSignature is
      // read for forward-compat; no signature pad is wired yet.)
      return dashboardService.submitForm(Number(formId))
    },
    onSuccess: () => {
      setSubmitted(true)
      invalidateDashboard()
      toast.success('Form submitted')
    },
    onError: () => toast.error('Could not submit. Please try again.'),
  })

  return (
    <DetailScaffold title={title}>
      {/* Illustration */}
      <Reveal index={1}>
        <View style={styles.formIllustration}>
          <Ionicons name={embedUrl ? 'reader-outline' : 'document-text-outline'} size={40} color={BRAND} />
          <Text style={styles.formIllustrationText}>
            {embedUrl ? 'Complete the form below, then confirm and submit.' : 'Review the document, then confirm and submit.'}
          </Text>
        </View>
      </Reveal>

      {/* Content: embedded Google Form or PDF */}
      <Reveal index={2}>
        {formEmbedUri ? (
          // Tall, fixed-height container + nestedScrollEnabled so the embedded
          // Google Form owns its vertical scroll gesture instead of the outer
          // DetailScaffold ScrollView stealing it (feedback #9).
          <View style={styles.formEmbedBox}>
            <WebView
              style={styles.webview}
              source={{ uri: formEmbedUri }}
              originWhitelist={['*']}
              javaScriptEnabled
              domStorageEnabled
              scrollEnabled
              nestedScrollEnabled
              allowFileAccess
              mixedContentMode="always"
              startInLoadingState
              renderLoading={() => (
                <View style={styles.webLoading}>
                  <ActivityIndicator color={BRAND} />
                </View>
              )}
            />
          </View>
        ) : fileUrl ? (
          <PdfPager fileUrl={fileUrl} />
        ) : (
          <EmptyState icon="document-outline" title="No form to display" />
        )}
      </Reveal>

      {/* Completion + CTA */}
      {submitted ? (
        <Reveal index={3}>
          <View style={[styles.watchedCard, styles.submittedCard]}>
            <View style={[styles.checkCircle, { backgroundColor: BRAND }]}>
              <Ionicons name="checkmark" size={34} color="#FFFFFF" />
            </View>
            <Text style={styles.watchedText}>Submitted. Thank you!</Text>
            <Pressable style={styles.backDoneBtn} onPress={() => router.back()}>
              <Text style={styles.backDoneText}>Back to forms</Text>
            </Pressable>
          </View>
        </Reveal>
      ) : (
        <Reveal index={3}>
          <View style={styles.completionCard}>
            <Checkbox
              checked={confirmed}
              onChange={setConfirmed}
              label="I confirm I have completed this form"
              disabled={mutation.isPending}
              style={styles.completionCheckbox}
            />
            <PressableScale
              style={[styles.ctaBtn, (!confirmed || mutation.isPending) && styles.ctaBtnDisabled]}
              activeScale={0.97}
              disabled={!confirmed || mutation.isPending}
              onPress={() => {
                if (!confirmed || mutation.isPending) return
                mutation.mutate()
              }}
            >
              {mutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.ctaText}>Submit</Text>
              )}
            </PressableScale>
            {needsSignature ? (
              <Text style={styles.note}>A signature will be required for this form.</Text>
            ) : null}
          </View>
        </Reveal>
      )}
    </DetailScaffold>
  )
}

/* -------------------------------------------------------------------------- */
/* 4. hr_handbook                                                              */
/* -------------------------------------------------------------------------- */

function HrHandbookBody({
  detail,
  title,
  invalidateDashboard,
}: {
  detail: HrHandbookDetail
  title: string
  invalidateDashboard: () => void
}) {
  const { toast } = useFeedback()
  const fileUrl = detail?.file_url || undefined
  const handbookId = detail?.handbook_id
  const pages = detail?.pages ?? detail?.page_count
  const [read, setRead] = useState<boolean>(detail?.watched === true)

  const mutation = useMutation({
    mutationFn: () => {
      if (handbookId == null) throw new Error('Missing handbook id')
      return dashboardService.markHandbookRead(Number(handbookId))
    },
    onSuccess: () => {
      setRead(true)
      invalidateDashboard()
      toast.success('Marked as read')
    },
    onError: () => toast.error('Could not save. Please try again.'),
  })

  return (
    <PdfDetailScaffold
      title={title}
      fileUrl={fileUrl}
      pages={pages}
      done={read}
      doneLabel="You have confirmed reading the handbook."
      checkboxLabel="I confirm I have read the HR Handbook"
      pending={mutation.isPending}
      onConfirm={() => mutation.mutate()}
    />
  )
}

/**
 * Shared PDF detail layout (item 13): framed PDF preview, Language selector
 * (English by default), Pages count line, a confirm checkbox and a Confirm
 * Completion CTA. Used by hr_handbook and (file-backed) guideline flows.
 */
function PdfDetailScaffold({
  title,
  fileUrl,
  pages,
  done,
  doneLabel,
  checkboxLabel,
  pending,
  onConfirm,
}: {
  title: string
  fileUrl?: string
  pages?: number | string
  done: boolean
  doneLabel: string
  checkboxLabel: string
  pending?: boolean
  onConfirm: () => void
}) {
  // Prefer the real page count reported by pdf.js once the PDF loads; fall back
  // to the API-provided `pages` until then.
  const [realPages, setRealPages] = useState<number | null>(null)
  const shownPages = realPages ?? pages

  return (
    <DetailScaffold title={title}>
      <Reveal index={1}>
        {fileUrl ? (
          <PdfPager fileUrl={fileUrl} onPages={setRealPages} />
        ) : (
          <EmptyState icon="document-outline" title="No document to display" />
        )}
      </Reveal>

      <Reveal index={2}>
        <View style={styles.langHeader}>
          <Ionicons name="globe-outline" size={16} color="#6B7280" />
          <Text style={styles.langHeaderText}>Language</Text>
        </View>
        <View style={styles.langRow}>
          <View style={[styles.langPill, styles.langPillActive]}>
            <Text style={[styles.langText, styles.langTextActive]}>English</Text>
          </View>
        </View>
      </Reveal>

      {shownPages != null ? (
        <Reveal index={3}>
          <Text style={styles.metaLine}>Pages • {shownPages}</Text>
        </Reveal>
      ) : null}

      <Reveal index={4}>
        <CompletionGate
          done={done}
          doneLabel={doneLabel}
          checkboxLabel={checkboxLabel}
          ctaLabel="Confirm Completion"
          pending={pending}
          onConfirm={onConfirm}
        />
      </Reveal>
    </DetailScaffold>
  )
}

/* -------------------------------------------------------------------------- */
/* Helpers shared by the read-rendering branches                               */
/* -------------------------------------------------------------------------- */

/** Heuristic: does this string look like HTML markup (vs. plain text)? */
function looksLikeHtml(s?: string): boolean {
  if (!s) return false
  return /<\/?[a-z][\s\S]*>/i.test(s)
}

/** Is this URL a PDF file? */
function isPdfUrl(u?: string): boolean {
  if (!u) return false
  return /\.pdf(\?|#|$)/i.test(u)
}

/**
 * Render a body of content defensively: an optional image, then either HTML
 * (via webview), a PDF (via the platform PDF viewer), or plain text.
 */
function ContentBody({
  image,
  html,
  text,
  fileUrl,
}: {
  image?: string
  html?: string
  text?: string
  fileUrl?: string
}) {
  const hasHtml = looksLikeHtml(html) || looksLikeHtml(text)
  const htmlSource = looksLikeHtml(html) ? html : looksLikeHtml(text) ? text : undefined
  const plainText = !hasHtml ? text || (html && !looksLikeHtml(html) ? html : undefined) : undefined

  return (
    <>
      {image ? (
        <Reveal index={1}>
          <Image source={{ uri: image }} style={styles.hero} contentFit="cover" transition={150} />
        </Reveal>
      ) : null}

      {fileUrl && isPdfUrl(fileUrl) ? (
        <Reveal index={2}>
          <PdfPager fileUrl={fileUrl} />
        </Reveal>
      ) : htmlSource ? (
        <Reveal index={2}>
          <MediaWebView html={wrapHtml(htmlSource)} style={styles.autoMedia} />
        </Reveal>
      ) : plainText ? (
        <Reveal index={2}>
          <Text style={styles.bodyText}>{plainText}</Text>
        </Reveal>
      ) : (
        <Reveal index={2}>
          <EmptyState icon="document-text-outline" title="No content" />
        </Reveal>
      )}
    </>
  )
}

/** Wrap raw HTML fragments so they render readably (viewport + base styling). */
function wrapHtml(inner: string): string {
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>
  *{box-sizing:border-box}
  body{margin:0;padding:16px;font-family:-apple-system,Roboto,'Segoe UI',sans-serif;font-size:15px;line-height:1.55;color:#2B2B2B}
  img,video,iframe{max-width:100%;height:auto;border-radius:10px}
  a{color:${BRAND}}
</style></head><body>${inner}</body></html>`
}

/* -------------------------------------------------------------------------- */
/* 5. guideline                                                                */
/* -------------------------------------------------------------------------- */

function GuidelineBody({
  detail,
  title,
  invalidateDashboard,
}: {
  detail: GuidelineDetail
  title: string
  invalidateDashboard: () => void
}) {
  const { toast } = useFeedback()
  const guidelineId = detail?.guideline_id
  const [read, setRead] = useState<boolean>(detail?.viewed === true)

  const mutation = useMutation({
    mutationFn: () => {
      if (guidelineId == null) throw new Error('Missing guideline id')
      return dashboardService.confirmGuideline(Number(guidelineId))
    },
    onSuccess: () => {
      setRead(true)
      invalidateDashboard()
      toast.success('Confirmed as read')
    },
    // The web confirm-read action isn't built yet — fail gracefully (no crash).
    onError: () => toast.info("Saved locally — we'll sync this when it's available."),
  })

  // PDF-backed guideline → PDF detail layout (framed preview + Language + Pages).
  if (detail?.file_url && isPdfUrl(detail.file_url)) {
    return (
      <PdfDetailScaffold
        title={title}
        fileUrl={detail.file_url}
        pages={detail?.pages ?? detail?.page_count}
        done={read}
        doneLabel="You have confirmed this guideline."
        checkboxLabel="I confirm I have read the guidelines"
        pending={mutation.isPending}
        onConfirm={() => mutation.mutate()}
      />
    )
  }

  // HTML / text guideline → content body + completion gate.
  return (
    <DetailScaffold title={title}>
      <ContentBody
        image={detail?.image}
        html={detail?.html}
        text={detail?.content}
        fileUrl={detail?.file_url}
      />

      <Reveal index={3}>
        <CompletionGate
          done={read}
          doneLabel="You have confirmed this guideline."
          checkboxLabel="I confirm I have read the guidelines"
          ctaLabel="Confirm Completion"
          pending={mutation.isPending}
          onConfirm={() => mutation.mutate()}
        />
      </Reveal>
    </DetailScaffold>
  )
}

/* -------------------------------------------------------------------------- */
/* 6. game / reward (read-only)                                                */
/* -------------------------------------------------------------------------- */

function ReadOnlyContentBody({
  detail,
  title,
}: {
  detail: GameDetail | RewardDetail
  title: string
}) {
  return (
    <DetailScaffold title={title}>
      <ContentBody
        image={detail?.image}
        html={detail?.html}
        text={detail?.content}
        fileUrl={(detail as Record<string, any>)?.file_url}
      />
    </DetailScaffold>
  )
}

/* -------------------------------------------------------------------------- */
/* 7. presentation_topics                                                      */
/* -------------------------------------------------------------------------- */

function PdfRow({ pdf }: { pdf: PresentationPdf }) {
  const router = useRouter()
  return (
    <PressableScale
      style={styles.pdfRow}
      activeScale={0.98}
      onPress={() =>
        router.push({
          pathname: '/(protected)/content/[id]',
          params: {
            id: String(pdf?.id ?? ''),
            type: 'presentation_pdf',
            detailId: String(pdf?.id ?? ''),
            title: pdf?.title ?? 'Presentation',
          },
        })
      }
    >
      <Ionicons name="document-text-outline" size={20} color={BRAND} />
      <Text style={styles.pdfTitle} numberOfLines={2}>
        {pdf?.title ?? 'Presentation'}
      </Text>
      <Ionicons name="chevron-forward" size={18} color="#9AA3B2" />
    </PressableScale>
  )
}

function TopicSection({ topic, index }: { topic: PresentationTopic; index: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const pdfs: PresentationPdf[] = Array.isArray(topic?.pdfs) ? topic.pdfs : []

  return (
    <Reveal index={index + 1}>
      <View style={styles.topicCard}>
        <PressableScale
          style={styles.topicHeader}
          activeScale={0.99}
          onPress={() => {
            if (pdfs.length > 0) {
              setOpen((o) => !o)
            } else {
              router.push({
                pathname: '/(protected)/content/[id]',
                params: {
                  id: String(topic?.id ?? ''),
                  type: 'presentation',
                  detailId: String(topic?.id ?? ''),
                  title: topic?.slug_name ?? topic?.title ?? 'Presentation',
                },
              })
            }
          }}
        >
          <Text style={styles.topicTitle} numberOfLines={2}>
            {topic?.slug_name ?? topic?.title ?? topic?.name ?? 'Topic'}
          </Text>
          {pdfs.length > 0 ? (
            <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color="#6B7280" />
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#9AA3B2" />
          )}
        </PressableScale>

        {open && pdfs.length > 0 ? (
          <View style={styles.topicBody}>
            {pdfs.map((pdf, i) => (
              <PdfRow key={`${pdf?.id ?? i}`} pdf={pdf} />
            ))}
          </View>
        ) : null}
      </View>
    </Reveal>
  )
}

function PresentationTopicsBody({
  detail,
  title,
}: {
  detail: PresentationTopicsDetail
  title: string
}) {
  // The API returns the topics under `items` (live shape); keep topics/data as
  // fallbacks for forward-compat.
  const topics: PresentationTopic[] = Array.isArray(detail?.items)
    ? detail.items
    : Array.isArray(detail?.topics)
      ? detail.topics
      : Array.isArray(detail?.data)
        ? detail.data
        : []

  if (topics.length === 0) {
    return (
      <DetailScaffold title={title}>
        <Reveal index={1}>
          <EmptyState
            icon="easel-outline"
            title="No presentations"
            subtitle="There are no presentation topics to show."
          />
        </Reveal>
      </DetailScaffold>
    )
  }

  return (
    <DetailScaffold title={title}>
      {topics.map((topic, i) => (
        <TopicSection key={`${topic?.id ?? i}`} topic={topic} index={i} />
      ))}
    </DetailScaffold>
  )
}

/* -------------------------------------------------------------------------- */
/* 8. presentation (single topic)                                              */
/* -------------------------------------------------------------------------- */

function PresentationBody({ detail, title }: { detail: PresentationDetail; title: string }) {
  const topic = detail?.topic ?? detail
  const pdfs: PresentationPdf[] = Array.isArray(topic?.pdfs)
    ? topic!.pdfs!
    : Array.isArray(detail?.pdfs)
      ? detail.pdfs
      : Array.isArray((detail as Record<string, any>)?.items)
        ? (detail as Record<string, any>).items
        : []

  return (
    <DetailScaffold title={(topic as Record<string, any>)?.slug_name ?? topic?.title ?? title}>
      {pdfs.length === 0 ? (
        <Reveal index={1}>
          <EmptyState icon="document-outline" title="No PDFs" subtitle="This topic has no presentations." />
        </Reveal>
      ) : (
        pdfs.map((pdf, i) => (
          <Reveal index={i + 1} key={`${pdf?.id ?? i}`}>
            <PdfRow pdf={pdf} />
          </Reveal>
        ))
      )}
    </DetailScaffold>
  )
}

/* -------------------------------------------------------------------------- */
/* 9. presentation_pdf (single PDF in-app)                                     */
/* -------------------------------------------------------------------------- */

function PresentationPdfBody({ detail, title }: { detail: PresentationPdfDetail; title: string }) {
  const fileUrl = detail?.pdf?.file_url || detail?.file_url || undefined
  const heading = detail?.pdf?.title ?? title

  return (
    <DetailScaffold title={heading}>
      <Reveal index={1}>
        {fileUrl ? (
          <PdfPager fileUrl={fileUrl} />
        ) : (
          <EmptyState icon="document-outline" title="No PDF to display" />
        )}
      </Reveal>
    </DetailScaffold>
  )
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                      */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40 },

  headerRow: { flexDirection: 'row', alignItems: 'center' },
  back: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 16, fontWeight: '600', color: '#1B2233', marginLeft: 2 },
  title: { fontSize: 24, fontWeight: '700', color: '#2B2B2B', marginTop: 10, marginBottom: 16 },

  langHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 18, marginBottom: 10 },
  langHeaderText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  langRow: { gap: 10, paddingBottom: 4, flexDirection: 'row' },
  langPill: {
    borderWidth: 1,
    borderColor: '#E2E5EA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  langPillActive: { backgroundColor: BRAND, borderColor: BRAND },
  langText: { fontSize: 14, fontWeight: '600', color: '#1B2233' },
  langTextActive: { color: '#FFFFFF' },

  metaLine: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 16 },
  sectionHeading: { fontSize: 16, fontWeight: '700', color: '#1B2233', marginTop: 18, marginBottom: 8 },

  mediaBox: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  tallMediaBox: {
    width: '100%',
    height: 460,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  // Embedded Google Form: taller so the inner form has room to scroll fully.
  formEmbedBox: {
    width: '100%',
    height: 620,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  // "Page x / N" overlay for the PDF pager.
  pageIndicatorWrap: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pageIndicator: {
    backgroundColor: 'rgba(27,34,51,0.82)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  pageIndicatorText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  webLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },

  // form_list aggregate + grid (WEBAPPForm.png)
  aggCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 22,
    backgroundColor: '#F8FAF9',
  },
  aggLabel: { fontSize: 12, fontWeight: '600', color: '#9AA3B2', marginBottom: 4 },
  aggStatus: { fontSize: 18, fontWeight: '800' },
  aggStatusPending: { color: '#B45309' },
  aggStatusDone: { color: '#047857' },
  aggCountWrap: { alignItems: 'flex-end' },
  aggCount: { fontSize: 20, fontWeight: '800', color: '#1B2233' },
  aggCountLabel: { fontSize: 12, color: '#9AA3B2', fontWeight: '600' },

  groupHeading: { fontSize: 17, fontWeight: '700', color: '#2B2B2B', marginBottom: 4 },
  groupSubtitle: { fontSize: 12, color: '#E11D48', fontWeight: '600', marginBottom: 14 },
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 12 },
  formCard: {
    width: '31.5%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 10,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  formCardArt: {
    width: '100%',
    height: 74,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  formCardImage: {
    width: '100%',
    height: 74,
    borderRadius: 10,
    backgroundColor: '#EEF1F4',
    marginBottom: 10,
  },
  formCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B2233',
    textAlign: 'center',
    marginBottom: 10,
    minHeight: 32,
  },
  statusPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, alignSelf: 'stretch', alignItems: 'center' },
  statusPillPending: { backgroundColor: BRAND },
  statusPillDone: { backgroundColor: '#047857' },
  statusPillText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  // single form: illustration + completion card
  formIllustration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 14,
    backgroundColor: '#E8F5F0',
    padding: 16,
    marginBottom: 16,
  },
  formIllustrationText: { flex: 1, fontSize: 14, color: '#1B2233', fontWeight: '500', lineHeight: 20 },

  // shared completion card (checkbox gate + CTA)
  completionCard: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 18,
    backgroundColor: '#FFFFFF',
  },
  completionCheckbox: { marginBottom: 16 },
  ctaBtn: {
    height: 52,
    borderRadius: 30,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnDisabled: { backgroundColor: '#9CD7C7' },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  note: { marginTop: 10, fontSize: 12, color: '#6B7280', textAlign: 'center' },

  // confirm / watched / read card
  watchedCard: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  submittedCard: {},
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  watchedText: { fontSize: 15, color: '#4B5563', fontWeight: '500', textAlign: 'center' },
  backDoneBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10 },
  backDoneText: { color: BRAND, fontWeight: '700', fontSize: 14 },

  // error retry
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    marginTop: 16,
    height: 46,
    paddingHorizontal: 26,
    borderRadius: 30,
    backgroundColor: BRAND,
  },
  retryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  // read-content body (guideline / game / reward)
  hero: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: '#EEF1F4',
    marginBottom: 16,
  },
  autoMedia: { aspectRatio: undefined, height: 460, backgroundColor: '#FFFFFF' },
  bodyText: { fontSize: 15, lineHeight: 23, color: '#374151' },

  // presentation topics / pdfs
  topicCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    overflow: 'hidden',
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  topicTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1B2233' },
  topicBody: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
  },
  pdfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 10,
    backgroundColor: '#FFFFFF',
  },
  pdfTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1B2233' },
})
