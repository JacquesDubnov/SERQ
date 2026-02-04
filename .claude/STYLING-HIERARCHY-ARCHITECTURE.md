# SERQ Styling Hierarchy Architecture v2.0

## Overview

A cascading styling system with 5 levels, where each level can override its parent.
**Principle: No null styles** - every element always has a style, either inherited or explicit.

```
PROJECT (root)
  └── DOCUMENT(s)
       └── PAGE(s)
            └── BLOCK(s)
                 └── CHARACTER(s) / INLINE MARKS
```

---

## Block System Design

### Block Types (Extensible)

The system must support unlimited block types. Current and planned:

**Content Blocks:**
- paragraph, heading (1-6), blockquote, code

**List Blocks:**
- bulletList, orderedList, taskList, checklistBlock, multipleChoiceBlock

**Structural Blocks:**
- table, columns, divider, pageBreak

**Media Blocks:**
- image, video, audio, file, iframe, embed

**Interactive Blocks:**
- aiBlock, dynamicBlock, formulaBlock

**Productivity Blocks:**
- taskBlock, projectBlock, timelineBlock, calendarBlock, reminderBlock

**Communication Blocks:**
- emailBlock, messagingBlock, commentBlock

**Future Blocks:**
- Any new type can be added without schema changes

### Block Identity System

Each block has a multi-layered identity for:
- **Instance tracking** (this specific block)
- **Origin tracking** (where it came from)
- **Linking** (source/target relationships)
- **Cross-document references** (jumping between docs)

```typescript
interface BlockIdentity {
  // Primary instance ID - unique within the entire system
  id: string                    // UUID v4

  // Document this block belongs to
  documentId: string            // UUID of parent document

  // Origin tracking (for copy/paste lineage)
  origin: {
    blockId: string             // Original block's ID
    documentId: string          // Original document's ID
    copiedAt: Date              // When copied
  } | null

  // Linking system (macro blocks)
  linking: {
    mode: 'none' | 'source' | 'target'
    sourceRef: {                // If mode === 'target'
      blockId: string
      documentId: string
    } | null
    targetRefs: Array<{         // If mode === 'source'
      blockId: string
      documentId: string
    }>
    syncMode: 'one-way' | 'bidirectional'  // For targets
  }

  // Reference URI for jump links
  // Format: serq://document/{docId}/block/{blockId}
  uri: string
}
```

### Block Metadata (Extensible)

Every block has base metadata plus type-specific metadata:

```typescript
interface BlockMetadata {
  // Identity (required for all blocks)
  identity: BlockIdentity

  // Type discriminator
  type: string                  // 'paragraph' | 'heading' | 'table' | etc.

  // Type-specific data (varies by type)
  typeData: BlockTypeData       // Generic, defined per type

  // Style reference (named style)
  styleRef: string | null       // Reference to named style

  // Explicit style overrides (cascade)
  styleOverrides: Partial<BlockStyle>

  // Computed/resolved style (runtime only, not persisted)
  _resolvedStyle?: ResolvedBlockStyle

  // Flags
  isLocked: boolean             // Prevent editing
  isHidden: boolean             // Collapsed/hidden state

  // Timestamps
  createdAt: Date
  modifiedAt: Date

  // Custom metadata (extensible)
  customData: Record<string, unknown>
}

// Type-specific data examples
interface ParagraphTypeData {
  // Paragraph has no special data
}

interface HeadingTypeData {
  level: 1 | 2 | 3 | 4 | 5 | 6
  numbering: NumberingConfig | null
  divider: DividerConfig | null
}

interface TableTypeData {
  rows: number
  columns: number
  headerRow: boolean
  headerColumn: boolean
}

interface TaskTypeData {
  status: 'todo' | 'in-progress' | 'done' | 'cancelled'
  assignee: string | null
  dueDate: Date | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

// etc. for each block type
```

---

## Level 1: CHARACTER (Inline Marks)

**Scope:** Individual text ranges within a block
**Storage:** ProseMirror marks on text nodes
**Override:** Highest priority - always wins over block

### Attributes (All Optional - Inherit if Not Set)

| Attribute | Type | Mark Type |
|-----------|------|-----------|
| fontFamily | string | textStyle |
| fontSize | string (px) | textStyle |
| fontWeight | string/number | textStyle |
| color | string (hex/rgb) | textStyle |
| backgroundColor | string | highlight |
| letterSpacing | string | textStyle |
| bold | boolean | bold |
| italic | boolean | italic |
| underline | boolean | underline |
| strikethrough | boolean | strike |
| subscript | boolean | subscript |
| superscript | boolean | superscript |
| link | { href, target } | link |

---

## Level 2: BLOCK

**Scope:** Single block
**Storage:** ProseMirror node attributes
**Override:** Overrides page/document/project, overridden by character

### Base Style Attributes (All Blocks)

```typescript
interface BlockStyle {
  // Typography
  fontFamily: string
  fontSize: string
  fontWeight: string
  lineHeight: string
  letterSpacing: string
  color: string

  // Layout
  textAlign: 'left' | 'center' | 'right' | 'justify'
  indent: number              // In standard indent units
  spacingBefore: string       // Margin before
  spacingAfter: string        // Margin after

  // Visual
  backgroundColor: string | null
  borderStyle: BorderConfig | null
  padding: PaddingConfig | null

  // Decoration
  textDecoration: {
    bold: boolean
    italic: boolean
    underline: boolean
    strikethrough: boolean
  }
}
```

### Style Resolution for Blocks

Blocks resolve style through:
1. Named style reference (`styleRef`)
2. Explicit overrides (`styleOverrides`)
3. Parent cascade (page → document → project)

```typescript
function resolveBlockStyle(
  block: BlockMetadata,
  page: PageMetadata,
  document: DocumentMetadata,
  project: ProjectMetadata,
  styleRegistry: StyleRegistry
): ResolvedBlockStyle {
  // 1. Start with project defaults
  let style = { ...project.defaultStyles.block }

  // 2. Apply document defaults
  style = mergeStyles(style, document.defaultStyles.block)

  // 3. Apply page defaults (if any)
  if (page.defaultStyles) {
    style = mergeStyles(style, page.defaultStyles.block)
  }

  // 4. Apply named style (if referenced)
  if (block.styleRef) {
    const namedStyle = styleRegistry.get(block.styleRef)
    if (namedStyle) {
      style = mergeStyles(style, namedStyle.properties)
    }
  }

  // 5. Apply explicit overrides
  style = mergeStyles(style, block.styleOverrides)

  return style as ResolvedBlockStyle
}
```

---

## Level 3: PAGE

**Scope:** Single page (continuous or paginated)
**Storage:** Document metadata (Zustand + persisted)

```typescript
interface PageMetadata {
  id: string
  pageNumber: number

  // Dimensions
  size: {
    width: number       // in points
    height: number
    preset: 'A4' | 'Letter' | 'Legal' | 'Custom'
  }
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
  orientation: 'portrait' | 'landscape'

  // Layout
  columns: number
  columnGap: string
  mode: 'continuous' | 'paginated'

  // Headers/Footers
  header: HeaderFooterConfig | null
  footer: HeaderFooterConfig | null

  // Page-level style defaults
  defaultStyles: {
    block: Partial<BlockStyle>
  } | null

  // Visual
  backgroundColor: string | null
}
```

---

## Level 4: DOCUMENT

**Scope:** Entire document
**Storage:** Document file + Zustand store

```typescript
interface DocumentMetadata {
  // Identity
  id: string
  title: string

  // Timestamps
  createdAt: Date
  modifiedAt: Date
  version: number

  // Project association
  projectId: string | null

  // Page configuration
  pageMode: 'continuous' | 'paginated'
  pages: PageMetadata[]
  defaultPageConfig: Omit<PageMetadata, 'id' | 'pageNumber'>

  // Document-level style defaults
  defaultStyles: {
    block: BlockStyle
    // Per-block-type overrides
    paragraph: Partial<BlockStyle>
    heading: {
      1: Partial<BlockStyle>
      2: Partial<BlockStyle>
      3: Partial<BlockStyle>
      4: Partial<BlockStyle>
      5: Partial<BlockStyle>
      6: Partial<BlockStyle>
    }
    // Other block types
    [blockType: string]: Partial<BlockStyle>
  }

  // Named styles (local to document)
  localStyles: StyleDefinition[]

  // Color palette (local)
  localColors: ColorDefinition[]

  // Font configuration (local)
  localFonts: FontDefinition[]
}
```

---

## Level 5: PROJECT

**Scope:** Multiple documents
**Storage:** Project file

```typescript
interface ProjectMetadata {
  id: string
  name: string
  description: string

  // Timestamps
  createdAt: Date
  modifiedAt: Date

  // Documents in this project
  documents: Array<{
    id: string
    path: string
    title: string
    order: number
  }>

  // Project-level defaults (root of cascade)
  defaultStyles: {
    block: BlockStyle
    paragraph: Partial<BlockStyle>
    heading: {
      1: Partial<BlockStyle>
      2: Partial<BlockStyle>
      3: Partial<BlockStyle>
      4: Partial<BlockStyle>
      5: Partial<BlockStyle>
      6: Partial<BlockStyle>
    }
    [blockType: string]: Partial<BlockStyle>
  }

  // Named styles (shared across all docs)
  sharedStyles: StyleDefinition[]

  // Color palette (shared)
  sharedColors: ColorDefinition[]

  // Font configuration (shared)
  sharedFonts: FontDefinition[]

  // Brand kit
  brandKit: {
    logos: LogoDefinition[]
    primaryColor: string
    secondaryColor: string
  }
}
```

---

## Named Styles System

Named styles are reusable style definitions that can be referenced by blocks.

```typescript
interface StyleDefinition {
  // Identity
  id: string
  name: string

  // Hierarchy
  basedOn: string | null       // Inherit from another style

  // Applicability
  appliesTo: string[]          // Block types this style can apply to
                               // ['paragraph'] or ['heading'] or ['*']

  // Style properties
  properties: Partial<BlockStyle>

  // Scope
  scope: 'project' | 'document'

  // Built-in vs custom
  isBuiltIn: boolean

  // Display
  category: string             // 'Headings' | 'Body' | 'Lists' | 'Custom'
  sortOrder: number
}
```

### Style Resolution with Named Styles

```
Block styleRef="Heading 1"
    ↓
Named Style "Heading 1" (basedOn="Base Heading")
    ↓
Named Style "Base Heading" (basedOn=null)
    ↓
Document default for heading.1
    ↓
Document default for block
    ↓
Project default for heading.1
    ↓
Project default for block
    ↓
System defaults
```

---

## Linked Blocks (Macro Blocks)

Linked blocks enable content synchronization across locations.

```typescript
interface LinkedBlockConfig {
  mode: 'none' | 'source' | 'target'

  // For source blocks
  targets?: Array<{
    blockId: string
    documentId: string
  }>

  // For target blocks
  sourceRef?: {
    blockId: string
    documentId: string
  }

  // Sync behavior
  syncMode: 'one-way' | 'bidirectional'
  syncContent: boolean         // Sync text content
  syncStyle: boolean           // Sync style
  syncTypeData: boolean        // Sync type-specific data
}
```

### Sync Flow

**One-way (source → targets):**
1. User edits source block
2. System propagates changes to all targets
3. Target edits are local only (don't affect source)

**Bidirectional:**
1. User edits any linked block
2. System propagates to all linked blocks
3. Conflict resolution via timestamp (last-write-wins) or merge

---

## Version Control & Document History

### Auto-Save System

Documents auto-save every 60 seconds with full history preservation.

```typescript
interface DocumentVersion {
  // Version identity
  versionId: string           // UUID
  documentId: string          // Parent document
  versionNumber: number       // Sequential (1, 2, 3...)

  // Timestamps
  savedAt: Date
  autoSave: boolean           // Auto vs manual save

  // Content snapshot
  content: {
    // Option A: Full snapshot
    full?: ProseMirrorJSON

    // Option B: Delta from previous (more efficient)
    delta?: {
      baseVersion: string     // versionId of base
      operations: Operation[] // ProseMirror steps
    }
  }

  // Metadata snapshot
  metadata: DocumentMetadata

  // Size tracking
  contentSize: number         // Bytes
  compressedSize: number      // Compressed bytes

  // User context
  savedBy: string | null      // User ID (for collab)
  deviceId: string            // Device that saved
  sessionId: string           // Edit session

  // Restore info
  canRestore: boolean         // False if corrupted
  restoreNotes: string | null
}
```

### Version Storage Strategy

```typescript
interface VersionStore {
  // Recent versions (fast access, in-memory)
  recentVersions: DocumentVersion[]  // Last N versions

  // Version index (for history browsing)
  versionIndex: Array<{
    versionId: string
    versionNumber: number
    savedAt: Date
    contentSize: number
    label: string | null      // User-assigned label
  }>

  // Compaction policy
  policy: {
    keepAllFor: number        // Keep all versions for X hours (e.g., 24)
    keepHourlyFor: number     // Then hourly for X days (e.g., 7)
    keepDailyFor: number      // Then daily for X days (e.g., 30)
    keepWeeklyFor: number     // Then weekly for X weeks (e.g., 52)
    keepLabeled: boolean      // Always keep labeled versions
  }
}
```

### History Operations

```typescript
interface HistoryOperations {
  // Get version list
  getVersions(documentId: string, options?: {
    limit?: number
    before?: Date
    after?: Date
  }): Promise<VersionSummary[]>

  // Get specific version
  getVersion(versionId: string): Promise<DocumentVersion>

  // Restore to version
  restoreVersion(versionId: string, options?: {
    createBackup: boolean     // Save current as backup first
    preserveStyles: boolean   // Keep current styles, only restore content
  }): Promise<void>

  // Compare versions
  compareVersions(versionA: string, versionB: string): Promise<VersionDiff>

  // Label version (bookmark)
  labelVersion(versionId: string, label: string): Promise<void>

  // Manual checkpoint
  createCheckpoint(documentId: string, label: string): Promise<DocumentVersion>
}
```

### Diff & Delta Storage

For efficient storage, use delta compression:

```typescript
interface VersionDelta {
  // Base version this delta applies to
  baseVersionId: string

  // ProseMirror transform steps
  steps: SerializedStep[]

  // Inverted steps (for undo)
  invertedSteps: SerializedStep[]

  // Metadata changes
  metadataChanges: JsonPatch[]

  // Style changes
  styleChanges: JsonPatch[]
}

// Full version reconstructed by:
// 1. Load base version
// 2. Apply all deltas in sequence
// 3. Cache reconstructed version for performance
```

### Conflict Resolution (for Cloud Sync)

```typescript
interface ConflictResolution {
  // Conflict detection
  detectConflict(local: DocumentVersion, remote: DocumentVersion): ConflictInfo | null

  // Resolution strategies
  strategies: {
    'last-write-wins': () => DocumentVersion
    'merge': () => MergedDocument
    'fork': () => [DocumentVersion, DocumentVersion]  // Create both as separate
    'manual': () => ConflictUI  // Show user both versions
  }

  // Block-level merge
  mergeBlocks(localBlocks: Block[], remoteBlocks: Block[]): MergeResult
}

interface ConflictInfo {
  localVersion: DocumentVersion
  remoteVersion: DocumentVersion
  conflictingBlocks: Array<{
    blockId: string
    localContent: Block
    remoteContent: Block
    commonAncestor: Block | null
  }>
  autoMergeable: boolean
}
```

---

## Storage Strategy

### Runtime (Zustand)
- Current document state
- Page configurations
- Resolved styles (cached)
- UI state

### ProseMirror Document
- Block content (text, etc.)
- Block attributes:
  - `id` (block UUID)
  - `type` (block type)
  - `styleRef` (named style reference)
  - `styleOverrides` (explicit overrides as JSON)
  - `typeData` (type-specific as JSON)
  - `linking` (link config as JSON)

### Persisted Files

**Document (`.serq`):**
```json
{
  "version": "2.0",
  "metadata": { /* DocumentMetadata */ },
  "content": { /* ProseMirror JSON */ },
  "styles": [ /* local StyleDefinitions */ ],
  "colors": [ /* local ColorDefinitions */ ],
  "fonts": [ /* local FontDefinitions */ ]
}
```

**Project (`.serqproj`):**
```json
{
  "version": "2.0",
  "metadata": { /* ProjectMetadata */ },
  "styles": [ /* shared StyleDefinitions */ ],
  "colors": [ /* shared ColorDefinitions */ ],
  "fonts": [ /* shared FontDefinitions */ ]
}
```

---

## Migration Strategy

### Phase 1: Block Foundation
1. Add block IDs to all blocks (generate on load)
2. Add block metadata attributes to schema
3. Implement style override storage

### Phase 2: Document Metadata
1. Create DocumentMetadata structure
2. Migrate existing styleStore data
3. Implement document-level defaults

### Phase 3: Named Styles
1. Create StyleDefinition system
2. Migrate headingCustomStyles to named styles
3. Add style reference to blocks

### Phase 4: Cascade Resolution
1. Implement full cascade resolver
2. Connect toolbar to new system
3. Update rendering to use resolved styles

### Phase 5: Linking & Pages
1. Implement linked blocks
2. Add page support
3. Add project support

---

## API Design

```typescript
// Style resolution
styleResolver.resolve(block, context) → ResolvedBlockStyle

// Named styles
styleRegistry.create(definition) → StyleDefinition
styleRegistry.update(id, changes) → StyleDefinition
styleRegistry.delete(id) → void
styleRegistry.get(id) → StyleDefinition
styleRegistry.list(filter?) → StyleDefinition[]

// Block operations
blockManager.create(type, options?) → BlockMetadata
blockManager.updateStyle(blockId, styleOverrides) → void
blockManager.setStyleRef(blockId, styleId) → void
blockManager.link(sourceId, targetId, mode) → void
blockManager.unlink(blockId) → void

// Document operations
documentManager.create(options?) → DocumentMetadata
documentManager.updateDefaults(defaults) → void
documentManager.addStyle(style) → void
documentManager.removeStyle(styleId) → void
```

---

---

## Platform & Deployment Considerations

### File Format: Package Directory (Folder-as-File)

Use a **package format** instead of a single binary blob. Both macOS and iOS treat folders with extensions as packages.

```
MyDocument.serq/
├── document.json          # Main document structure (JSON)
├── metadata.json          # Timestamps, version, author
├── assets/
│   ├── image-abc123.png
│   └── image-def456.jpg
├── history/               # Version history
│   ├── snapshots/
│   │   └── snapshot_001.json
│   └── deltas/
│       ├── delta_002.json
│       └── delta_003.json
└── manifest.json          # File list, checksums, format version
```

**Benefits:**
- Each file can sync independently (better cloud sync conflict resolution)
- JSON is human-readable for debugging
- Assets separate from content keeps document.json small
- Incremental updates possible

### Project File Structure

```
MyProject.serqproj/
├── project.json           # Project metadata, settings
├── pages/
│   ├── page-uuid1.json
│   ├── page-uuid2.json
│   └── ...
├── documents/
│   └── doc-uuid1/
│       ├── document.json
│       └── assets/
└── trash/                 # Soft-deleted items
```

### Platform-Specific Storage

| Platform | Primary Location | App Data | Cache |
|----------|-----------------|----------|-------|
| macOS | `~/Documents/SERQ/` | `~/Library/Application Support/com.serq.app/` | `~/Library/Caches/com.serq.app/` |
| macOS (Sandboxed) | `~/Library/Containers/com.serq.app/` | Via security-scoped bookmarks | Container |
| Windows | `%USERPROFILE%\Documents\SERQ\` | `%APPDATA%\SERQ\` | `%LOCALAPPDATA%\SERQ\` |
| iOS | `<container>/Documents/` | `<container>/Library/` | `<container>/tmp/` |
| Android | App-specific external | `/data/data/com.serq.app/` | Via SAF |

### Mobile Constraints

| Constraint | iOS | Android | Recommendation |
|-----------|-----|---------|----------------|
| File size | < 50MB for iCloud | < 50MB | Lazy load pages, compress assets |
| Memory | 1-2 GB usable | 512MB-2GB | Keep loaded docs < 50MB parsed |
| Storage access | Sandboxed | Scoped Storage (API 29+) | Use platform APIs, not direct FS |

### iOS Specifics
- Enable iCloud Documents capability for automatic sync
- Implement File Provider extension for Files app visibility
- Store security-scoped bookmarks for recent files access

### Android Specifics
- Use Storage Access Framework (SAF) for user documents
- Store working copies in app-specific external storage
- DO NOT request `MANAGE_EXTERNAL_STORAGE` (Play Store rejection)
- Implement Android Auto Backup for free automatic backup

### App Store/Play Store Compliance

**Required Export Formats:**
- PDF (mandatory)
- Markdown (mandatory)
- DOCX (nice-to-have)
- HTML (nice-to-have)

**Metadata Privacy:**
- Strip `deviceId`, `userId` on export
- Keep location data internal only
- Implement GDPR-style data deletion
- Provide privacy nutrition label disclosure

### Cloud Sync Strategy (v1 vs v2)

**v1 (Recommended):** Platform-native sync
- macOS/iOS: iCloud Documents (automatic with capability)
- Windows: User puts files in OneDrive/Dropbox folder
- Android: User manual backup or Google Drive API

**v2 (Future):** Custom sync service with CRDTs
- Store canonical copy on server
- Sync deltas, not full documents
- Cross-platform sync (Apple to Android)

---

## Data Storage Architecture

### SQLite as Primary Store

Use `tauri-plugin-sql` for native SQLite performance. JSON files alone won't scale to 500+ pages.

```sql
-- Core Tables
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    settings JSON,
    created_at INTEGER,
    updated_at INTEGER
);

CREATE TABLE documents (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id),
    title TEXT NOT NULL,
    meta JSON,
    created_at INTEGER,
    updated_at INTEGER
);

CREATE TABLE pages (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id),
    position TEXT NOT NULL,          -- Fractional index for ordering
    meta JSON,
    created_at INTEGER,
    updated_at INTEGER
);

CREATE TABLE blocks (
    id TEXT PRIMARY KEY,
    page_id TEXT NOT NULL REFERENCES pages(id),
    position TEXT NOT NULL,          -- Fractional index for ordering
    type TEXT NOT NULL,
    content JSON NOT NULL,           -- ProseMirror-compatible
    style_ref TEXT REFERENCES styles(id),
    inline_styles JSON,
    origin_id TEXT,                  -- Original block for copies
    created_at INTEGER,
    updated_at INTEGER
);

-- Named Styles
CREATE TABLE styles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    scope TEXT CHECK(scope IN ('project', 'document')),
    scope_id TEXT NOT NULL,
    based_on TEXT REFERENCES styles(id),
    definition JSON NOT NULL,
    sort_order INTEGER,
    created_at INTEGER,
    updated_at INTEGER
);

-- Block Linking
CREATE TABLE block_links (
    id TEXT PRIMARY KEY,
    source_block_id TEXT NOT NULL,
    source_document_id TEXT NOT NULL,
    target_block_id TEXT NOT NULL,
    target_document_id TEXT NOT NULL,
    sync_mode TEXT CHECK(sync_mode IN ('one_way', 'bidirectional', 'mirror', 'reference')),
    last_synced_at INTEGER,
    created_at INTEGER,
    UNIQUE(source_block_id, target_block_id)
);

-- Version Control
CREATE TABLE snapshots (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL REFERENCES documents(id),
    full_state BLOB,                 -- Compressed JSON
    created_at INTEGER
);

CREATE TABLE operations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id TEXT REFERENCES documents(id),
    block_id TEXT,
    op_type TEXT,                    -- 'insert', 'update', 'delete', 'move', 'style'
    op_data JSON,
    created_at INTEGER,
    session_id TEXT
);

-- Style Cache (Pre-computed)
CREATE TABLE computed_styles (
    block_id TEXT PRIMARY KEY REFERENCES blocks(id),
    resolved_style JSON NOT NULL,
    computed_at INTEGER,
    is_dirty INTEGER DEFAULT 1
);

-- Full-Text Search
CREATE VIRTUAL TABLE blocks_fts USING fts5(
    block_id,
    content,
    content='blocks',
    content_rowid='rowid'
);
```

### Key Indexes

```sql
-- Hierarchical navigation
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_pages_document ON pages(document_id);
CREATE INDEX idx_blocks_page ON blocks(page_id);

-- Ordering
CREATE INDEX idx_pages_order ON pages(document_id, position);
CREATE INDEX idx_blocks_order ON blocks(page_id, position);

-- Block operations
CREATE INDEX idx_blocks_type ON blocks(type);
CREATE INDEX idx_blocks_style_ref ON blocks(style_ref);

-- History
CREATE INDEX idx_operations_time ON operations(document_id, created_at);
CREATE INDEX idx_snapshots_doc_time ON snapshots(document_id, created_at);

-- Links
CREATE INDEX idx_links_source ON block_links(source_block_id);
CREATE INDEX idx_links_target ON block_links(target_block_id);
CREATE INDEX idx_links_target_doc ON block_links(target_document_id);
```

### Block Storage: Flat Map, Not Nested Tree

Store blocks in a flat structure with ID references:

```typescript
// GOOD - Flat map
interface Page {
  id: string
  title: string
  rootBlocks: string[]              // Top-level block IDs
  blocks: Record<string, Block>     // Flat map
}

// BAD - Nested tree
interface Page {
  id: string
  content: Block[]                  // Nested children
}
```

**Benefits:**
- Partial updates (only serialize changed blocks)
- Easier conflict resolution
- Better memory management (load blocks lazily)
- Simpler linked block resolution

---

## Performance Optimization

### Style Resolution: Caching with Version Counters

**Never resolve styles during render.** Pre-compute during state changes.

```typescript
class StyleResolver {
  private cache = new Map<string, ComputedBlockStyle>()

  // Version counters for surgical invalidation
  private projectVersion = 0
  private documentVersions = new Map<string, number>()
  private pageVersions = new Map<string, number>()

  resolveBlockStyle(blockId: string, context: StyleContext): ComputedBlockStyle {
    const cacheKey = this.computeCacheKey(blockId, context)
    const cached = this.cache.get(blockId)

    if (cached && cached._cacheKey === cacheKey) {
      return cached  // Cache hit - O(1)
    }

    // Cache miss - compute
    const resolved = this.computeStyle(context)
    resolved._cacheKey = cacheKey
    this.cache.set(blockId, resolved)
    return resolved
  }

  private computeCacheKey(blockId: string, ctx: StyleContext): string {
    // Fast hash of version numbers - no deep comparison
    return `${this.projectVersion}:${this.documentVersions.get(ctx.docId) || 0}:${this.pageVersions.get(ctx.pageId) || 0}:${ctx.blockStyleVersion}`
  }

  // Targeted invalidation
  invalidateProject() { this.projectVersion++ }
  invalidateDocument(docId: string) { this.documentVersions.set(docId, (this.documentVersions.get(docId) || 0) + 1) }
  invalidatePage(pageId: string) { this.pageVersions.set(pageId, (this.pageVersions.get(pageId) || 0) + 1) }
}
```

### Performance Thresholds

| Operation | Target | Red Flag |
|-----------|--------|----------|
| Style cache hit | < 0.01ms | > 0.1ms |
| Full style resolution | < 0.5ms | > 2ms |
| Batch invalidation (1000 blocks) | < 5ms | > 20ms |
| Batch style update (100 blocks) | < 16ms | 50ms |
| Document load (visible pages) | < 200ms | 500ms |
| Keystroke response | < 16ms | 33ms (30fps) |
| Undo/redo | < 50ms | 100ms |
| Auto-save | < 100ms | 300ms |

### Memory Thresholds

| Metric | Target | Hard Limit |
|--------|--------|------------|
| Loaded pages in memory | 20-30 | 50 |
| Total blocks in memory | < 3,000 | 5,000 |
| ProseMirror doc size | < 50MB | 100MB |
| Memory per 1000 blocks | < 20MB | 50MB |
| Undo history steps | < 100 | 150 |

### Large Document Handling: Virtual Page Loading

```typescript
class DocumentLoader {
  private loadedPages = new Map<string, PageContent>()
  private lruCache = new LRUCache<string, PageContent>(20)
  private observer: IntersectionObserver

  constructor(private editor: Editor) {
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      { rootMargin: '200% 0px' }  // Load 2 viewports ahead
    )
  }

  private handleIntersection(entries: IntersectionObserverEntry[]) {
    const toLoad: string[] = []

    for (const entry of entries) {
      const pageId = entry.target.dataset.pageId
      if (entry.isIntersecting && !this.loadedPages.has(pageId)) {
        toLoad.push(pageId)
      }
    }

    if (toLoad.length > 0) {
      requestIdleCallback(() => this.batchLoadPages(toLoad))
    }
  }
}
```

### Batch Block Operations

```typescript
function applyStylesToSelection(
  editor: Editor,
  blockIds: string[],
  styleUpdates: Partial<BlockStyle>
) {
  // CRITICAL: Single transaction for atomicity + undo
  const tr = editor.state.tr

  // Sort by position descending to avoid position shifts
  const blocksWithPos = blockIds
    .map(id => ({ id, pos: getBlockPos(editor.state.doc, id) }))
    .sort((a, b) => b.pos - a.pos)

  for (const { id, pos } of blocksWithPos) {
    const node = editor.state.doc.nodeAt(pos)
    if (node) {
      tr.setNodeMarkup(pos, null, {
        ...node.attrs,
        style: { ...node.attrs.style, ...styleUpdates }
      })
    }
  }

  editor.view.dispatch(tr)
}
```

### Batch Operation Thresholds

| Blocks | Strategy |
|--------|----------|
| 1-50 | Synchronous, single transaction |
| 51-200 | Synchronous, defer style resolution |
| 201-1000 | Chunked with `requestIdleCallback` |
| 1000+ | Show progress indicator, chunk in 100s |

### Linked Block Propagation

```typescript
class LinkedBlockManager {
  async onSourceBlockChange(sourceId: string, changes: BlockChanges) {
    const targets = this.dependencyGraph.get(sourceId)
    if (!targets || targets.size === 0) return

    const openDocs = useDocumentStore.getState().openDocuments
    const immediateUpdates: UpdateInfo[] = []
    const queuedUpdates: UpdateInfo[] = []

    for (const targetId of targets) {
      const targetDoc = this.getDocumentForBlock(targetId)

      if (openDocs.has(targetDoc)) {
        immediateUpdates.push({ blockId: targetId, changes })
      } else {
        // Queue for when doc opens (Tauri backend)
        queuedUpdates.push({ docId: targetDoc, blockId: targetId, changes })
      }
    }

    if (immediateUpdates.length > 0) {
      this.batchApplyChanges(immediateUpdates)
    }

    if (queuedUpdates.length > 0) {
      await invoke('queue_linked_updates', { updates: queuedUpdates })
    }
  }
}
```

### Rendering: CSS Variables Over Inline Styles

```typescript
// Block applies CSS variables, not inline styles
function Block({ blockId, computedStyle }) {
  const cssVars = useMemo(() => ({
    '--block-font-family': computedStyle.fontFamily,
    '--block-font-size': `${computedStyle.fontSize}px`,
    '--block-font-weight': computedStyle.fontWeight,
    '--block-line-height': computedStyle.lineHeight,
    '--block-color': computedStyle.color,
  }), [computedStyle])

  return (
    <div
      className="block"
      data-block-id={blockId}
      style={cssVars as React.CSSProperties}
    >
      {/* Content references --block-* variables */}
    </div>
  )
}
```

**CSS Variables vs Inline: 1000 blocks benchmark**
| Method | Update Time | Reflow |
|--------|-------------|--------|
| Inline styles | 45ms | Full |
| CSS Variables | 12ms | Partial |
| CSS Variables (batched) | 8ms | Minimal |

---

## UI Flexibility Architecture

### Storage Hierarchy

```
USER PROFILE (Tauri persist store @ app-data)
├── Keyboard shortcuts
├── Toolbar configuration
├── Panel positions/visibility
├── Device-specific settings
├── Default theme preference
├── Recent files, workspace state
├── Font library (custom fonts)
└── Color palettes user created

PROJECT (stored in project config, travels with folder)
├── Project-wide named styles
├── Project color palette overrides
├── Project typography presets
└── Default document settings

DOCUMENT (embedded in .serq file)
├── Style metadata
├── Document-specific named styles
├── Page layout config
├── Heading custom styles
└── Paragraph/block spacing

PAGE → BLOCK → CHARACTER (ProseMirror document)
├── Inline marks
├── Block-level attributes
└── Named style references
```

### Command Registry Pattern

All UI interactions route through a central command registry:

```typescript
interface CommandDefinition {
  id: string
  name: string
  description: string
  category: 'formatting' | 'block' | 'navigation' | 'file' | 'view' | 'style'

  execute: (context: CommandContext) => void
  isActive?: (context: CommandContext) => boolean
  canExecute?: (context: CommandContext) => boolean
  parameters?: CommandParameter[]
  icon?: string
  keywords?: string[]
}

class CommandRegistry {
  private commands = new Map<string, CommandDefinition>()

  execute(commandId: string, params?: Record<string, unknown>): boolean {
    const command = this.commands.get(commandId)
    if (!command) return false

    const context = this.buildContext()
    if (command.canExecute && !command.canExecute(context)) return false

    command.execute({ ...context, params })
    return true
  }

  search(query: string): CommandDefinition[] {
    const lower = query.toLowerCase()
    return this.getAll().filter(cmd =>
      cmd.name.toLowerCase().includes(lower) ||
      cmd.keywords?.some(k => k.toLowerCase().includes(lower))
    )
  }
}
```

### Interaction Flow

```
┌────────────┬────────────┬────────────┬────────────┬────────────┐
│  Toolbar   │  Shortcut  │  Context   │  Command   │  Touch     │
│  Button    │  Key       │  Menu      │  Palette   │  Gesture   │
└─────┬──────┴─────┬──────┴─────┬──────┴─────┬──────┴─────┬──────┘
      └────────────┴────────────┴────────────┴────────────┘
                              │
                              ▼
                   ┌──────────────────┐
                   │ commandRegistry  │
                   │    .execute()    │
                   └────────┬─────────┘
                            │
           ┌────────────────┼────────────────┐
           ▼                ▼                ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │   Editor    │  │  Style      │  │   Other     │
    │   Commands  │  │  Store      │  │   Effects   │
    └─────────────┘  └─────────────┘  └─────────────┘
```

### Device-Specific Settings

Same document format everywhere. Only UI chrome differs:

```typescript
interface DeviceSettings {
  deviceType: 'desktop' | 'tablet' | 'phone'
  deviceId: string

  input: {
    touchSensitivity: number
    longPressDuration: number
    swipeThreshold: number
  }

  ui: {
    toolbarPosition: 'top' | 'bottom' | 'floating'
    toolbarSize: 'compact' | 'regular' | 'large'
    panelBehavior: 'slide' | 'overlay' | 'modal'
    showBlockHandles: boolean
    hapticFeedback: boolean
  }
}
```

### Touch Gesture Mapping

```typescript
interface GestureMapping {
  gesture: 'swipe-left' | 'swipe-right' | 'long-press' | 'double-tap' | 'pinch'
  context: 'editor' | 'block' | 'toolbar'
  commandId: string
}

const DEFAULT_GESTURES: GestureMapping[] = [
  { gesture: 'swipe-left', context: 'editor', commandId: 'undo' },
  { gesture: 'swipe-right', context: 'editor', commandId: 'redo' },
  { gesture: 'long-press', context: 'block', commandId: 'show-block-menu' },
  { gesture: 'pinch-out', context: 'editor', commandId: 'zoom-in' },
]
```

### Accessibility Metadata

```typescript
interface AccessibleBlockAttrs {
  role?: 'heading' | 'paragraph' | 'list' | 'figure' | 'blockquote'
  ariaLabel?: string
  ariaDescribedBy?: string
  lang?: string  // If different from document
}

interface AccessibilityMetadata {
  lang: string           // 'en', 'he', 'fr'
  dir: 'ltr' | 'rtl' | 'auto'
  title: string
  summary?: string
  imageAltTextRequired: boolean
}
```

---

## Schema Versioning & OTA Updates

### Version Numbering Scheme

```
App Version: 2.3.1 (marketing, frequent changes)
Schema Version: 3 (integer, breaking changes only)
Format Version: 1.3 (major.minor - major = breaking, minor = additive)
```

### Self-Describing Documents

Every `.serq` file must be self-describing:

```typescript
interface SerqDocument {
  meta: {
    schemaVersion: number          // Breaking changes: 1, 2, 3...
    formatVersion: string          // "1.3" - minor = additive fields
    createdWith: string            // "SERQ/2.3.1" - debugging gold
    createdAt: string              // ISO 8601
    lastModifiedWith: string       // "SERQ/2.4.0"
    lastModifiedAt: string
    documentId: string             // UUID v4

    // Forward compatibility - CRITICAL
    unknownExtensions?: Record<string, unknown>
  }

  content: ProseMirrorDoc
  settings: DocumentSettings
  extensions?: Record<string, unknown>
}
```

### Migration Registry

```typescript
interface Migration {
  fromVersion: number
  toVersion: number
  description: string
  migrate: (doc: unknown) => unknown
  validate?: (doc: unknown) => boolean
}

class MigrationRegistry {
  private migrations: Map<number, Migration> = new Map()
  private currentSchemaVersion: number

  register(migration: Migration): void {
    if (migration.toVersion !== migration.fromVersion + 1) {
      throw new Error('Migrations must be sequential')
    }
    this.migrations.set(migration.fromVersion, migration)
  }

  getMigrationChain(fromVersion: number, toVersion: number): Migration[] {
    const chain: Migration[] = []
    let current = fromVersion

    while (current < toVersion) {
      const migration = this.migrations.get(current)
      if (!migration) {
        throw new Error(`No migration path from v${current}`)
      }
      chain.push(migration)
      current++
    }

    return chain
  }

  async migrate(
    doc: unknown,
    fromVersion: number,
    options: { toVersion?: number; dryRun?: boolean } = {}
  ): Promise<MigrationResult> {
    const { toVersion = this.currentSchemaVersion, dryRun = false } = options

    if (fromVersion === toVersion) {
      return { success: true, document: doc, migrationsApplied: 0 }
    }

    if (fromVersion > toVersion) {
      return { success: false, error: new FutureDocumentError(fromVersion, toVersion) }
    }

    const chain = this.getMigrationChain(fromVersion, toVersion)
    let current = structuredClone(doc)

    for (const migration of chain) {
      current = migration.migrate(current)
      if (migration.validate && !migration.validate(current)) {
        return { success: false, error: new ValidationError() }
      }
      (current as any).meta.schemaVersion = migration.toVersion
    }

    return { success: true, document: current, migrationsApplied: chain.length }
  }
}
```

### Forward Compatibility: Never Discard Unknown Data

```typescript
interface BlockAttrs {
  // Known attributes
  id: string
  style: BlockStyle

  // CRITICAL: Catch-all for future attributes
  [key: string]: unknown
}

// Unknown block types - wrap, don't discard
function preserveUnknownBlock(node: any): PreservedNode {
  return {
    type: '__unknown__',
    attrs: {
      originalType: node.type,
      originalData: node,  // Preserve EVERYTHING
      preservedAt: new Date().toISOString(),
      preservedByVersion: APP_VERSION
    }
  }
}
```

### Block Type Registry (Plugin System)

```typescript
interface BlockTypeDefinition {
  type: string
  version: number
  displayName: string
  category: 'text' | 'media' | 'embed' | 'layout' | 'data'

  schema: {
    attrs: Record<string, AttrDefinition>
    content?: string
  }

  node: NodeSpec
  component: React.ComponentType

  // Block-level migrations
  migrations?: BlockMigration[]

  source?: {
    type: 'core' | 'plugin' | 'user'
    pluginId?: string
  }
}

class BlockTypeRegistry {
  private types: Map<string, BlockTypeDefinition> = new Map()

  register(definition: BlockTypeDefinition): void {
    if (this.types.has(definition.type)) {
      const existing = this.types.get(definition.type)!
      if (existing.source?.type === 'core') {
        throw new Error(`Cannot override core block type: ${definition.type}`)
      }
    }
    this.types.set(definition.type, definition)
  }

  getPlaceholderForDisabled(type: string): BlockTypeDefinition {
    return {
      type: '__disabled_plugin_block__',
      version: 1,
      displayName: `Disabled: ${type}`,
      category: 'text',
      schema: { attrs: { originalData: { default: null } } },
      node: createPlaceholderNodeSpec(type),
      component: DisabledPluginBlockComponent,
      source: { type: 'core' }
    }
  }
}
```

### OTA Update Document Protection

```typescript
class DocumentGuard {
  private dirtyDocuments: Map<string, DirtyDocumentState> = new Map()

  canApplyUpdate(): UpdateReadiness {
    if (this.dirtyDocuments.size === 0) {
      return { ready: true }
    }

    return {
      ready: false,
      reason: 'unsaved_documents',
      documents: Array.from(this.dirtyDocuments.entries())
        .map(([id, state]) => ({
          id,
          title: state.title,
          unsavedChanges: state.changeCount
        }))
    }
  }

  async prepareForUpdate(): Promise<PrepareResult> {
    const unsaved = Array.from(this.dirtyDocuments.entries())

    // Force save all documents
    const saveResults = await Promise.allSettled(
      unsaved.map(([id, state]) => this.forceSave(id, state))
    )

    const failed = saveResults.filter(r => r.status === 'rejected')

    if (failed.length > 0) {
      await this.createEmergencyBackup(unsaved)
      return { success: false, backupCreated: true }
    }

    return { success: true }
  }
}
```

### Migration Testing Strategy

```typescript
describe('Migration Matrix', () => {
  const paths = [[1, 2], [1, 3], [2, 3], [2, 4], [3, 4]]

  for (const [from, to] of paths) {
    describe(`v${from} -> v${to}`, () => {
      it('migrates correctly', async () => {
        const doc = generateTestDoc(from)
        const result = await migrationRegistry.migrate(doc, from, { toVersion: to })

        expect(result.success).toBe(true)
        expect(result.document.meta.schemaVersion).toBe(to)
      })

      it('preserves unknown attributes', async () => {
        const doc = { ...generateTestDoc(from), __futureAttr: { some: 'data' } }
        const result = await migrationRegistry.migrate(doc, from, { toVersion: to })

        expect(result.document.__futureAttr).toEqual({ some: 'data' })
      })
    })
  }

  // Property-based testing
  it('migrations are idempotent', () => {
    fc.assert(
      fc.property(arbitraryDocument(), async (doc) => {
        const once = await migrationRegistry.migrate(doc, doc.meta.schemaVersion)
        const twice = await migrationRegistry.migrate(once.document, once.document.meta.schemaVersion)
        expect(once.document).toEqual(twice.document)
      })
    )
  })
})
```

---

## What NOT To Do

| Don't | Do Instead |
|-------|------------|
| Resolve styles in render | Pre-compute, subscribe to store |
| Load entire document | Virtual/lazy load pages |
| Individual transactions per block | Batch into single transaction |
| Deep object comparison for cache | Version counters + shallow keys |
| Inline styles per block | CSS variables |
| Store full doc in undo history | Delta compression + snapshots |
| Sync linked blocks to closed docs | Queue for on-open application |
| More than 100 synchronous block updates | Chunk with requestIdleCallback |
| Decorations for static styling | CSS classes, variables |
| Discard unknown data | Preserve everything |
| Custom file extensions without export | Support all standard formats |
| Direct filesystem on mobile | Use platform APIs |

---

## Universal Import/Export System

**Philosophy:** SERQ is "The Last Editor You'll Ever Need" - documents must survive the future.

### Export Formats (All Required)

| Format | Extension | Priority | Notes |
|--------|-----------|----------|-------|
| PDF | `.pdf` | Critical | Smallest file size, compression, image compression option |
| Microsoft Word | `.docx` | Critical | Full style mapping required |
| Markdown | `.md` | Critical | Future-proof, universal |
| Plain Text | `.txt` | Critical | Ultimate portability |
| HTML | `.html` | High | Standard web format |
| SERQ HTML | `.shtml` | High | Our format with schema - readable by any HTML app |
| Apple Pages | `.pages` | High | macOS/iOS native |
| Google Docs | `.gdoc` | High | Cloud integration |
| RTF | `.rtf` | Medium | Legacy compatibility |
| EPUB | `.epub` | Medium | E-book distribution |

### Import Formats (Mirror Export)

All formats we export, we also import. Round-trip fidelity is the goal.

### PDF Export Configuration

```typescript
interface PDFExportOptions {
  // Compression
  compression: 'none' | 'low' | 'medium' | 'high' | 'maximum'
  imageCompression: boolean
  imageQuality: number  // 0.1-1.0
  embedFonts: boolean

  // Output
  pageSize: 'A4' | 'Letter' | 'Legal' | 'custom'
  orientation: 'portrait' | 'landscape'
  margins: MarginConfig

  // Features
  includeOutline: boolean  // TOC/bookmarks
  includeLinks: boolean
  includeMetadata: boolean

  // Accessibility
  taggedPDF: boolean  // Screen reader support
}
```

### SHTML Format (SERQ HTML)

Open format based on HTML with semantic schema. Any HTML viewer can open it, but SERQ can fully round-trip.

```html
<!DOCTYPE html>
<html lang="en" data-serq-version="1.0">
<head>
  <meta charset="UTF-8">
  <meta name="serq:schema" content="1.0">
  <meta name="serq:document-id" content="uuid-here">
  <style>
    /* Embedded styles for standalone viewing */
  </style>
</head>
<body data-serq-document>
  <article data-serq-page="1">
    <section data-serq-block="uuid" data-serq-type="heading" data-serq-level="1">
      <h1>Document Title</h1>
    </section>
    <section data-serq-block="uuid" data-serq-type="paragraph">
      <p>Content here...</p>
    </section>
  </article>

  <!-- SERQ metadata for round-trip -->
  <script type="application/json" id="serq-metadata">
    { "blocks": [...], "styles": [...], "settings": {...} }
  </script>
</body>
</html>
```

### Future-Proof Formats

Markdown and TXT are our "escape hatches" - if SERQ ever disappears, users can still read their documents. Design decisions:

1. **Markdown export preserves structure** - headings, lists, code blocks
2. **TXT export preserves reading order** - clean, linear text
3. **Both strip proprietary metadata** - only content survives
4. **Import reconstructs structure** - smart parsing to rebuild blocks

---

## AI Integration Architecture

**Core Principle:** AI is the central nervous system, not a bolted-on feature.

### System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              SERQ                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        Input Layer                                │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐             │  │
│  │  │Keyboard │  │  Mouse  │  │  Voice  │  │ AI Chat │             │  │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘             │  │
│  │       └────────────┴─────┬──────┴────────────┘                   │  │
│  │                          ▼                                       │  │
│  │              ┌───────────────────────┐                           │  │
│  │              │   Command Registry    │ <-- Single source of      │  │
│  │              │   (All actions here)  │     truth for ALL ops     │  │
│  │              └───────────┬───────────┘                           │  │
│  └──────────────────────────┼───────────────────────────────────────┘  │
│                             │                                          │
│  ┌──────────────────────────┼───────────────────────────────────────┐  │
│  │                          ▼           AI Layer                    │  │
│  │  ┌───────────────────────────────────────────────────────────┐   │  │
│  │  │                    AI Orchestrator                        │   │  │
│  │  │  - Claude API (latest model at each release)              │   │  │
│  │  │  - Tool execution via Command Registry                    │   │  │
│  │  │  - Context management                                     │   │  │
│  │  │  - Permission enforcement                                 │   │  │
│  │  └───────────────────────┬───────────────────────────────────┘   │  │
│  │                          │                                       │  │
│  │  ┌───────────────────────┼───────────────────────────────────┐   │  │
│  │  │                 Agent Supervisor                           │   │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │   │  │
│  │  │  │ Research │  │ Validate │  │ Literary │  │  Custom  │  │   │  │
│  │  │  │  Agent   │  │  Agent   │  │  Agent   │  │  Agents  │  │   │  │
│  │  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │   │  │
│  │  └───────────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### AI Access Model

AI has hooks into every aspect of the application through the unified Command Registry:

```typescript
interface AICapabilities {
  // Document access
  read: {
    blocks: boolean
    styles: boolean
    metadata: boolean
    history: boolean
  }

  // Document modification
  write: {
    content: boolean
    styles: boolean
    structure: boolean
  }

  // App control
  execute: {
    formatting: boolean
    navigation: boolean
    export: boolean
    settings: boolean
  }

  // Agent spawning
  agents: {
    spawn: boolean
    supervise: boolean
    terminate: boolean
  }
}
```

### Block-Level AI Metadata

Every block carries AI-relevant metadata:

```typescript
interface AIBlockMetadata {
  // Provenance
  source: 'user' | 'ai' | 'agent' | 'voice' | 'import'
  sourceAgent?: string
  sourceModel?: string

  // AI hints
  semanticType?: 'claim' | 'quote' | 'statistic' | 'opinion' | 'instruction'
  confidenceScore?: number
  needsVerification?: boolean

  // Permissions
  aiReadable: boolean
  aiWritable: boolean
}
```

### Autonomous Agent System

#### Agent Types

| Agent | Purpose | Trigger | Output |
|-------|---------|---------|--------|
| Research Agent | Web research while writing | Content change (debounced) | Citation suggestions |
| Validation Agent | Fact-check claims, verify data | Claims detected | Verification status, sources |
| Literary Agent | Tone/style consistency | Paragraph completion | Style suggestions |
| Custom Agents | User-defined | Configurable | Configurable |

#### Agent Architecture

```typescript
interface AgentConfig {
  id: string
  name: string

  capabilities: {
    canRead: boolean
    canWrite: boolean      // false = suggest only
    canSearch: boolean
    canSpawnSubAgents: boolean
  }

  triggers: AgentTrigger[]

  model: string           // Claude model to use
  systemPrompt: string
  tools: ToolDefinition[]

  // Limits
  maxTokensPerRun: number
  maxRuntime: number
  priority: 'low' | 'normal' | 'high'
}

interface AgentTrigger {
  type: 'content-change' | 'idle' | 'explicit' | 'schedule' | 'content-match'
  config: {
    debounceMs?: number
    idleMs?: number
    pattern?: string        // Regex
    semanticMatch?: string  // Natural language pattern
  }
}
```

#### Agent Supervisor (Conflict Resolution)

```typescript
class AgentSupervisor {
  // Spawns/kills agents
  // Routes messages between agents
  // Resolves write conflicts
  // Enforces permissions

  async requestWrite(agentId: string, operations: Operation[]): Promise<boolean> {
    // Check capabilities
    // Check for conflicts with other agents
    // Acquire locks
    // Return permission
  }
}
```

### Voice Integration

```
┌──────────────────────────────────────────────────────────────────┐
│                        Voice Pipeline                            │
├──────────────────────────────────────────────────────────────────┤
│   Microphone → VAD → Transcription → Intent Router               │
│                         (Whisper)           │                    │
│                                    ┌────────┴────────┐           │
│                                    ▼                 ▼           │
│                              ┌──────────┐     ┌───────────┐      │
│                              │ Command  │     │ Dictation │      │
│                              │ Parser   │     │ Inserter  │      │
│                              │ (Claude) │     │           │      │
│                              └────┬─────┘     └─────┬─────┘      │
│                                   ▼                 ▼            │
│                              Command            Text Insert      │
│                              Registry           at Cursor        │
└──────────────────────────────────────────────────────────────────┘
```

#### Voice Capabilities

| Feature | Description |
|---------|-------------|
| Dictation | Real-time speech to text at cursor |
| Commands | "Make this heading bold", "Move paragraph up" |
| Voice Notes | Audio attached to document with transcription |
| Video Notes | Video attached with transcription |
| Auto-detect | Smart classification of command vs dictation |

#### Voice Block Types

```typescript
// Voice note extension
interface VoiceNoteAttrs {
  audioUrl: string
  duration: number
  transcript: string
  transcriptionStatus: 'pending' | 'processing' | 'complete' | 'error'
  recordedAt: string
}

// Video note extension
interface VideoNoteAttrs {
  videoUrl: string
  duration: number
  transcript: string
  thumbnailUrl: string
  transcriptionStatus: 'pending' | 'processing' | 'complete' | 'error'
  recordedAt: string
}
```

### Proactive AI System

#### Trigger Levels

| Level | Behavior |
|-------|----------|
| Off | No proactive suggestions |
| Minimal | Only critical issues (broken links, errors) |
| Balanced | Grammar, citations, style consistency |
| Aggressive | Continuations, expansions, rewrites |

#### Non-Intrusive UI Patterns

1. **Ghost text** - Grayed continuation, Tab to accept
2. **Margin annotations** - Like Google Docs comments
3. **Sidebar nudges** - Collapsible panel with suggestions
4. **Floating bubbles** - Auto-dismiss, non-blocking

### Context Management

AI needs document context without overwhelming token limits.

```typescript
interface ContextWindow {
  // Always included
  systemPrompt: string
  documentMetadata: DocumentMetadata
  currentBlock: SerqBlock

  // Sliding window around cursor
  surroundingBlocks: SerqBlock[]  // N blocks before/after

  // Compressed
  documentSummary: string         // AI-generated
  recentChanges: Change[]

  // Conversation
  conversationHistory: Message[]  // Truncated to last N turns

  // Optional expansions
  relevantBlocks?: SerqBlock[]    // Semantically relevant
}
```

#### Context Strategy

1. **Current block** - Always full content
2. **Window** - 10 blocks around cursor
3. **Summary** - AI-generated doc summary, refresh after N changes
4. **Embeddings** - Semantic search for relevant blocks outside window
5. **Conversation** - Truncate old turns, keep system + recent

### AI Security & Privacy

#### Permission System

```typescript
interface AIPermissions {
  // Global toggles
  aiEnabled: boolean
  voiceEnabled: boolean
  backgroundAgentsEnabled: boolean

  // Data handling
  sendContentToAPI: boolean
  storeConversations: boolean

  // Per-capability
  capabilities: {
    read: 'all' | 'visible' | 'none'
    write: 'all' | 'suggest-only' | 'none'
    execute: 'all' | 'safe-only' | 'none'
  }

  // Block-level
  blockOverrides: Map<string, { aiReadable: boolean; aiWritable: boolean }>
}
```

#### Audit Trail

```typescript
interface AuditEvent {
  timestamp: number
  type: 'ai-read' | 'ai-write' | 'ai-command' | 'agent-spawn' | 'api-call'
  source: 'chat' | 'voice' | 'agent'
  agentId?: string
  documentId: string
  blockIds?: string[]
  commandId?: string
  status: 'success' | 'error' | 'denied'
}
```

Every AI action is logged for user review.

#### Local vs Cloud Processing

```typescript
interface ProcessingDecision {
  location: 'local' | 'cloud'
  reason: string
}

// Sensitive content detection triggers local processing
// User preference for local-only honored
// Fallback to cloud only with explicit permission
```

### AI-Enhanced Commands

All commands exposed to AI through the unified registry:

```typescript
registry.register({
  id: 'ai.rewrite',
  name: 'AI Rewrite',
  category: 'ai',

  aiSchema: {
    description: 'Rewrite content (simplify, expand, tone shift)',
    parameters: {
      type: 'object',
      properties: {
        instruction: { type: 'string' },
        blockIds: { type: 'array', items: { type: 'string' } },
        preserveTone: { type: 'boolean' }
      },
      required: ['instruction']
    }
  },

  execute: async (args) => {
    // AI processes and applies rewrite
  }
})
```

---

## What NOT To Do (Updated)

| Don't | Do Instead |
|-------|------------|
| Resolve styles in render | Pre-compute, subscribe to store |
| Load entire document | Virtual/lazy load pages |
| Individual transactions per block | Batch into single transaction |
| Deep object comparison for cache | Version counters + shallow keys |
| Inline styles per block | CSS variables |
| Store full doc in undo history | Delta compression + snapshots |
| Sync linked blocks to closed docs | Queue for on-open application |
| More than 100 synchronous block updates | Chunk with requestIdleCallback |
| Decorations for static styling | CSS classes, variables |
| Discard unknown data | Preserve everything |
| Custom file extensions without export | Support all standard formats |
| Direct filesystem on mobile | Use platform APIs |
| Bolt AI on as afterthought | Build AI as core architecture layer |
| Send all content to API | Respect privacy settings, detect sensitive |
| Let agents conflict | Supervisor with conflict resolution |

---

*Architecture Version: 4.0*
*Created: 2026-02-04*
*Updated: 2026-02-04 (AI Integration + Universal Export)*
*Experts Consulted: Platform Deployment, Database/Data Structure, Performance, UI/UX, Versioning/Compatibility, AI Integration*
