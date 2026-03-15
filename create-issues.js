#!/usr/bin/env node

import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const issues = JSON.parse(readFileSync(join(__dirname, 'issues.json'), 'utf8'))

// Check gh CLI is available
try {
  execSync('gh auth status', { stdio: 'ignore' })
} catch {
  console.error('❌ gh CLI not authenticated. Run: gh auth login')
  process.exit(1)
}

// Create labels that don't exist yet (gh won't error on duplicates with --force)
const allLabels = [...new Set(issues.flatMap((i) => i.labels))]
const labelColors = {
  setup: '0075ca',
  ui: 'e4e669',
  state: 'd93f0b',
  shared: '0052cc',
  filesystem: '1d76db',
  ipc: '5319e7',
  feature: '0e8a16',
  devops: 'b60205',
  'phase-1': 'c2e0c6',
  'phase-2': 'bfdadc',
  'phase-3': 'fef2c0',
  'phase-4': 'f9d0c4',
  'phase-5': 'e99695'
}

console.log('🏷️  Ensuring labels exist...\n')
for (const label of allLabels) {
  try {
    const color = labelColors[label] ?? 'ededed'
    execSync(`gh label create "${label}" --color "${color}" --force`, {
      stdio: 'ignore'
    })
    console.log(`  ✓ ${label}`)
  } catch {
    console.warn(`  ⚠ Could not create label: ${label}`)
  }
}

console.log('\n📋 Creating issues...\n')

let created = 0
let failed = 0

for (const issue of issues) {
  try {
    const labels = issue.labels.join(',')
    const result = execSync(
      `gh issue create --title ${JSON.stringify(issue.title)} --body ${JSON.stringify(issue.body)} --label ${JSON.stringify(labels)}`,
      { encoding: 'utf8' }
    )
    const url = result.trim()
    console.log(`  ✓ ${issue.title}\n    ${url}`)
    created++
  } catch (err) {
    console.error(`  ✗ FAILED: ${issue.title}`)
    console.error(`    ${err.message}`)
    failed++
  }
}

console.log(`\n✅ Done — ${created} created, ${failed} failed.`)
