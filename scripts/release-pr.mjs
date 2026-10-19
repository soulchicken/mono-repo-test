import { execFileSync } from 'node:child_process'

const [base, head] = process.argv.slice(2)
if (!base || !head) throw new Error('Usage: node scripts/release-pr.mjs <base-ref> <head-ref>')
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()
const files = (ref) => git('ls-tree', '-r', '--name-only', ref).split('\n')
const read = (ref, file) => git('show', `${ref}:${file}`)
const headFiles = files(head)
const baseFiles = new Set(files(base))

for (const file of headFiles.filter((file) =>
  /^\.changeset\/(?!README\.md$)[^/]+\.md$/.test(file),
)) {
  const frontmatter = read(head, file).match(/^---[ \t]*\r?\n([\s\S]*?)^---[ \t]*(?:\r?\n|$)/m)?.[1]
  if (frontmatter === undefined || frontmatter.trim() !== '') {
    throw new Error(`Unreleased changeset: ${file}. Merge the version PR into develop first.`)
  }
}

const releases = []
for (const file of headFiles.filter((file) =>
  /^(apps|packages)\/[^/]+\/package\.json$/.test(file),
)) {
  const pkg = JSON.parse(read(head, file))
  const previous = baseFiles.has(file) ? JSON.parse(read(base, file)) : undefined
  if (pkg.version === previous?.version || pkg.version === '0.0.0') continue

  const changelog = file.replace(/package\.json$/, 'CHANGELOG.md')
  if (
    !headFiles.includes(changelog) ||
    !read(head, changelog).split('\n').includes(`## ${pkg.version}`)
  ) {
    throw new Error(
      `Missing CHANGELOG entry for ${pkg.name}@${pkg.version}. Prepare a version PR first.`,
    )
  }
  releases.push({ name: pkg.name, oldVersion: previous?.version ?? null, version: pkg.version })
}
releases.sort((a, b) => a.name.localeCompare(b.name))
const title = releases.length
  ? `release: ${releases.map((pkg) => `${pkg.name}@${pkg.version}`).join(', ')}`
  : 'chore: sync develop to main'

console.log(JSON.stringify({ title, releases }))
